import React from 'react';
import {
  BrainCircuit,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Cpu,
  Layers,
  Activity,
  Code2,
  Terminal,
  LineChart,
  GitBranch,
  Flame,
  CheckCircle2,
  Lock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';

export const LandingPage: React.FC = () => {
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-[#07090e] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Glows & Neural Grid */}
      <div className="pointer-events-none fixed inset-0 z-0 neural-grid opacity-70" />
      <div className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-tr from-indigo-600/15 via-purple-600/15 to-cyan-500/10 blur-[130px] rounded-full" />
      <div className="pointer-events-none fixed bottom-0 right-0 w-[500px] h-[400px] bg-cyan-600/10 blur-[140px] rounded-full" />

      {/* Top Floating Glass Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#07090e]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 p-[1px] shadow-lg shadow-indigo-500/25">
              <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#0b0f17]">
                <BrainCircuit className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">NNAS</span>
              <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-indigo-300">
                v1.0 Core
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
            <a href="#features" className="transition-colors hover:text-white">Capabilities</a>
            <a href="#architecture" className="transition-colors hover:text-white">Architecture Engine</a>
            <a href="#explainability" className="transition-colors hover:text-white">Explainable AI</a>
            <a href="#benchmarks" className="transition-colors hover:text-white">Benchmarks</a>
            <a
              href="https://github.com/samarth3394/Neural-Network-Architecture-Studio-NNAS-"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-slate-400 transition-colors hover:text-white"
            >
              GitHub <ExternalLink className="h-3 w-3" />
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => setActiveTab('studio')}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:opacity-95 hover:shadow-indigo-500/40"
              >
                Go to Studio <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('login')}
                  className="rounded-lg border border-white/10 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setActiveTab('signup')}
                  className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-all hover:bg-indigo-500"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-24 text-center lg:pt-28">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 px-3.5 py-1.5 text-xs text-indigo-300 shadow-inner">
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-semibold text-cyan-400">Production AI Engineering</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">PyTorch 2.6 Native &amp; Zero-Eval Safe</span>
          <ChevronRight className="h-3.5 w-3.5 text-indigo-400" />
        </div>

        {/* Main Headline */}
        <h1 className="mx-auto mt-8 max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl sm:leading-[1.12]">
          Architect, Train, and Deploy <br />
          <span className="gradient-text-accent">Neural Networks Visually</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg leading-relaxed">
          The full-stack visual engineering studio for modern deep learning. Design complex DAG architectures,
          verify tensor shapes statically with Kahn’s cycle detection, execute real PyTorch training, inspect
          gradient saliency, and serve low-latency inferences.
        </p>

        {/* Call to Actions */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => setActiveTab('studio')}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-500/30 transition-all hover:scale-[1.02] hover:shadow-indigo-500/45 active:scale-[0.98]"
          >
            <BrainCircuit className="h-4 w-4" />
            Launch Visual Studio
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActiveTab('explainability')}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-slate-200 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          >
            <Flame className="h-4 w-4 text-rose-400" />
            Try Live Explainability (XAI)
          </button>

          <button
            onClick={() => setActiveTab('login')}
            className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-950/20 px-5 py-3.5 text-sm font-medium text-indigo-300 hover:bg-indigo-950/40"
          >
            <Lock className="h-4 w-4" />
            Sign In with Demo Roles
          </button>
        </div>

        {/* Live Interactive Teaser Card */}
        <div className="relative mx-auto mt-16 max-w-5xl rounded-2xl border border-white/10 bg-[#0d121e]/90 p-2 shadow-2xl shadow-indigo-950/60 backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-3 font-mono text-[11px] text-slate-300">
                nnas://studio/workspace/vision_classifier_dag.nnas
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Validated DAG (0 Cycles)
              </span>
              <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-indigo-300 border border-indigo-500/20">
                101,770 Trainable Params
              </span>
            </div>
          </div>

          {/* Interactive DAG Simulation View */}
          <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 text-left">
            {/* Visual Flow Preview */}
            <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-[#070a11] p-5 relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Active Computational Graph
                </div>
                <span className="text-[10px] font-mono text-cyan-400">Batch Tensor [32, 1, 28, 28]</span>
              </div>

              {/* Node Pipeline Mockup */}
              <div className="flex flex-wrap items-center gap-3 pt-6 pb-4">
                <div className="rounded-lg border border-indigo-500/40 bg-indigo-950/40 p-3 shadow-md">
                  <div className="text-[10px] font-mono uppercase text-indigo-400">Input Layer</div>
                  <div className="text-xs font-bold text-white">MNIST Tensor</div>
                  <div className="text-[9px] font-mono text-slate-400 mt-1">[1, 28, 28]</div>
                </div>

                <ArrowRight className="h-4 w-4 text-slate-600" />

                <div className="rounded-lg border border-cyan-500/40 bg-cyan-950/40 p-3 shadow-md">
                  <div className="text-[10px] font-mono uppercase text-cyan-400">Flatten</div>
                  <div className="text-xs font-bold text-white">Reshape 2D-1D</div>
                  <div className="text-[9px] font-mono text-slate-400 mt-1">784 Units</div>
                </div>

                <ArrowRight className="h-4 w-4 text-slate-600" />

                <div className="rounded-lg border border-purple-500/40 bg-purple-950/40 p-3 shadow-md">
                  <div className="text-[10px] font-mono uppercase text-purple-400">Linear Dense</div>
                  <div className="text-xs font-bold text-white">128 Hidden Units</div>
                  <div className="text-[9px] font-mono text-slate-400 mt-1">ReLU Activated</div>
                </div>

                <ArrowRight className="h-4 w-4 text-slate-600" />

                <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 p-3 shadow-md">
                  <div className="text-[10px] font-mono uppercase text-emerald-400">Output Layer</div>
                  <div className="text-xs font-bold text-white">10 Logits</div>
                  <div className="text-[9px] font-mono text-slate-400 mt-1">CrossEntropy</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-lg bg-white/[0.02] p-3 text-xs border border-white/[0.04]">
                <div className="flex items-center gap-2 text-slate-300">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  <span>Real PyTorch Training Loop: <strong>98.4% Held-Out Accuracy</strong></span>
                </div>
                <button
                  onClick={() => setActiveTab('studio')}
                  className="rounded bg-indigo-600/30 px-2.5 py-1 text-[11px] font-medium text-indigo-300 hover:bg-indigo-600/50"
                >
                  Open in Canvas &rarr;
                </button>
              </div>
            </div>

            {/* Generated Code Preview */}
            <div className="rounded-xl border border-white/[0.06] bg-[#070a11] p-4 font-mono text-[11px] leading-relaxed flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.05] text-slate-400 text-xs">
                  <span className="flex items-center gap-1.5 text-indigo-400">
                    <Code2 className="h-3.5 w-3.5" />
                    Compiled PyTorch Module
                  </span>
                  <span className="text-[9px] text-emerald-400">No eval()</span>
                </div>
                <pre className="mt-3 text-slate-300 text-[10px] overflow-x-auto">
{`import torch
import torch.nn as nn

class NNASCompiledModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.flatten = nn.Flatten()
        self.fc1 = nn.Linear(784, 128)
        self.act1 = nn.ReLU()
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = self.flatten(x)
        x = self.act1(self.fc1(x))
        return self.fc2(x)`}
                </pre>
              </div>

              <div className="pt-3 border-t border-white/[0.05]">
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Inference Latency (p50):</span>
                  <span className="font-bold text-cyan-400">1.18 ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Ticker */}
      <section className="relative z-10 border-y border-white/[0.06] bg-black/40 py-10 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-2 gap-6 sm:grid-cols-4 text-center">
          <div>
            <div className="text-3xl font-extrabold text-white">100%</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
              Deterministic DAG Validator
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-cyan-400">0.0%</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
              Code Injection Risk (Zero eval)
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-indigo-400">&lt; 1.2 ms</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
              Median Serving Latency (p50)
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-400">17+</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
              PyTorch Layer Primitives
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Capabilities Grid */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
            Engineered for Production Rigour
          </h2>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything Required to Bridge Visual Architecture &amp; Real Code
          </p>
          <p className="mt-4 max-w-2xl mx-auto text-sm text-slate-400">
            Unlike academic prototypes or static canvas drawings, every node in NNAS directly builds,
            validates, trains, and exposes genuine PyTorch neural network modules.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 transition-all hover:border-indigo-500/40 hover:bg-white/[0.04]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 mb-5">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Visual DAG Canvas &amp; Shape Propagation</h3>
            <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">
              Kahn’s topological sorting prevents recursion cycles. Real-time symbolic shape engine calculates
              tensor dimensions across linear, convolutional, and sequential boundaries before execution.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 transition-all hover:border-cyan-500/40 hover:bg-white/[0.04]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 mb-5">
              <Terminal className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">1-Click Native PyTorch Export</h3>
            <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">
              Export clean, PEP-8 compliant PyTorch code that runs independently anywhere: on your local workstation,
              AWS EC2 GPU clusters, or Colab. Zero proprietary runtime dependencies.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 transition-all hover:border-rose-500/40 hover:bg-white/[0.04]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 mb-5">
              <Flame className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Explainable AI &amp; Saliency Heatmaps</h3>
            <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">
              Interactive digit drawing canvas with real-time backpropagation computing vanilla gradient saliency
              (∇_x S_c(x)) and bounded forward activation hooks to verify exactly what features the network learned.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 transition-all hover:border-purple-500/40 hover:bg-white/[0.04]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400 mb-5">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Multi-Objective Pareto NAS</h3>
            <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">
              Automated directed evolutionary mutations discover optimal neural network architectures balancing
              validation accuracy against parameter footprint and inference latency.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 transition-all hover:border-emerald-500/40 hover:bg-white/[0.04]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 mb-5">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Model Registry &amp; REST Serving</h3>
            <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">
              Stage-gate transitions (None → Staging → Production), automatic rollback pointers, and built-in
              latency benchmarks measuring p50, p95, and p99 percentiles under concurrent traffic.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 transition-all hover:border-blue-500/40 hover:bg-white/[0.04]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 mb-5">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Enterprise RBAC &amp; Audit Trail</h3>
            <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">
              Role-based access boundaries (Admin, ML Engineer, Viewer) with structured JSON logging and immutable
              audit records for SOX and ISO compliance across all deployments.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow Walkthrough */}
      <section className="relative z-10 border-t border-white/[0.06] bg-[#090d16]/60 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
              End-to-End Lifecycle
            </h2>
            <p className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              From Visual DAG to High-Throughput Production Deployment
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="rounded-xl border border-white/[0.06] bg-[#0c111c] p-6 relative">
              <div className="text-2xl font-black text-indigo-400">01</div>
              <h4 className="mt-3 text-sm font-bold text-white">Visual Composition</h4>
              <p className="mt-2 text-xs text-slate-400">
                Drag layers from catalog, wire tensors, and verify shapes in real time.
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-[#0c111c] p-6 relative">
              <div className="text-2xl font-black text-purple-400">02</div>
              <h4 className="mt-3 text-sm font-bold text-white">Isolated Training</h4>
              <p className="mt-2 text-xs text-slate-400">
                Train on vision/tabular datasets with zero-leakage transforms and early stopping.
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-[#0c111c] p-6 relative">
              <div className="text-2xl font-black text-cyan-400">03</div>
              <h4 className="mt-3 text-sm font-bold text-white">Explain &amp; Inspect</h4>
              <p className="mt-2 text-xs text-slate-400">
                Inspect 128 bounded neuron activations and draw digits for gradient heatmaps.
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-[#0c111c] p-6 relative">
              <div className="text-2xl font-black text-emerald-400">04</div>
              <h4 className="mt-3 text-sm font-bold text-white">Governed Serving</h4>
              <p className="mt-2 text-xs text-slate-400">
                Promote to Production, benchmark latency, and invoke via secured REST APIs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-20 text-center">
        <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 via-[#0c111e] to-[#07090e] p-10 shadow-2xl">
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 bg-indigo-500/20 blur-3xl rounded-full" />
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to Build Better Neural Networks?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-slate-400">
            Start designing architectures visually today. No setup fees, no external cloud dependencies,
            and 100% open architecture.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setActiveTab('studio')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-7 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/30 transition-all hover:scale-[1.02]"
            >
              Open Studio Now <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setActiveTab('login')}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-slate-300 hover:text-white"
            >
              Sign In to Your Workspace
            </button>
          </div>
        </div>
      </section>

      {/* Enterprise Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-[#05070a] py-12 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BrainCircuit className="h-5 w-5 text-indigo-400" />
            <span className="font-bold text-slate-300">Neural Network Architecture Studio (NNAS)</span>
            <span className="text-slate-600">|</span>
            <span>Production MLOps Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
            <a
              href="https://github.com/samarth3394/Neural-Network-Architecture-Studio-NNAS-"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              GitHub Source
            </a>
            <span className="text-slate-600">MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
