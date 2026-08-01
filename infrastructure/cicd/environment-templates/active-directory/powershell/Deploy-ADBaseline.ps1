#Requires -Modules ActiveDirectory
<#
.SYNOPSIS
    Idempotently applies a baseline configuration (tiered OUs, security groups,
    a fine-grained password policy, tier-admin groups and an example gMSA) to an
    EXISTING Active Directory domain.

.DESCRIPTION
    This script does NOT create a forest or promote a domain controller. It
    assumes the domain already exists and is reachable, and that it runs under
    an identity with delegated rights to create the objects below. It is safe to
    re-run: every object is created only if it does not already exist
    (create-if-missing), so repeated runs converge on the same state.

    Because the cmdlets used support -WhatIf (via SupportsShouldProcess), running
    the script with -WhatIf previews every change WITHOUT modifying the domain.
    ALWAYS run with -WhatIf first, especially against production.

    What it configures (driven entirely by the -ConfigPath data file):
      * A tiered OU structure (Tier0/Tier1/Tier2 under OU=Admin, plus top-level
        Users / Workstations / Servers / Groups / ServiceAccounts OUs).
      * Core security groups, including per-tier admin groups (Tier0/1/2-Admins).
      * A fine-grained password policy (PSO) applied to a service-account group.
      * An example group Managed Service Account (gMSA).

.PARAMETER DomainDN
    The distinguished name of the target domain naming context,
    e.g. 'DC=corp,DC=example,DC=com'. All relative OU/group paths in the config
    file are appended to this. If omitted, the current domain's DN is used.

.PARAMETER ConfigPath
    Path to the baseline .psd1 data file. Defaults to config/baseline.psd1
    next to this script.

.PARAMETER Server
    Optional target domain controller / AD Web Services endpoint (FQDN). Passed
    as -Server to every AD cmdlet. If omitted, the module discovers a DC.

.PARAMETER Credential
    Optional [PSCredential] to run the AD operations as. Omit this when the
    runner already has domain rights (e.g. a gMSA runner identity or a
    domain-joined runner running as a delegated account).

.EXAMPLE
    # Preview only - makes NO changes:
    .\Deploy-ADBaseline.ps1 -DomainDN 'DC=corp,DC=example,DC=com' -WhatIf

.EXAMPLE
    # Apply for real against a specific DC:
    .\Deploy-ADBaseline.ps1 -DomainDN 'DC=corp,DC=example,DC=com' -Server dc01.corp.example.com

.NOTES
    Run with -WhatIf first. Protect break-glass accounts. Follow the tiering
    model: never log a Tier 0 credential onto a Tier 1/2 host. See README.md.
#>
[CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'High')]
param(
    [Parameter()]
    [string] $DomainDN,

    [Parameter()]
    [string] $ConfigPath = (Join-Path $PSScriptRoot 'config/baseline.psd1'),

    [Parameter()]
    [string] $Server,

    [Parameter()]
    [System.Management.Automation.PSCredential] $Credential
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# -----------------------------------------------------------------------------
# Import the AD module up front so a missing RSAT install fails early and clearly.
# -----------------------------------------------------------------------------
Import-Module ActiveDirectory -ErrorAction Stop

# -----------------------------------------------------------------------------
# Build a splat of common parameters (-Server / -Credential) that we pass to
# every AD cmdlet, so callers can override the DC and the running identity.
# -----------------------------------------------------------------------------
$adCommon = @{}
if ($PSBoundParameters.ContainsKey('Server') -and $Server)         { $adCommon['Server'] = $Server }
if ($PSBoundParameters.ContainsKey('Credential') -and $Credential) { $adCommon['Credential'] = $Credential }

# -----------------------------------------------------------------------------
# Resolve the domain DN. If the caller did not pass one, discover the current
# domain. This DN is prepended to every RELATIVE path in the config file.
# -----------------------------------------------------------------------------
if (-not $DomainDN) {
    $DomainDN = (Get-ADDomain @adCommon).DistinguishedName
    Write-Verbose "No -DomainDN supplied; using discovered domain '$DomainDN'."
}
Write-Host "Target domain DN : $DomainDN"
if ($Server) { Write-Host "Target server    : $Server" }

# -----------------------------------------------------------------------------
# Load the baseline data file. Import-PowerShellDataFile safely evaluates a
# .psd1 (data only, no arbitrary code execution).
# -----------------------------------------------------------------------------
if (-not (Test-Path -LiteralPath $ConfigPath)) {
    throw "Config file not found: $ConfigPath"
}
$config = Import-PowerShellDataFile -LiteralPath $ConfigPath
Write-Host "Loaded baseline  : $ConfigPath"

# =============================================================================
# Helper functions
# =============================================================================

# Turn a RELATIVE path from the config (e.g. 'OU=Groups,OU=Tier0,OU=Admin')
# into a full DN by appending the domain naming context.
function Resolve-Dn {
    param([Parameter(Mandatory)][string] $RelativePath)
    return "$RelativePath,$DomainDN"
}

# Return $true if an AD object with the given DN already exists. We use
# Get-ADObject with -Filter (not -Identity) so a "not found" is an empty result
# rather than a terminating error we would have to catch.
function Test-ADObjectExists {
    param([Parameter(Mandatory)][string] $DistinguishedName)
    try {
        $obj = Get-ADObject -Filter "DistinguishedName -eq '$DistinguishedName'" @adCommon -ErrorAction Stop
        return [bool]$obj
    }
    catch {
        # A genuine query error (e.g. bad server) should surface, not be masked.
        throw "Failed to query AD for '$DistinguishedName': $($_.Exception.Message)"
    }
}

# =============================================================================
# 1. Organizational Units
#    Iterated PARENT-FIRST (the config lists them in dependency order).
#    OUs are created protected-from-accidental-deletion by default.
# =============================================================================
Write-Host "`n== Organizational Units =="
foreach ($ou in $config.OrganizationalUnits) {
    $ouDn = Resolve-Dn $ou.Path

    if (Test-ADObjectExists -DistinguishedName $ouDn) {
        Write-Host "  [skip] OU exists : $ouDn"
        continue
    }

    # Split the relative path into the leaf OU name and its parent container.
    # 'OU=Groups,OU=Tier0,OU=Admin' -> name 'Groups', parent 'OU=Tier0,OU=Admin'
    $firstComma = $ou.Path.IndexOf(',')
    if ($firstComma -ge 0) {
        $leaf         = $ou.Path.Substring(0, $firstComma)        # 'OU=Groups'
        $parentRel    = $ou.Path.Substring($firstComma + 1)       # 'OU=Tier0,OU=Admin'
        $parentDn     = Resolve-Dn $parentRel
    }
    else {
        $leaf     = $ou.Path                                      # 'OU=Users'
        $parentDn = $DomainDN                                     # directly under the domain root
    }
    $ouName = $leaf -replace '^OU=', ''

    # ShouldProcess makes -WhatIf / -Confirm work for this action.
    if ($PSCmdlet.ShouldProcess($ouDn, 'Create OU')) {
        New-ADOrganizationalUnit -Name $ouName `
                                 -Path $parentDn `
                                 -Description $ou.Description `
                                 -ProtectedFromAccidentalDeletion $true `
                                 @adCommon
        Write-Host "  [create] OU     : $ouDn"
    }
}

# =============================================================================
# 2. Security groups (including the per-tier admin groups)
# =============================================================================
Write-Host "`n== Security groups =="
foreach ($grp in $config.Groups) {
    $grpDn = Resolve-Dn ("CN=$($grp.Name)," + $grp.Path)

    if (Test-ADObjectExists -DistinguishedName $grpDn) {
        Write-Host "  [skip] group exists : $($grp.SamAccountName)"
        continue
    }

    $groupPathDn = Resolve-Dn $grp.Path
    if ($PSCmdlet.ShouldProcess($grpDn, "Create $($grp.Scope) $($grp.Category) group")) {
        New-ADGroup -Name $grp.Name `
                    -SamAccountName $grp.SamAccountName `
                    -GroupScope $grp.Scope `
                    -GroupCategory $grp.Category `
                    -Path $groupPathDn `
                    -Description $grp.Description `
                    @adCommon
        Write-Host "  [create] group  : $($grp.SamAccountName)  ($($grp.Scope))"
    }
}

# =============================================================================
# 3. Fine-grained password policy (PSO) + apply it to its target group(s)
# =============================================================================
Write-Host "`n== Fine-grained password policy (PSO) =="
$pso = $config.PasswordPolicy
$existingPso = Get-ADFineGrainedPasswordPolicy -Filter "Name -eq '$($pso.Name)'" @adCommon -ErrorAction SilentlyContinue

if ($existingPso) {
    Write-Host "  [skip] PSO exists : $($pso.Name)"
}
else {
    if ($PSCmdlet.ShouldProcess($pso.Name, 'Create fine-grained password policy')) {
        # Timespans in the config are d.hh:mm:ss strings; parse to [TimeSpan].
        New-ADFineGrainedPasswordPolicy `
            -Name                     $pso.Name `
            -DisplayName              $pso.DisplayName `
            -Description              $pso.Description `
            -Precedence               $pso.Precedence `
            -ComplexityEnabled        $pso.ComplexityEnabled `
            -ReversibleEncryptionEnabled $pso.ReversibleEncryption `
            -MinPasswordLength        $pso.MinPasswordLength `
            -PasswordHistoryCount     $pso.PasswordHistoryCount `
            -MinPasswordAge           ([TimeSpan]::Parse($pso.MinPasswordAge)) `
            -MaxPasswordAge           ([TimeSpan]::Parse($pso.MaxPasswordAge)) `
            -LockoutThreshold         $pso.LockoutThreshold `
            -LockoutObservationWindow ([TimeSpan]::Parse($pso.LockoutObservationWindow)) `
            -LockoutDuration          ([TimeSpan]::Parse($pso.LockoutDuration)) `
            @adCommon
        Write-Host "  [create] PSO     : $($pso.Name)"
    }
}

# Ensure the PSO is applied to each target group (idempotent: Add-...Subject
# fails if the subject is already assigned, so we check current subjects first).
foreach ($targetSam in $pso.AppliesToGroups) {
    $currentSubjects = @()
    try {
        $currentSubjects = (Get-ADFineGrainedPasswordPolicySubject -Identity $pso.Name @adCommon -ErrorAction SilentlyContinue).SamAccountName
    } catch { $currentSubjects = @() }

    if ($currentSubjects -contains $targetSam) {
        Write-Host "  [skip] PSO subject set : $targetSam"
        continue
    }
    if ($PSCmdlet.ShouldProcess("$($pso.Name) -> $targetSam", 'Apply PSO to group')) {
        Add-ADFineGrainedPasswordPolicySubject -Identity $pso.Name -Subjects $targetSam @adCommon
        Write-Host "  [apply] PSO subject   : $targetSam"
    }
}

# =============================================================================
# 4. Example group Managed Service Account (gMSA)
#    Requires a KDS root key in the forest (one-time). We warn (not fail) if it
#    is missing, because creating it needs Enterprise/Domain Admin and, in prod,
#    only becomes usable ~10 hours after creation (replication + effective time).
# =============================================================================
Write-Host "`n== group Managed Service Account (gMSA) =="
$gmsa = $config.Gmsa

# Check for a KDS root key. Get-KdsRootKey is available on a DC / with the KDS
# module; guard it so the script still runs where the cmdlet is absent.
$hasKdsKey = $false
if (Get-Command Get-KdsRootKey -ErrorAction SilentlyContinue) {
    try { $hasKdsKey = [bool](Get-KdsRootKey -ErrorAction SilentlyContinue) } catch { $hasKdsKey = $false }
    if (-not $hasKdsKey) {
        Write-Warning "No KDS root key found. gMSA creation will fail until one exists. Create it (Domain/Enterprise Admin) with:  Add-KdsRootKey -EffectiveImmediately   (prod keys become usable ~10h later)."
    }
}
else {
    Write-Warning "Get-KdsRootKey not available on this host; cannot verify KDS root key. gMSA creation requires one."
}

$existingGmsa = Get-ADServiceAccount -Filter "Name -eq '$($gmsa.Name)'" @adCommon -ErrorAction SilentlyContinue
if ($existingGmsa) {
    Write-Host "  [skip] gMSA exists : $($gmsa.Name)"
}
elseif (-not $hasKdsKey) {
    Write-Host "  [defer] gMSA '$($gmsa.Name)' not created (no KDS root key). Re-run after the key is effective."
}
else {
    $gmsaPathDn = Resolve-Dn $gmsa.Path
    if ($PSCmdlet.ShouldProcess($gmsa.Name, 'Create group Managed Service Account')) {
        New-ADServiceAccount `
            -Name        $gmsa.Name `
            -DNSHostName $gmsa.DNSHostName `
            -Description $gmsa.Description `
            -Path        $gmsaPathDn `
            -PrincipalsAllowedToRetrieveManagedPassword $gmsa.RetrieversGroup `
            -Enabled     $true `
            @adCommon
        Write-Host "  [create] gMSA    : $($gmsa.Name)"
    }
}

Write-Host "`nBaseline run complete.$(if ($WhatIfPreference) { '  (WhatIf preview - no changes were made.)' })"
