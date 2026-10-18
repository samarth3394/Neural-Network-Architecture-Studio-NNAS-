import React, { useState } from 'react';
import { X, Copy, Check, Download } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';

export const PyTorchCodeModal: React.FC = () => {
  const isCodeModalOpen = useStudioStore((s) => s.isCodeModalOpen);
  const setCodeModalOpen = useStudioStore((s) => s.setCodeModalOpen);
  const pytorchCode = useStudioStore((s) => s.pytorchCode);
  const graph = useStudioStore((s) => s.graph);
  const [copied, setCopied] = useState(false);

  if (!isCodeModalOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(pytorchCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([pytorchCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${graph.name.toLowerCase().replace(/\s+/g, '_')}_model.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex h-[80vh] w-full max-w-4xl flex-col rounded-2xl border border-studio-700 bg-studio-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-studio-800 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-white">Generated PyTorch Implementation</h2>
            <p className="text-xs text-slate-400">
              Clean, standalone, executable PyTorch model code matching your visual architecture graph
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-studio-700 bg-studio-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-studio-700 hover:text-white"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy Code'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-lg border border-studio-700 bg-studio-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-studio-700 hover:text-white"
            >
              <Download className="h-3.5 w-3.5" />
              Download .py
            </button>
            <button
              onClick={() => setCodeModalOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-studio-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto bg-[#07090e] p-6 font-mono text-xs leading-relaxed text-slate-200">
          <pre>{pytorchCode}</pre>
        </div>
      </div>
    </div>
  );
};
