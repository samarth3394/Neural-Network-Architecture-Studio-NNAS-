import React, { useState } from 'react';
import {
  Layers,
  Cpu,
  Terminal,
  Activity,
  Code2,
  Lock,
  ArrowRight,
  ExternalLink,
  Shield,
  Sliders,
  Database,
  BarChart2,
  Check,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';

export const LandingPage: React.FC = () => {
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  // Interactive Live Product Demo: Real-Time Tensor Calculator
  const [demoLayer, setDemoLayer] = useState<'conv2d' | 'linear'>('conv2d');
  const [inChannels, setInChannels] = useState(1);
  const [outChannels, setOutChannels] = useState(32);
  const [kernelSize, setKernelSize] = useState(3);
  const [stride, setStride] = useState(1);
  const [padding, setPadding] = useState(1);
  const [inputH, setInputH] = useState(28);
  const [inputW, setInputW] = useState(28);

  // Linear states
  const [inFeatures, setInFeatures] = useState(784);
  const [outFeatures, setOutFeatures] = useState(128);

  // Computations
  const outH = demoLayer === 'conv2d' ? Math.floor((inputH + 2 * padding - kernelSize) / stride) + 1 : 1;
  const outW = demoLayer === 'conv2d' ? Math.floor((inputW + 2 * padding - kernelSize) / stride) + 1 : 1;
  const paramCount =
    demoLayer === 'conv2d'
      ? inChannels * outChannels * kernelSize * kernelSize + outChannels
      : inFeatures * outFeatures + outFeatures;
  const flops =
    demoLayer === 'conv2d'
      ? 2 * inChannels * kernelSize * kernelSize * outChannels * outH * outW
      : 2 * inFeatures * outFeatures;

  const [copiedCode, setCopiedCode] = useState(false);

  const generatedCode =
    demoLayer === 'conv2d'
      ? `nn.Conv2d(in_channels=${inChannels}, out_channels=${outChannels}, kernel_size=${kernelSize}, stride=${stride}, padding=${padding})`
      : `nn.Linear(in_features=${inFeatures}, out_features=${outFeatures}, bias=True)`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-[#080b11] text-slate-200">
      {/* Top Professional Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-[#080b11]/95 px-6 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded border border-slate-700 bg-slate-800 text-blue-400">
                <Cpu className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold tracking-tight text-white">NNAS</span>
              <span className="rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                v1.0.0
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-6 pl-4 border-l border-slate-800 text-xs text-slate-400 font-medium">
              <a href="#workbench" className="hover:text-white transition-colors">Interactive Demo</a>
              <a href="#specifications" className="hover:text-white transition-colors">Specifications</a>
              <a href="#pipeline" className="hover:text-white transition-colors">Architecture Pipeline</a>
              <a
                href="https://github.com/samarth3394/Neural-Network-Architecture-Studio-NNAS-"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                GitHub <ExternalLink className="h-3 w-3" />
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            {isAuthenticated ? (
              <button
                onClick={() => setActiveTab('studio')}
                className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 font-medium text-white hover:bg-blue-500 transition-colors"
              >
                Launch Studio <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('login')}
                  className="rounded-md border border-slate-700 bg-slate-800/80 px-3 py-1.5 font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setActiveTab('signup')}
                  className="rounded-md bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-500 transition-colors"
                >
                  Create Account
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-14 text-center">
        <div className="inline-flex items-center gap-2 rounded border border-slate-800 bg-slate-900/90 px-3 py-1 text-xs text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span>Industrial Deep Learning Systems Engineering</span>
          <span className="text-slate-600">/</span>
          <span className="font-mono text-slate-400">PyTorch 2.6 Native</span>
        </div>

        <h1 className="mx-auto mt-6 max-w-4xl text-3xl font-bold tracking-tight text-white sm:text-5xl leading-tight">
          Visual Neural Architecture Studio
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-400 sm:text-base leading-relaxed">
          A dedicated workbench for designing, validating, and serving PyTorch neural networks.
          Deterministic shape propagation, topological cycle validation, zero-eval code generation,
          and integrated saliency backpropagation.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setActiveTab('studio')}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            <Layers className="h-4 w-4" />
            Open Architecture Canvas
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActiveTab('login')}
            className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-850 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Lock className="h-3.5 w-3.5" />
            Demo Accounts (Admin / Engineer)
          </button>
        </div>
      </section>

      {/* Real Product Demo: Interactive Tensor Shape & Parameter Calculator */}
      <section id="workbench" className="mx-auto max-w-5xl px-6 pb-20">
        <div className="rounded-md border border-slate-800 bg-[#0d131f] p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Live Kernel &amp; Tensor Dimension Engine</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Test the underlying shape compiler interactively in real time.
              </p>
            </div>

            <div className="flex items-center rounded border border-slate-800 bg-slate-900 p-0.5 text-xs">
              <button
                onClick={() => setDemoLayer('conv2d')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  demoLayer === 'conv2d' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                nn.Conv2d
              </button>
              <button
                onClick={() => setDemoLayer('linear')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  demoLayer === 'linear' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                nn.Linear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
            {/* Input Controls */}
            <div className="space-y-3.5 text-xs">
              {demoLayer === 'conv2d' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block font-medium">In Channels</label>
                      <input
                        type="number"
                        min="1"
                        max="512"
                        value={inChannels}
                        onChange={(e) => setInChannels(Math.max(1, parseInt(e.target.value) || 1))}
                        className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-white font-mono focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block font-medium">Out Channels</label>
                      <input
                        type="number"
                        min="1"
                        max="512"
                        value={outChannels}
                        onChange={(e) => setOutChannels(Math.max(1, parseInt(e.target.value) || 1))}
                        className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-white font-mono focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-slate-400 block font-medium">Kernel</label>
                      <input
                        type="number"
                        min="1"
                        max="11"
                        value={kernelSize}
                        onChange={(e) => setKernelSize(Math.max(1, parseInt(e.target.value) || 1))}
                        className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-white font-mono focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block font-medium">Stride</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={stride}
                        onChange={(e) => setStride(Math.max(1, parseInt(e.target.value) || 1))}
                        className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-white font-mono focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block font-medium">Padding</label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        value={padding}
                        onChange={(e) => setPadding(Math.max(0, parseInt(e.target.value) || 0))}
                        className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-white font-mono focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block font-medium">Input Height (px)</label>
                      <input
                        type="number"
                        min="4"
                        max="1024"
                        value={inputH}
                        onChange={(e) => setInputH(Math.max(4, parseInt(e.target.value) || 4))}
                        className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-white font-mono focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block font-medium">Input Width (px)</label>
                      <input
                        type="number"
                        min="4"
                        max="1024"
                        value={inputW}
                        onChange={(e) => setInputW(Math.max(4, parseInt(e.target.value) || 4))}
                        className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-white font-mono focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block font-medium">In Features</label>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={inFeatures}
                      onChange={(e) => setInFeatures(Math.max(1, parseInt(e.target.value) || 1))}
                      className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-white font-mono focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block font-medium">Out Features</label>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={outFeatures}
                      onChange={(e) => setOutFeatures(Math.max(1, parseInt(e.target.value) || 1))}
                      className="mt-1 w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-white font-mono focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Formula Reference */}
              <div className="rounded border border-slate-800/80 bg-slate-900/50 p-2.5 font-mono text-[11px] text-slate-400">
                {demoLayer === 'conv2d' ? (
                  <div>H_out = floor((H_in + 2*P - K)/S) + 1 = <strong>{outH}</strong></div>
                ) : (
                  <div>y = xA^T + b | Params = in * out + out = <strong>{paramCount.toLocaleString()}</strong></div>
                )}
              </div>
            </div>

            {/* Computed Output Metrics */}
            <div className="rounded border border-slate-800 bg-slate-950 p-4 flex flex-col justify-between font-mono text-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-slate-400">
                  <span>Metric</span>
                  <span>Computed Value</span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span>Input Tensor:</span>
                  <span className="text-blue-400 font-bold">
                    {demoLayer === 'conv2d' ? `[Batch, ${inChannels}, ${inputH}, ${inputW}]` : `[Batch, ${inFeatures}]`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span>Output Tensor:</span>
                  <span className="text-emerald-400 font-bold">
                    {demoLayer === 'conv2d' ? `[Batch, ${outChannels}, ${outH}, ${outW}]` : `[Batch, ${outFeatures}]`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span>Trainable Parameters:</span>
                  <span className="text-white font-bold">{paramCount.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span>Forward FLOPs:</span>
                  <span className="text-white font-bold">{flops.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 text-[11px] truncate max-w-[260px]">{generatedCode}</span>
                <button
                  onClick={handleCopy}
                  className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-sans font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  {copiedCode ? <Check className="h-3 w-3 text-emerald-400 inline" /> : 'Copy PyTorch Call'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Specifications Matrix */}
      <section id="specifications" className="border-t border-slate-800 bg-[#0a0e17] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-xl">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              System Specifications
            </h2>
            <p className="mt-1 text-2xl font-bold text-white">
              Platform Engineering Rigour
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Strict deterministic compilation guarantees across visual topologies and backend training loops.
            </p>
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 font-mono text-slate-400">
                  <th className="py-2.5 px-4 font-semibold">Subsystem</th>
                  <th className="py-2.5 px-4 font-semibold">Architecture Standard</th>
                  <th className="py-2.5 px-4 font-semibold">Verification Guarantee</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">DAG Shape Compiler</td>
                  <td className="py-3 px-4 text-slate-400">Kahn&apos;s algorithm topological sort with symbolic tensor dimension deduction</td>
                  <td className="py-3 px-4 text-slate-300">Cycles prevented, in/out mismatch detected pre-runtime</td>
                  <td className="py-3 px-4 font-mono text-emerald-400">Verified</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Code Synthesis</td>
                  <td className="py-3 px-4 text-slate-400">AST module composition, pure Python PEP-8 code generator</td>
                  <td className="py-3 px-4 text-slate-300">Zero eval() / exec(), injection-proof static generation</td>
                  <td className="py-3 px-4 font-mono text-emerald-400">Verified</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Training Engine</td>
                  <td className="py-3 px-4 text-slate-400">Asynchronous worker queue, PyTorch DataLoader with held-out splits</td>
                  <td className="py-3 px-4 text-slate-300">Zero data leakage across train, val, and test partitions</td>
                  <td className="py-3 px-4 font-mono text-emerald-400">Verified</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Explainability Engine</td>
                  <td className="py-3 px-4 text-slate-400">Vanilla gradient saliency backprop (nabla_x S_c(x)) and activation hooks</td>
                  <td className="py-3 px-4 text-slate-300">Bounded normalization [-1, 1], 128 hidden neuron focus</td>
                  <td className="py-3 px-4 font-mono text-emerald-400">Verified</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Serving &amp; Benchmarks</td>
                  <td className="py-3 px-4 text-slate-400">FastAPI model execution endpoints with percentile telemetry (p50, p95, p99)</td>
                  <td className="py-3 px-4 text-slate-300">Median latency &lt; 1.5ms on standard desktop CPU execution</td>
                  <td className="py-3 px-4 font-mono text-emerald-400">Verified</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Architecture Pipeline Flow */}
      <section id="pipeline" className="border-t border-slate-800 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-xl">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Pipeline Workflow
            </h2>
            <p className="mt-1 text-2xl font-bold text-white">
              End-to-End Operational Lifecycle
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded border border-slate-800 bg-[#0d131f] p-4">
              <div className="text-xs font-mono font-bold text-slate-400">01 / DESIGN</div>
              <h4 className="mt-2 text-sm font-semibold text-white">Visual Composition</h4>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Wire Conv2d, Linear, BatchNorm, and Dropout nodes. Real-time shape validation prevents execution faults.
              </p>
            </div>

            <div className="rounded border border-slate-800 bg-[#0d131f] p-4">
              <div className="text-xs font-mono font-bold text-slate-400">02 / PARTITION</div>
              <h4 className="mt-2 text-sm font-semibold text-white">Data Verification</h4>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Import CSV tabular or image datasets. Automated fingerprinting (SHA-256) and zero-leakage scalers.
              </p>
            </div>

            <div className="rounded border border-slate-800 bg-[#0d131f] p-4">
              <div className="text-xs font-mono font-bold text-slate-400">03 / TRAIN</div>
              <h4 className="mt-2 text-sm font-semibold text-white">Isolated Execution</h4>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Background worker processes execute real PyTorch optimization loops with real-time telemetry streaming.
              </p>
            </div>

            <div className="rounded border border-slate-800 bg-[#0d131f] p-4">
              <div className="text-xs font-mono font-bold text-slate-400">04 / DEPLOY</div>
              <h4 className="mt-2 text-sm font-semibold text-white">Governed Registry</h4>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Stage promotions (Staging to Production), automated latency benchmarking, and instant REST API invocation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Footer */}
      <footer className="border-t border-slate-800 bg-[#06080d] py-10 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-300">Neural Network Architecture Studio</span>
            <span className="text-slate-700">|</span>
            <span>MIT Open Source License</span>
          </div>

          <div className="flex items-center gap-5 text-slate-400">
            <button
              onClick={() => setActiveTab('terms')}
              className="hover:text-white transition-colors"
            >
              Terms of Service
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </button>
            <a
              href="https://github.com/samarth3394/Neural-Network-Architecture-Studio-NNAS-"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub Repository
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
