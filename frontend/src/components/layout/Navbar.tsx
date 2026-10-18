import React, { useState } from 'react';
import {
  BrainCircuit,
  Save,
  RotateCcw,
  RotateCw,
  FolderGit2,
  Building2,
  User as UserIcon,
  LogOut,
  Check,
  Home,
  Cpu,
} from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { useAppStore } from '../../store/appStore';
import { api } from '../../api/client';

export const Navbar: React.FC = () => {
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);
  const currentProject = useAppStore((s) => s.currentProject);
  const workspaces = useAppStore((s) => s.workspaces);
  const projects = useAppStore((s) => s.projects);
  const setCurrentWorkspace = useAppStore((s) => s.setCurrentWorkspace);
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);
  const currentUser = useAppStore((s) => s.currentUser);

  const graph = useStudioStore((s) => s.graph);
  const undo = useStudioStore((s) => s.undo);
  const redo = useStudioStore((s) => s.redo);
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
    <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-[#090d16] px-4">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('landing')}
          className="flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors"
          title="Back to Landing Page"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded border border-slate-700 bg-slate-800 text-blue-400">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              NNAS
              <span className="rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                v1.0 Core
              </span>
            </div>
          </div>
        </button>

        {/* Workspace & Project Selectors */}
        <div className="hidden md:flex items-center gap-3 border-l border-slate-800 pl-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Building2 className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={currentWorkspace?.id || ''}
              onChange={(e) => {
                const ws = workspaces.find((w) => w.id === e.target.value);
                if (ws) setCurrentWorkspace(ws);
              }}
              className="rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-slate-200 focus:border-blue-500 focus:outline-none"
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
              className="rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-slate-200 focus:border-blue-500 focus:outline-none"
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
          className="rounded border border-transparent bg-transparent px-2 py-1 text-xs font-semibold text-slate-200 transition-colors hover:border-slate-800 focus:border-blue-500 focus:bg-slate-900 focus:outline-none"
          title="Click to rename architecture"
        />
        <span className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-slate-400 uppercase">
          {graph.task}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-md border border-slate-800 bg-slate-900 p-0.5">
          <button
            type="button"
            onClick={undo}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={redo}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
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
        <div className="ml-2 flex items-center gap-2 border-l border-slate-800 pl-3">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-slate-800 bg-slate-900 text-blue-400">
            <UserIcon className="h-3.5 w-3.5" />
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-[11px] font-medium text-slate-200 leading-tight">
              {currentUser?.full_name || 'Lead Architect'}
            </div>
            <div className="text-[9px] font-mono text-slate-400 uppercase">
              {currentUser?.role || 'admin'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('landing')}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Landing Page"
          >
            <Home className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={logoutUser}
            className="rounded p-1 text-slate-400 hover:bg-rose-950 hover:text-rose-400 transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
