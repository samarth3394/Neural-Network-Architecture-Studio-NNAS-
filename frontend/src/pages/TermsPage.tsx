import React from 'react';
import { ArrowLeft, Shield, FileText } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export const TermsPage: React.FC = () => {
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-200">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#080b11]/90 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-semibold text-white">NNAS Legal &amp; Governance</span>
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
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <FileText className="h-4 w-4" />
            Enterprise Terms of Service
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white">Terms of Service (ToS)</h1>
          <p className="mt-1 text-xs text-slate-400">Effective Date: October 18, 2026 • Document Version 1.2</p>

          <div className="mt-8 space-y-6 text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-6">
            <section>
              <h2 className="text-sm font-semibold text-white">1. Platform Scope &amp; Licensing</h2>
              <p className="mt-2 text-slate-400">
                Neural Network Architecture Studio (NNAS) is an on-premise, self-hostable deep learning
                composition and training platform licensed under the open-source MIT License. You are granted
                full rights to inspect, compile, execute, and deploy architectures created within the studio.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-white">2. Intellectual Property &amp; Model Ownership</h2>
              <p className="mt-2 text-slate-400">
                All computational graphs, model weights, exported PyTorch source code, and training telemetry
                generated within your workspaces remain strictly your exclusive intellectual property. NNAS does
                not claim ownership, licensing rights, or commercial royalties over any neural network artifacts
                trained or served through this software.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-white">3. Execution Safety &amp; Code Generation</h2>
              <p className="mt-2 text-slate-400">
                NNAS adheres to a strict Zero-Eval policy. The Python code synthesis engine produces static AST-based
                modules without invoking arbitrary string execution primitives (<code className="text-blue-400">eval()</code>, <code className="text-blue-400">exec()</code>). Users are solely responsible for ensuring that datasets and hyperparameter configurations conform to local security requirements.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-white">4. Limitation of Liability</h2>
              <p className="mt-2 text-slate-400">
                The software is provided &quot;as is&quot;, without warranty of any kind, express or implied.
                In no event shall the authors or copyright holders be liable for any claim, damages, or other
                liability arising from the use of models in production environments.
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-white">5. Governing Law</h2>
              <p className="mt-2 text-slate-400">
                These terms shall be governed by and construed in accordance with standard software industry
                regulations and international open-source software compliance standards.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};
