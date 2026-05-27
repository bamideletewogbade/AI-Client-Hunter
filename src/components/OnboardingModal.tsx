import { useState, useEffect } from 'react';
import { Sparkles, ChevronRight, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ONBOARDING_KEY = 'sgt_onboarding_complete';

interface OnboardingAnswers {
  experience: string | null;
  terminology: string[];
  interests: string[];
  goal: string | null;
}

const INITIAL_ANSWERS: OnboardingAnswers = {
  experience: null,
  terminology: [],
  interests: [],
  goal: null,
};

const STEPS = [
  {
    id: 'experience',
    title: 'What\'s your investing experience?',
    subtitle: 'This helps us tailor the complexity of insights for you.',
    options: [
      { value: 'beginner', label: '🟢 New to Investing', desc: 'Learning the basics — P/E ratios, market caps, dividends' },
      { value: 'intermediate', label: '🟡 Some Familiarity', desc: 'I know stocks, crypto, and basic macro concepts' },
      { value: 'advanced', label: '🔴 Experienced Trader', desc: 'Deep knowledge across asset classes and derivatives' },
    ],
  },
  {
    id: 'terminology',
    title: 'Which terms do you know?',
    subtitle: 'Check all that apply — we\'ll adjust the vocabulary.',
    options: [
      { value: 'pe_ratio', label: '📊 P/E Ratio', desc: 'Price-to-Earnings valuation metric' },
      { value: 'market_cap', label: '💰 Market Cap', desc: 'Total market value of a company\'s shares' },
      { value: 'dividend_yield', label: '💵 Dividend Yield', desc: 'Annual dividend as % of stock price' },
      { value: 'liquidity', label: '🌊 Liquidity', desc: 'How easily an asset can be bought/sold' },
      { value: 'volatility', label: '⚡ Volatility', desc: 'Price fluctuation magnitude over time' },
      { value: 'hedging', label: '🛡️ Hedging', desc: 'Strategies to reduce investment risk' },
    ],
    multiSelect: true,
  },
  {
    id: 'interests',
    title: 'What markets interest you?',
    subtitle: 'Pick the asset classes you actively track.',
    options: [
      { value: 'ngx', label: '🇳🇬 NGX Stocks', desc: 'Nigerian Exchange — GTCO, Zenith, Dangote Cement' },
      { value: 'crypto', label: '₿ Crypto', desc: 'Bitcoin, Solana, and digital assets' },
      { value: 'us_stocks', label: '🏦 US Equities', desc: 'NVIDIA, Apple, S&P 500 components' },
      { value: 'forex', label: '💱 Forex', desc: 'USD/NGN, EUR/USD, emerging market pairs' },
      { value: 'commodities', label: '🥇 Commodities', desc: 'Gold, crude oil, agricultural futures' },
    ],
    multiSelect: true,
  },
  {
    id: 'goal',
    title: 'What\'s your primary goal?',
    subtitle: 'We\'ll highlight the most relevant tools for you.',
    options: [
      { value: 'learning', label: '📚 Learning', desc: 'Understand markets and build knowledge' },
      { value: 'trading', label: '📈 Active Trading', desc: 'Execute trades based on signals and analysis' },
      { value: 'research', label: '🔬 Research', desc: 'Deep-dive into macro and sector analysis' },
      { value: 'following', label: '👀 Following Sgt Show', desc: 'Follow vetted insights from the community' },
    ],
  },
];

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(INITIAL_ANSWERS);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      setIsOpen(true);
    }
  }, []);

  const currentStep = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  const handleSelect = (value: string) => {
    if (currentStep.multiSelect) {
      const key = currentStep.id as 'terminology' | 'interests';
      setAnswers(prev => {
        const current = prev[key];
        const next = current.includes(value)
          ? current.filter(v => v !== value)
          : [...current, value];
        return { ...prev, [key]: next };
      });
    } else {
      const key = currentStep.id as 'experience' | 'goal';
      setAnswers(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      localStorage.setItem(ONBOARDING_KEY, JSON.stringify(answers));
      setCompleted(true);
      setTimeout(() => {
        setIsOpen(false);
      }, 2000);
    } else {
      setStepIndex(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ skipped: true }));
    setIsOpen(false);
  };

  const canProceed = () => {
    if (completed) return false;
    if (currentStep.multiSelect) {
      return (answers as any)[currentStep.id].length > 0;
    }
    return (answers as any)[currentStep.id] !== null;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSkip}
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
          />

          {/* Modal — bottom sheet on mobile, centered on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl border border-zinc-800 bg-[#0C0C0E] shadow-2xl overflow-hidden sm:mx-4 max-h-[90vh] flex flex-col"
            style={{ maxHeight: '90dvh' }}
          >
            {/* Header */}
            <div className="shrink-0 p-5 sm:p-6 border-b border-zinc-900/60">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-[#FE8C00] to-[#FFA133] flex items-center justify-center font-display text-xs font-black text-zinc-950">
                    S
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#FE8C00] uppercase tracking-wider">
                    Welcome to Sgt Show
                  </span>
                </div>
                <button
                  onClick={handleSkip}
                  className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="flex gap-1.5 mt-1">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                      i < stepIndex
                        ? 'bg-[#FE8C00]'
                        : i === stepIndex
                        ? 'bg-[#FE8C00]/50'
                        : 'bg-zinc-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {completed ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-8 text-center space-y-4"
                >
                  <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Check className="h-7 w-7 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-white">You're all set!</h3>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                      Your preferences are saved. The platform will tailor insights, vocabulary, and tool highlights for you.
                    </p>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono">Redirecting to your dashboard...</p>
                </motion.div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-white">
                      {currentStep.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      {currentStep.subtitle}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {currentStep.options.map((opt) => {
                      const isSelected = currentStep.multiSelect
                        ? (answers as any)[currentStep.id].includes(opt.value)
                        : (answers as any)[currentStep.id] === opt.value;

                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleSelect(opt.value)}
                          className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#FE8C00] bg-[#FE8C00]/5'
                              : 'border-zinc-800/80 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <span className="text-xs sm:text-sm font-bold text-white block leading-snug">
                                {opt.label}
                              </span>
                              <span className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 block leading-normal">
                                {opt.desc}
                              </span>
                            </div>
                            {isSelected && (
                              <div className="h-5 w-5 rounded-full bg-[#FE8C00] flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="h-3 w-3 text-zinc-950" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {!completed && (
              <div className="shrink-0 p-5 sm:p-6 border-t border-zinc-900/60 flex items-center justify-between">
                <button
                  onClick={handleSkip}
                  className="text-xs text-zinc-500 hover:text-zinc-300 font-medium transition-colors cursor-pointer"
                >
                  Skip setup
                </button>
                <div className="flex items-center gap-2.5">
                  {stepIndex > 0 && (
                    <button
                      onClick={() => setStepIndex(prev => prev - 1)}
                      className="px-4 py-2.5 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer"
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      canProceed()
                        ? 'bg-[#FE8C00] text-zinc-950 hover:bg-[#E07B00] shadow-lg shadow-[#FE8C00]/10'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    {isLastStep ? 'Complete Setup' : 'Continue'}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
