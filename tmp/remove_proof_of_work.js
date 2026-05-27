const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'LandingView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The file uses CRLF (\r\n), but Node.js normalizes to \n internally.
// Let's work with the file as-is.

// 1. Remove the "Honest Proof-of-Work" heading — find it by unique substring
const oldHeadingStart = '<h3 className="font-display text-lg sm:text-2xl font-black text-white leading-tight">';
const oldHeadingEnd = '</h3>';

// Strategy: find the exact heading block by unique text markers
const headingPatternStart = '<h3 className="font-display text-lg sm:text-2xl font-black text-white leading-tight">\n              Honest Proof-of-Work:';
const headingPatternEnd = 'Boots-on-the-Ground Research\n              </span>\n            </h3>';

const startIdx = content.indexOf(headingPatternStart);
const endIdx = content.indexOf(headingPatternEnd, startIdx) + headingPatternEnd.length;

if (startIdx !== -1 && endIdx > startIdx) {
  content = content.slice(0, startIdx) + content.slice(endIdx);
  console.log('Removed heading section');
} else {
  console.log('Could not find heading section, startIdx:', startIdx, 'endIdx:', endIdx);
}

// 2. Replace the old paragraph text
const oldPara = 'We reject empty speculative noise and shallow charts. Built on tactical discipline, SGT community members conduct tireless, boots-on-the-ground ground research\u2014inspecting financial ledger buffers, bank swap yields, macro trends, and on-chain liquid desks.';
const newPara = 'We reject empty speculative noise and shallow charts. Built on tactical discipline, SGT community members conduct tireless, boots-on-the-ground research.';

const paraIdx = content.indexOf(oldPara);
if (paraIdx !== -1) {
  content = content.slice(0, paraIdx) + newPara + content.slice(paraIdx + oldPara.length);
  console.log('Replaced paragraph text');
} else {
  console.log('Could not find old paragraph text');
}

// 3. Remove the Structured Proof-of-Work list grid (between {/* Structured Proof-of-Work list */} and </div>)
const listComment = '            {/* Structured Proof-of-Work list */}\n            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1.5">\n';
const listEnd = '            </div>';

const listStartIdx = content.indexOf(listComment);
const listEndIdx = content.indexOf(listEnd, listStartIdx + listComment.length) + listEnd.length;

if (listStartIdx !== -1 && listEndIdx > listStartIdx) {
  content = content.slice(0, listStartIdx) + content.slice(listEndIdx);
  console.log('Removed Proof-of-Work list grid');
} else {
  console.log('Could not find list grid, listStartIdx:', listStartIdx, 'listEndIdx:', listEndIdx);
}

// 4. Update the CTA text
const oldCTA = '👥 Join 30,000+ disciplined strategists doing fundamental research';
const newCTA = '👥 Get early access to vetted intelligence\u2014before institutional desks';

const ctaIdx = content.indexOf(oldCTA);
if (ctaIdx !== -1) {
  content = content.slice(0, ctaIdx) + newCTA + content.slice(ctaIdx + oldCTA.length);
  console.log('Updated CTA text');
} else {
  console.log('Could not find old CTA text');
}

// Write the result
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully removed Honest Proof-of-Work section from LandingView.tsx');
console.log('File size:', content.length, 'chars');
