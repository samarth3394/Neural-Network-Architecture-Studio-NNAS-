import React, { useState } from 'react';
import {
  BrainCircuit,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  UserCheck,
  ArrowLeft,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';

export const LoginPage: React.FC = () => {
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const loginUser = useAppStore((s) => s.loginUser);

  const [email, setEmail] = useState('admin@nnas.local');
  const [password, setPassword] = useState('Admin123!*');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      await loginUser(formData);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError(null);
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-y-auto py-12 px-4 bg-[#07090e] text-slate-100">
      {/* Background Neural Grid & Ambient Radial Light */}
      <div className="pointer-events-none absolute inset-0 neural-grid opacity-60" />
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-indigo-600/15 blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 w-[500px] h-[350px] bg-cyan-600/10 blur-[130px] rounded-full" />

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
            Sign in to NNAS Studio
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Access your visual models, training pipelines, and serving endpoints
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300">Work Email</label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-white/10 bg-[#080b12] py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-300">Password</label>
              <span className="text-[11px] text-slate-500">Min 8 characters</span>
            </div>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-white/10 bg-[#080b12] py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:opacity-95 disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Platform</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-6 border-t border-white/[0.06] pt-4">
          <div className="text-[11px] font-medium text-slate-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            Quick Demo Auto-Fill:
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('admin@nnas.local', 'Admin123!*')}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.02] p-2 text-[10px] text-slate-300 hover:border-indigo-500/30 hover:bg-indigo-950/20"
            >
              <UserCheck className="h-3 w-3 text-cyan-400" />
              Lead Architect
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('engineer@nnas.local', 'Engineer123!*')}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.02] p-2 text-[10px] text-slate-300 hover:border-indigo-500/30 hover:bg-indigo-950/20"
            >
              <UserCheck className="h-3 w-3 text-indigo-400" />
              ML Engineer
            </button>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4 text-xs text-slate-400">
          <div>
            Don't have an account?{' '}
            <button
              onClick={() => setActiveTab('signup')}
              className="font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Sign Up
            </button>
          </div>
          <button
            onClick={() => setActiveTab('studio')}
            className="text-[11px] text-slate-500 hover:text-slate-300"
          >
            Explore as Guest &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
