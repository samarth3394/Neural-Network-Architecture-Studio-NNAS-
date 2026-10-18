import React, { useState } from 'react';
import { Settings, Shield, HardDrive, Key, Save, Check } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export const SettingsPage: React.FC = () => {
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);
  const [name, setName] = useState(currentWorkspace?.name || 'Default Production Workspace');
  const [maxConcurrency, setMaxConcurrency] = useState(4);
  const [maxUploadMB, setMaxUploadMB] = useState(50);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Workspace Configuration & Quotas</h1>
        <p className="text-xs text-slate-400 mt-1">
          Compute quotas, storage retention policies, and workspace governance settings
        </p>
      </div>

      <form onSubmit={handleSave} className="max-w-2xl space-y-5">
        <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Settings className="h-4 w-4 text-accent-blue" />
            General Workspace Info
          </h3>

          <div>
            <label className="text-xs font-medium text-slate-300">Workspace Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Workspace Identifier (Slug)</label>
            <input
              type="text"
              disabled
              value={currentWorkspace?.slug || 'default'}
              className="mt-1 w-full rounded-lg border border-studio-800 bg-studio-950/50 px-3 py-2 text-xs font-mono text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-accent-cyan" />
            Compute & Storage Quotas
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300">Max Concurrent Training Workers</label>
              <input
                type="number"
                min="1"
                max="16"
                value={maxConcurrency}
                onChange={(e) => setMaxConcurrency(parseInt(e.target.value, 10))}
                className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">Max Dataset Upload Size (MB)</label>
              <input
                type="number"
                min="10"
                max="500"
                value={maxUploadMB}
                onChange={(e) => setMaxUploadMB(parseInt(e.target.value, 10))}
                className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600"
        >
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Settings Saved' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};
