const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'LandingView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The content uses \r\n line endings
// We need to find and remove the section from:
// <h3 className="font-display..."> Honest Proof-of-Work... to the end of the grid div

const startMarker = `            <h3 className="font-display text-lg sm:text-2xl font-black text-white leading-tight">\r\n              Honest Proof-of-Work:<br />\r\n              <span className="bg-gradient-to-r from-emerald-400 via-amber-400 to-teal-400 bg-clip-text text-transparent">\r\n                Boots-on-the-Ground Research\r\n              </span>\r\n            </h3>`;

const endMarker = `            </div>\r\n          </div>\r\n\r\n          <div className="pt-4 border-t border-zinc-900 flex`;

// Find the start
const startIdx = content.indexOf(startMarker);
if (startIdx === -1) {
  console.log('ERROR: Could not find the Honest Proof-of-Work heading');
  process.exit(1);
}

// Find the end - look for the closing </div> that closes the grid, then the next div
// The grid div starts with: <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1.5">
// And ends with the </div> that closes it, right before the outer </div> and then pt-4 border-t div

const gridStart = content.indexOf(`            {/* Structured Proof-of-Work list */}`, startIdx);
if (gridStart === -1) {
  console.log('ERROR: Could not find the grid div');
  process.exit(1);
}

// Find the closing </div> of the grid grid-cols div, then the next outer </div>
// The structure is:
// <h3>...</h3>
// <p>...</p>
// <div className="grid...">...</div>   <- this is the grid
// </div>
// 
// <div className="pt-4 border-t...">  <- this stays

// After the grid div, there's a </div> that closes the outer div, then the pt-4 div
// Let's find the closing of the grid div by matching the pattern

const gridEndMarker = `            </div>\r\n          </div>\r\n\r\n          <div className="pt-4 border-t border-zinc-900 flex`;
const gridEndIdx = content.indexOf(gridEndMarker, gridStart);

if (gridEndIdx === -1) {
  console.log('ERROR: Could not find the grid end marker');
  process.exit(1);
}

// Remove from start of h3 to just before the pt-4 div
// We keep the pt-4 div and everything after
const beforeSection = content.substring(0, startIdx);
const afterSection = content.substring(gridEndIdx);

// Also update the paragraph text
const oldParagraph = `            <p className="text-xs text-neutral-400 leading-relaxed">\r\n              We reject empty speculative noise and shallow charts. Built on tactical discipline, SGT community members conduct tireless, boots-on-the-ground ground research—inspecting financial ledger buffers, bank swap yields, macro trends, and on-chain liquid desks.\r\n            </p>`;
const newParagraph = `            <p className="text-xs text-neutral-400 leading-relaxed">\r\n              Join a sovereign network of vetted analysts, traders, and boots-on-ground researchers who share verified intelligence—no bots, no shills, no empty speculation.\r\n            </p>`;

// Check if old paragraph exists
const paraIdx = content.indexOf(oldParagraph, startIdx);
if (paraIdx === -1) {
  console.log('WARNING: Could not find the old paragraph text');
  // Just remove the section without modifying the paragraph
  content = beforeSection + afterSection;
} else {
  // Do the replacement step by step
  // First remove the grid and heading
  content = content.substring(0, startIdx) + content.substring(gridEndIdx);
  
  // Then replace the paragraph
  const paraIdx2 = content.indexOf(oldParagraph);
  if (paraIdx2 !== -1) {
    content = content.substring(0, paraIdx2) + newParagraph + content.substring(paraIdx2 + oldParagraph.length);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully removed Honest Proof-of-Work section from LandingView.tsx');

// Verify
const verifyContent = fs.readFileSync(filePath, 'utf8');
if (verifyContent.includes('Honest Proof-of-Work')) {
  console.log('WARNING: "Honest Proof-of-Work" still found in file!');
} else {
  console.log('✅ Verification: "Honest Proof-of-Work" successfully removed.');
}
