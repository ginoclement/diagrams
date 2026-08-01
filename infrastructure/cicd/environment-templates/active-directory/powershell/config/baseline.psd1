# =============================================================================
# baseline.psd1 - Active Directory baseline definition (PowerShell data file)
# -----------------------------------------------------------------------------
# This is a DATA file only: it declares WHAT the baseline should look like.
# The logic that creates/updates these objects lives in Deploy-ADBaseline.ps1.
#
# All values are GENERIC placeholders. Review and adapt every entry before
# applying to a real domain. Nothing here contains secrets.
#
# Path values below are RELATIVE distinguished names (no domain component).
# Deploy-ADBaseline.ps1 appends the domain naming context (-DomainDN), e.g.
#   'OU=Admin'  +  'DC=corp,DC=example,DC=com'
#     => 'OU=Admin,DC=corp,DC=example,DC=com'
#
# The design follows Microsoft's tiered administration model:
#   Tier 0 - identity control plane (DCs, ADFS/PKI, domain admins)
#   Tier 1 - servers / server admins
#   Tier 2 - workstations / helpdesk / standard users
# Keeping accounts, admin groups and computers separated by tier lets you scope
# Group Policy, delegation and logon restrictions per tier.
# =============================================================================
@{

    # ------------------------------------------------------------------
    # Organizational Units, listed PARENT-FIRST so each parent exists
    # before its children are created. Deploy-ADBaseline.ps1 iterates this
    # list in order.
    # ------------------------------------------------------------------
    OrganizationalUnits = @(

        # -- Tiered administration hierarchy -------------------------------
        @{ Path = 'OU=Admin';                          Description = 'Root OU for tiered administration objects' }

        @{ Path = 'OU=Tier0,OU=Admin';                 Description = 'Tier 0 - identity control plane (DCs, PKI, domain admins)' }
        @{ Path = 'OU=Accounts,OU=Tier0,OU=Admin';     Description = 'Tier 0 privileged user accounts' }
        @{ Path = 'OU=Groups,OU=Tier0,OU=Admin';       Description = 'Tier 0 administrative groups' }
        @{ Path = 'OU=Servers,OU=Tier0,OU=Admin';      Description = 'Tier 0 servers (domain controllers, PKI, ADFS)' }
        @{ Path = 'OU=ServiceAccounts,OU=Tier0,OU=Admin'; Description = 'Tier 0 service / managed service accounts' }

        @{ Path = 'OU=Tier1,OU=Admin';                 Description = 'Tier 1 - server administration' }
        @{ Path = 'OU=Accounts,OU=Tier1,OU=Admin';     Description = 'Tier 1 privileged user accounts' }
        @{ Path = 'OU=Groups,OU=Tier1,OU=Admin';       Description = 'Tier 1 administrative groups' }
        @{ Path = 'OU=ServiceAccounts,OU=Tier1,OU=Admin'; Description = 'Tier 1 service / managed service accounts' }

        @{ Path = 'OU=Tier2,OU=Admin';                 Description = 'Tier 2 - workstation / helpdesk administration' }
        @{ Path = 'OU=Accounts,OU=Tier2,OU=Admin';     Description = 'Tier 2 privileged user accounts' }
        @{ Path = 'OU=Groups,OU=Tier2,OU=Admin';       Description = 'Tier 2 administrative groups' }

        # -- Production object OUs (the "data plane") ----------------------
        @{ Path = 'OU=Users';                          Description = 'Standard (non-privileged) user accounts' }
        @{ Path = 'OU=Workstations';                   Description = 'End-user workstations (Tier 2 assets)' }
        @{ Path = 'OU=Servers';                        Description = 'Member servers (Tier 1 assets)' }
        @{ Path = 'OU=Groups';                         Description = 'Application / access / distribution groups' }
        @{ Path = 'OU=ServiceAccounts';                Description = 'Service accounts and gMSAs for applications' }
    )

    # ------------------------------------------------------------------
    # Security groups.
    #   Scope:    Global | DomainLocal | Universal
    #   Category: Security | Distribution
    #   Path:     RELATIVE OU DN where the group object is created.
    # The three tier-admin groups are the anchors of the tiering model:
    # membership in them should be tightly controlled and audited.
    # ------------------------------------------------------------------
    Groups = @(

        # -- Tier-admin groups (one per tier) ------------------------------
        @{ Name = 'Tier0-Admins'; SamAccountName = 'Tier0-Admins'; Scope = 'Global'; Category = 'Security'
           Path = 'OU=Groups,OU=Tier0,OU=Admin'
           Description = 'Tier 0 administrators (domain/forest control plane). Highest privilege - keep membership minimal.' }

        @{ Name = 'Tier1-Admins'; SamAccountName = 'Tier1-Admins'; Scope = 'Global'; Category = 'Security'
           Path = 'OU=Groups,OU=Tier1,OU=Admin'
           Description = 'Tier 1 administrators (member servers / applications).' }

        @{ Name = 'Tier2-Admins'; SamAccountName = 'Tier2-Admins'; Scope = 'Global'; Category = 'Security'
           Path = 'OU=Groups,OU=Tier2,OU=Admin'
           Description = 'Tier 2 administrators (workstations / helpdesk).' }

        # -- Core operational security groups ------------------------------
        @{ Name = 'SG-Server-Admins'; SamAccountName = 'SG-Server-Admins'; Scope = 'Global'; Category = 'Security'
           Path = 'OU=Groups'
           Description = 'Delegated server administration (assigned via GPO restricted groups / LAPS).' }

        @{ Name = 'SG-Workstation-Admins'; SamAccountName = 'SG-Workstation-Admins'; Scope = 'Global'; Category = 'Security'
           Path = 'OU=Groups'
           Description = 'Delegated workstation administration (helpdesk).' }

        @{ Name = 'SG-ServiceAccounts'; SamAccountName = 'SG-ServiceAccounts'; Scope = 'Global'; Category = 'Security'
           Path = 'OU=Groups'
           Description = 'Container group for all service accounts (targeted by the fine-grained password policy).' }

        @{ Name = 'SG-gMSA-Retrievers'; SamAccountName = 'SG-gMSA-Retrievers'; Scope = 'Global'; Category = 'Security'
           Path = 'OU=Groups'
           Description = 'Hosts/servers allowed to retrieve the example gMSA password. Add computer/host accounts here.' }
    )

    # ------------------------------------------------------------------
    # Fine-Grained Password Policy (PSO) - New-ADFineGrainedPasswordPolicy.
    # A PSO overrides the default domain password policy for the members of
    # AppliesToGroups. Timespans are ISO-8601 duration-ish strings parsed by
    # the script with [System.TimeSpan]::Parse where needed; here we use the
    # d.hh:mm:ss format understood by New-TimeSpan / [TimeSpan].
    # Lower Precedence wins when multiple PSOs apply to one user.
    # ------------------------------------------------------------------
    PasswordPolicy = @{
        Name                 = 'PSO-ServiceAccounts'
        DisplayName          = 'Service Account Password Policy'
        Description          = 'Strong password policy applied to service accounts.'
        Precedence           = 50            # lower number = higher priority
        ComplexityEnabled    = $true
        ReversibleEncryption = $false
        MinPasswordLength    = 24
        PasswordHistoryCount = 24
        MinPasswordAge       = '1.00:00:00'  # 1 day
        MaxPasswordAge       = '365.00:00:00' # 365 days
        LockoutThreshold     = 10
        LockoutObservationWindow = '0.00:30:00' # 30 minutes
        LockoutDuration          = '0.00:30:00' # 30 minutes
        # Groups this PSO is applied to (relative OU is resolved by the script
        # via the Groups map above - match by SamAccountName).
        AppliesToGroups      = @('SG-ServiceAccounts')
    }

    # ------------------------------------------------------------------
    # Group Managed Service Account (gMSA) - New-ADServiceAccount.
    # Prereq (one-time, per forest): a KDS root key must exist, created with
    #   Add-KdsRootKey -EffectiveImmediately   (lab only; in prod it becomes
    #   usable ~10h after creation for replication). Deploy-ADBaseline.ps1
    #   checks for the key and warns if it is missing.
    # PrincipalsAllowedToRetrieveManagedPassword references a group whose
    # members (computer/host accounts) may retrieve the managed password.
    # ------------------------------------------------------------------
    Gmsa = @{
        Name           = 'gmsa-app01'          # <= 15 chars for the Sam/host label
        DNSHostName    = 'gmsa-app01.corp.example.com'  # adjust to your domain suffix
        Description    = 'Example group Managed Service Account for an application service.'
        Path           = 'OU=ServiceAccounts'  # relative OU for the gMSA object
        RetrieversGroup = 'SG-gMSA-Retrievers'  # SamAccountName of the retrievers group
    }
}
