import React, { useState } from 'react';
import {
  BrainCircuit,
  Save,
  RotateCcw,
  RotateCw,
  FolderGit2,
  Building2,
  User as UserIcon,
  Check,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useStudioStore } from '../../store/studioStore';
import { api } from '../../api/client';

export const Navbar: React.FC = () => {
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);
  const currentProject = useAppStore((s) => s.currentProject);
  const currentUser = useAppStore((s) => s.currentUser);
  const workspaces = useAppStore((s) => s.workspaces);
  const setCurrentWorkspace = useAppStore((s) => s.setCurrentWorkspace);
  const projects = useAppStore((s) => s.projects);
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);

  const graph = useStudioStore((s) => s.graph);
  const undo = useStudioStore((s) => s.undo);
  const redo = useStudioStore((s) => s.redo);
  const isDirty = useStudioStore((s) => s.isDirty);
  const updateGraphMetadata = useStudioStore((s) => s.updateGraphMetadata);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    if (!currentProject) {
      alert('Please select or create a project first.');
      return;
    }
    setSaving(true);
    try {
      await api.saveArchitecture({
        project_id: currentProject.id,
        name: graph.name,
        version: graph.version,
        task: graph.task,
        graph,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e: any) {
      alert(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-studio-800 bg-studio-950 px-4">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-accent-blue/15 p-1.5 text-accent-blue">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              NNAS
              <span className="rounded bg-accent-blue/10 px-1.5 py-0.2 text-[10px] font-mono text-accent-blue border border-accent-blue/20">
                Studio v1.0
              </span>
            </div>
          </div>
        </div>

        {/* Workspace & Project Selectors */}
        <div className="hidden md:flex items-center gap-3 border-l border-studio-800 pl-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Building2 className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={currentWorkspace?.id || ''}
              onChange={(e) => {
                const ws = workspaces.find((w) => w.id === e.target.value);
                if (ws) setCurrentWorkspace(ws);
              }}
              className="rounded border border-studio-800 bg-studio-900 px-2 py-1 text-slate-200 focus:border-accent-blue focus:outline-none"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <FolderGit2 className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={currentProject?.id || ''}
              onChange={(e) => {
                const p = projects.find((proj) => proj.id === e.target.value);
                if (p) setCurrentProject(p);
              }}
              className="rounded border border-studio-800 bg-studio-900 px-2 py-1 text-slate-200 focus:border-accent-blue focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Center: Architecture Title Edit */}
      <div className="hidden lg:flex items-center gap-2">
        <input
          type="text"
          value={graph.name}
          onChange={(e) => updateGraphMetadata(e.target.value, graph.task, graph.input_shape)}
          className="rounded border border-transparent bg-transparent px-2 py-1 text-xs font-semibold text-slate-200 transition-colors hover:border-studio-700 focus:border-accent-blue focus:bg-studio-900 focus:outline-none"
          title="Click to rename architecture"
        />
        <span className="rounded bg-studio-850 px-2 py-0.5 text-[10px] font-mono text-slate-400 uppercase">
          {graph.task}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-studio-800 bg-studio-900 p-0.5">
          <button
            onClick={undo}
            className="rounded p-1 text-slate-400 hover:bg-studio-800 hover:text-white"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={redo}
            className="rounded p-1 text-slate-400 hover:bg-studio-800 hover:text-white"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-accent-blue px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-600 disabled:opacity-50"
        >
          {saveSuccess ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-200" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving...' : 'Save Graph'}
            </>
          )}
        </button>

        {/* User Role Badge */}
        <div className="ml-2 flex items-center gap-2 border-l border-studio-800 pl-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-studio-800 text-slate-300">
            <UserIcon className="h-4 w-4" />
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-[11px] font-medium text-slate-200 leading-tight">
              {currentUser?.full_name || 'ML Architect'}
            </div>
            <div className="text-[9px] font-mono text-accent-cyan uppercase">
              {currentUser?.role || 'admin'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
