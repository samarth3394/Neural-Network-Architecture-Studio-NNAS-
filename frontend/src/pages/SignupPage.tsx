import React, { useState } from 'react';
import {
  BrainCircuit,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Briefcase,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';

export const SignupPage: React.FC = () => {
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const registerUser = useAppStore((s) => s.registerUser);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ml_engineer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        full_name: fullName,
        email,
        password,
        role,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#07090e] p-4 text-slate-100">
      {/* Background Neural Grid & Ambient Radial Light */}
      <div className="pointer-events-none absolute inset-0 neural-grid opacity-60" />
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-purple-600/15 blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 w-[500px] h-[350px] bg-cyan-600/10 blur-[130px] rounded-full" />

      {/* Back to Home Button */}
      <button
        onClick={() => setActiveTab('landing')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-md transition-all hover:bg-white/[0.08] hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
      </button>

      {/* Main Glass Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0c101a]/85 p-8 shadow-2xl shadow-indigo-950/60 backdrop-blur-2xl">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 p-[1px] shadow-lg shadow-indigo-500/30">
            <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-[#0b0f17]">
              <BrainCircuit className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
            Create NNAS Account
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Design, train, and deploy deep learning architectures visually
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="mt-6 space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-300">Full Name</label>
            <div className="relative mt-1">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Ada Lovelace"
                className="w-full rounded-xl border border-white/10 bg-[#080b12] py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">Work Email</label>
            <div className="relative mt-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ada@deeplearning.org"
                className="w-full rounded-xl border border-white/10 bg-[#080b12] py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">Password</label>
            <div className="relative mt-1">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full rounded-xl border border-white/10 bg-[#080b12] py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">Platform Role</label>
            <div className="relative mt-1">
              <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#080b12] py-2.5 pl-9 pr-3 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ml_engineer">ML Infrastructure Engineer</option>
                <option value="researcher">AI Researcher / Data Scientist</option>
                <option value="admin">Architect &amp; System Administrator</option>
                <option value="viewer">Auditor / Viewer</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:opacity-95 disabled:opacity-50"
          >
            {loading ? (
              <span>Creating Workspace...</span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4 text-xs text-slate-400">
          <div>
            Already have an account?{' '}
            <button
              onClick={() => setActiveTab('login')}
              className="font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Sign In
            </button>
          </div>
          <button
            onClick={() => setActiveTab('studio')}
            className="text-[11px] text-slate-500 hover:text-slate-300"
          >
            Explore Studio &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
