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
  LogOut,
  Home,
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

  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const logoutUser = useAppStore((s) => s.logoutUser);

  return (
    <header className="flex h-14 items-center justify-between border-b border-white/[0.08] bg-[#090d16]/90 px-4 backdrop-blur-xl">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => setActiveTab('landing')}
          className="group flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
          title="Back to Landing Page"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 p-[1px] shadow-md shadow-indigo-500/25">
            <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#0b0f17]">
              <BrainCircuit className="h-4.5 w-4.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              NNAS
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-mono text-indigo-300 border border-indigo-500/20">
                v1.0 Core
              </span>
            </div>
          </div>
        </button>

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

        {/* User Role Badge & Logout */}
        <div className="ml-2 flex items-center gap-2 border-l border-white/10 pl-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 text-indigo-300 border border-white/10">
            <UserIcon className="h-3.5 w-3.5" />
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-[11px] font-medium text-slate-200 leading-tight">
              {currentUser?.full_name || 'Lead Architect'}
            </div>
            <div className="text-[9px] font-mono text-cyan-400 uppercase">
              {currentUser?.role || 'admin'}
            </div>
          </div>
          <button
            onClick={() => setActiveTab('landing')}
            className="rounded p-1 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            title="Landing Page"
          >
            <Home className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={logoutUser}
            className="rounded p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
