import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { X, Mail, Lock, User, Sparkles, Check } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error("Full Name is required");
        }
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || "An authentication error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050506]/90 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-900 bg-[#0C0C0E] p-6 text-left shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background glow node */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-[#FE8C00]/10 blur-[80px] rounded-full pointer-events-none" />

        {/* Header & Close button */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-[#FE8C00] uppercase tracking-widest">
              <Sparkles className="h-3 w-3 text-[#FE8C00] animate-pulse" />
              SGT SHOW HUB PORTAL
            </span>
            <h3 className="font-display text-lg font-black text-white">
              {isSignUp ? "Create Investor Account" : "Access Intelligence Portal"}
            </h3>
            <p className="text-zinc-500 text-xs">
              {isSignUp ? "Deploy your credentials to receive push market alarms." : "Unlock pre-vetted sector books and instant copilot breakouts."}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg border border-zinc-805 bg-zinc-900/40 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl leading-relaxed">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <User className="absolute top-3 left-3 h-4 w-4 text-zinc-600" />
                <input
                  type="text"
                  placeholder="e.g. Bamidele Tewogbade"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 py-2.5 pl-9 pr-4 text-xs font-semibold text-white outline-none focus:border-[#FE8C00] transition-colors"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail className="absolute top-3 left-3 h-4 w-4 text-zinc-600" />
              <input
                type="email"
                placeholder="investor@sgtshow.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 py-2.5 pl-9 pr-4 text-xs font-semibold text-white outline-none focus:border-[#FE8C00] transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Password</label>
            <div className="relative">
              <Lock className="absolute top-3 left-3 h-4 w-4 text-zinc-600" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 py-2.5 pl-9 pr-4 text-xs font-semibold text-white outline-none focus:border-[#FE8C00] transition-colors"
                required
              />
            </div>
          </div>

          {/* Autojoin Badge for everyone registered (is everyone a member of the community = yes) */}
          <div className="rounded-xl bg-zinc-900/65 p-3.5 border border-zinc-850 flex items-start gap-3">
            <div className="h-5 w-5 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/25 mt-0.5">
              <Check className="h-3.5 w-3.5" />
            </div>
            <div className="text-left space-y-0.5">
              <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-wider block">AUTO-JOIN COMMUNITY MEMBERSHIP</span>
              <p className="text-[10px] text-zinc-400 leading-normal font-medium">
                You are automatically signed up as an official vetting community member on SGT Show. Includes access to discussion channels.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#FE8C00] text-zinc-950 font-bold hover:bg-[#E07B00] transition-colors text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#FE8C00]/10"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
            ) : isSignUp ? "Create Community Account" : "Access Private Terminal"}
          </button>
        </form>

        <div className="flex items-center gap-3 py-1">
          <div className="h-[1px] bg-zinc-900 flex-1" />
          <span className="text-[9px] font-mono text-zinc-500 uppercase font-semibold">Or fast secure via Google</span>
          <div className="h-[1px] bg-zinc-900 flex-1" />
        </div>

        {/* Google connect key button */}
        <button
          onClick={async () => {
            await signInWithGoogle();
            onClose();
          }}
          className="w-full py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-90 text-zinc-200 transition-colors text-xs font-bold font-sans flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Sync with Google Workspace
        </button>

        {/* Toggle signup/signin link */}
        <p className="text-center text-xs text-zinc-500 pt-2 font-medium">
          {isSignUp ? "Already registered on SGT Hub?" : "New to the vetting community?"}{' '}
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#FE8C00] font-bold hover:underline bg-transparent"
          >
            {isSignUp ? "Sign In" : "Sign Up Now"}
          </button>
        </p>
      </div>
    </div>
  );
}
