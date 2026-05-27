const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'LandingView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The section to remove - from the h3 "Honest Proof-of-Work" heading
// up to (but not including) the closing div
const startMarker = `            <h3 className="font-display text-lg sm:text-2xl font-black text-white leading-tight">\r\n              Honest Proof-of-Work:<br />\r\n              <span className="bg-gradient-to-r from-emerald-400 via-amber-400 to-teal-400 bg-clip-text text-transparent">\r\n                Boots-on-the-Ground Research\r\n              </span>\r\n            </h3>`;

const endMarker = `          <div className="pt-4 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4">`;

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1) {
  console.error('ERROR: Could not find start marker');
  process.exit(1);
}

if (endIdx === -1) {
  console.error('ERROR: Could not find end marker');
  process.exit(1);
}

// Replace everything from the heading through to before the closing section div
// We keep the paragraph text but remove the Proof-of-Work heading and grid
const beforeSection = content.substring(0, startIdx);

// Find the paragraph that follows the heading
const pStart = content.indexOf('<p className="text-xs text-neutral-400 leading-relaxed">', startIdx);
const pEnd = content.indexOf('</p>', pStart) + 4;

// Find the structured Proof-of-Work grid
const gridStart = content.indexOf('{/* Structured Proof-of-Work list */}', pEnd);
const gridEnd = content.indexOf('</div>', gridStart) + 6; // the outer grid div

// Find the closing div of the parent container
// We want everything after the grid up to the endMarker div
const afterGrid = content.substring(gridEnd);

// Reconstruct: heading removed, paragraph updated, grid removed, rest stays
const newContent = beforeSection + 
  `            <p className="text-xs text-neutral-400 leading-relaxed">\r\n              We reject empty speculative noise and shallow charts. Built on tactical discipline, SGT community members conduct tireless, boots-on-the-ground research.\r\n            </p>\r\n\r\n` +
  afterGrid.substring(0, afterGrid.indexOf(endMarker)) +
  afterGrid.substring(afterGrid.indexOf(endMarker));

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully removed Honest Proof-of-Work section from LandingView.tsx');
