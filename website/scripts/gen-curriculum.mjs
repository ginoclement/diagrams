// Assembles static/training/curriculum.json from the ordered per-stage fragments in
// static/training/stages/*.json. Run after adding or editing a stage.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const T = join(dirname(fileURLToPath(import.meta.url)), '..', 'static', 'training');
const META = {
  title: 'Identity Security Training Path',
  subtitle: 'A staged, self-paced course through authentication, authorization, identity lifecycle, and the systems around them. Read the lesson, explore the linked diagram, then pass the stage quiz.',
};
const stages = readdirSync(join(T, 'stages'))
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(join(T, 'stages', f), 'utf8')));

writeFileSync(join(T, 'curriculum.json'), JSON.stringify({ ...META, stages }, null, 2) + '\n');
const lessons = stages.reduce((n, s) => n + (s.lessons || []).length, 0);
const quizzes = stages.reduce((n, s) => n + ((s.quiz && s.quiz.length) ? 1 : 0), 0);
console.log(`Wrote curriculum.json: ${stages.length} stages, ${lessons} lessons, ${quizzes} quizzes.`);
