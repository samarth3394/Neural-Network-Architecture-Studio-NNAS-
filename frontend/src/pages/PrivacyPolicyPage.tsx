import React from 'react';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export const PrivacyPolicyPage: React.FC = () => {
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-200">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#080b11]/90 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-semibold text-white">NNAS Privacy &amp; Data Governance</span>
          </div>
          <button
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to Studio
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-md border border-slate-800 bg-slate-900/60 p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            Data Protection Architecture
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white">Privacy Policy &amp; Data Isolation</h1>
          <p className="mt-1 text-xs text-slate-400">Effective Date: October 18, 2026 • Policy Version 1.1</p>

          <div className="mt-8 space-y-6 text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-6">
            <section>
              <h2 className="text-sm font-semibold text-white">1. Zero External Telemetry Commitment</h2>
              <p className="mt-2 text-slate-400">
                NNAS operates with zero phone-home tracking, zero third-party analytics scripts, and zero advertising beacons.
                All training parameters, dataset fingerprints, neuron activation values, and model checkpoints remain
                strictly isolated within your local or enterprise server infrastructure.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-white">2. Dataset &amp; Weight Confidentiality</h2>
              <p className="mt-2 text-slate-400">
                Uploaded datasets (CSV, image tensors) are stored locally in the verified storage directory.
                No model architectures, weights, or inferences are transmitted across external public networks.
                Access is restricted strictly to authenticated session tokens verified against local PBKDF2/Argon2 hashes.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-white">3. Immutable Audit Trails</h2>
              <p className="mt-2 text-slate-400">
                The platform logs model deployment stage transitions (Staging, Production, Rollback) with structured
                SHA-256 fingerprints to satisfy compliance standards (SOC 2, ISO 27001). Logs are retained solely on
                the host machine and can be purged at any time by system administrators.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-white">4. User Rights &amp; Data Deletion</h2>
              <p className="mt-2 text-slate-400">
                Users hold complete data sovereignty. Deleting a project, dataset, or architecture permanently cascades
                through the local database and unlinks associated checkpoint files from disk without residual retention.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};
