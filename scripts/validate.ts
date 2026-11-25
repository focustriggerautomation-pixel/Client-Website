/** npm run validate — check every /cafes/<slug>/config.json without building. */
import { loadAllCafes, printErrorsAndExit } from './lib/cafes.ts';

const { cafes, errors } = loadAllCafes();
if (errors.length) printErrorsAndExit(errors);
if (!cafes.length) {
  console.error('✖ No cafes found in /cafes. Add /cafes/<slug>/config.json.');
  process.exit(1);
}
console.log(`✓ ${cafes.length} cafe config${cafes.length === 1 ? '' : 's'} valid: ${cafes.map((c) => c.slug).join(', ')}`);
