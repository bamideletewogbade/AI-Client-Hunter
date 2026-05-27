const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'LandingView.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Find the section to remove - from the "Honest Proof-of-Work:" heading
// through the grid div, down to before the CTA footer
const startMarker = `<h3 className="font-display text-lg sm:text-2xl font-black text-white leading-tight">`;
const endMarker = `          <div className="pt-4 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4">`;

const startIdx = content.indexOf(startMarker);
if (startIdx === -1) {
  console.error('ERROR: Could not find start marker (Honest Proof-of-Work heading)');
  process.exit(1);
}

const endIdx = content.indexOf(endMarker, startIdx);
if (endIdx === -1) {
  console.error('ERROR: Could not find end marker (CTA footer)');
  process.exit(1);
}

// Remove everything from startMarker to endMarker (inclusive)
const before = content.slice(0, startIdx);
const after = content.slice(endIdx);

// Remove any trailing empty lines before endMarker
const trimmedBefore = before.replace(/\r?\n\s*$/, '');

const newContent = trimmedBefore + '\n' + after;

fs.writeFileSync(filePath, newContent, 'utf-8');

// Verify
const verifyContent = fs.readFileSync(filePath, 'utf-8');
if (verifyContent.includes('Honest Proof-of-Work')) {
  console.error('ERROR: Honest Proof-of-Work section still present after removal!');
  process.exit(1);
}

console.log('SUCCESS: Removed Honest Proof-of-Work section from LandingView.tsx');
console.log(`Original size: ${content.length} chars`);
console.log(`New size: ${verifyContent.length} chars`);
console.log(`Removed ${content.length - verifyContent.length} chars`);
