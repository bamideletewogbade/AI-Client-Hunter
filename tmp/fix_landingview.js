const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '..', 'src', 'components', 'LandingView.tsx');
let content = fs.readFileSync(filePath, 'utf8');
let lines = content.split('\n');

console.log(`Total lines: ${lines.length}`);
let changes = 0;

// =============================================
// 1. Find the end of faqItems array: ];
// =============================================
let faqEndIndex = -1;
for (let i = 280; i < Math.min(310, lines.length); i++) {
  const trimmed = lines[i].trim();
  if (trimmed === '];' && i > 280) {
    faqEndIndex = i;
    break;
  }
}
console.log(`faqItems ends at line: ${faqEndIndex + 1}`);

// =============================================
// 2. Insert missing state declarations after faqItems
// =============================================
const newStates = [
  '',
  '  // Roadmap interactive filter state',
  "  const [activeRoadmapFilter, setActiveRoadmapFilter] = useState<'all' | 'signals' | 'community' | 'infrastructure'>('all');",
  '  const [hoveredRoadmapId, setHoveredRoadmapId] = useState<string | null>(null);',
  '  const [activeRoadmapSimulationId, setActiveRoadmapSimulationId] = useState<string | null>(null);',
  '',
  '  // Simulation sandbox states for roadmap interactive previews',
  "  const [simForexPair, setSimForexPair] = useState('USDNGN');",
  '  const [simModelConfidence, setSimModelConfidence] = useState(78);',
  "  const [simFeedLogs, setSimFeedLogs] = useState<string[]>([",
  '    "Neural layer primed: USD/NGN buffer coefficients normalized.",',
  '    "CBN sentiment statement decoded: neutral forward guidance.",',
  '    "Macro liquidity desk loaded: weighted vector ready."',
  '  ]);',
  '  const [simBoardLeaderboard, setSimBoardLeaderboard] = useState([',
  "    { rank: 1, user: 'Cap_Table_Analyst', verifiedAs: 'Verified Financial Accountant', karma: 12450, hits: '87%' },",
  "    { rank: 2, user: 'SgtShow01', verifiedAs: 'Operator / Boots-on-Ground Researcher', karma: 10780, hits: '91%' },",
  "    { rank: 3, user: 'DeltaScout_NG', verifiedAs: 'Accredited Community Scout', karma: 8340, hits: '79%' },",
  "    { rank: 4, user: 'NaijaOracle', verifiedAs: 'Macro Analyst Trainee', karma: 6110, hits: '74%' },",
  '  ]);',
  '  const [simUserVoteSubmitted, setSimUserVoteSubmitted] = useState<string | null>(null);',
  '  const [simOfferQty, setSimOfferQty] = useState(500);',
  '  const [simOfferPrice, setSimOfferPrice] = useState(49.85);',
  '  const [simOfferSubmitted, setSimOfferSubmitted] = useState(false);',
  '',
  '  // Roadmap items data array',
  '  const roadmapItems = [',
  '    {',
  "      id: 'rm-forex-ai',",
  "      category: 'signals' as const,",
  "      title: 'Forex AI Signal Engine',",
  "      description: 'Real-time macro inference on USD/NGN and emerging market pairs with neural sentiment decoding.',",
  "      icon: 'Activity',",
  "      color: '#FE8C00',",
  "      status: 'active' as const,",
  "      stats: { accuracy: 87, signals: 3423 },",
  '    },',
  '    {',
  "      id: 'rm-community-lb',",
  "      category: 'community' as const,",
  "      title: 'Community Scout Leaderboard',",
  "      description: 'Verified boots-on-ground researchers curating vetted intelligence from local NGX desks and macro networks.',",
  "      icon: 'Users',",
  "      color: '#10B981',",
  "      status: 'active' as const,",
  "      stats: { scouts: 142, reports: 892 },",
  '    },',
  '    {',
  "      id: 'rm-p2p-ledger',",
  "      category: 'infrastructure' as const,",
  "      title: 'P2P Escrow & Settlement Ledger',",
  "      description: 'Peer-to-peer transaction broadcasting with secondary market liquidity board matching.',",
  "      icon: 'BookOpen',",
  "      color: '#38BDF8',",
  "      status: 'active' as const,",
  "      stats: { blocks: 12847, volume: '2.4M NGN' },",
  '    },',
  '    {',
  "      id: 'rm-sandbox-terminal',",
  "      category: 'infrastructure' as const,",
  "      title: 'Sandbox Terminal',",
  "      description: 'Simulated trading environment for strategy backtesting and risk-free portfolio exploration.',",
  "      icon: 'Terminal',",
  "      color: '#A78BFA',",
  "      status: 'active' as const,",
  "      stats: { users: 580, trades: 15720 },",
  '    },',
  '  ];',
];

if (faqEndIndex >= 0) {
  lines.splice(faqEndIndex + 1, 0, ...newStates);
  changes++;
  console.log(`Inserted ${newStates.length} lines after line ${faqEndIndex + 1}`);
} else {
  console.error('ERROR: Could not find faqItems closing ];');
}

// =============================================
// 3. Fix Tailwind typos
// =============================================
// Re-join to do replacements
content = lines.join('\n');
const replacements = [
  { from: 'text-zinc-305', to: 'text-zinc-400' },
  { from: 'text-zinc-650', to: 'text-zinc-500' },
  { from: 'bg-zinc-905', to: 'bg-zinc-900' },
  { from: 'border-zinc-80)', to: 'border-zinc-800' },
  { from: 'bg-zinc-805', to: 'bg-zinc-800' },
];

// For bg-zinc-90, we need to be careful: we should NOT match bg-zinc-900
// We need to match "bg-zinc-90" followed by non-digit
// Let's handle this carefully with a function
let fixCount = 0;
replacements.forEach(({ from, to }) => {
  let idx = 0;
  while ((idx = content.indexOf(from, idx)) !== -1) {
    // For bg-zinc-90, check it's not followed by another digit (which would make it bg-zinc-900)
    if (from === 'bg-zinc-90') {
      const nextChar = content[idx + from.length];
      if (nextChar && nextChar >= '0' && nextChar <= '9') {
        idx += from.length;
        continue;
      }
    }
    content = content.substring(0, idx) + to + content.substring(idx + from.length);
    idx += to.length;
    fixCount++;
    changes++;
  }
});

// Fix bg-zinc-90 (only those NOT followed by another digit)
// These are at lines 867 and 902 - "bg-zinc-90 w-fit" and "rounded bg-zinc-90 px-2"
// We already handled them above with the check

console.log(`Fixed ${fixCount} Tailwind typo instances`);

// =============================================
// 4. Write the file back
// =============================================
fs.writeFileSync(filePath, content, 'utf8');
console.log(`File written. Total changes: ${changes}`);
console.log('Done!');
