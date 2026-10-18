import React, { useState } from 'react';
import { FolderGit2, Plus, ArrowRight, Calendar, Layers } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { api } from '../api/client';

export const ProjectsPage: React.FC = () => {
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);
  const projects = useAppStore((s) => s.projects);
  const currentProject = useAppStore((s) => s.currentProject);
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);
  const refreshProjects = useAppStore((s) => s.refreshProjects);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !name.trim()) return;
    setLoading(true);
    try {
      const newP = await api.createProject(currentWorkspace.id, name, description);
      await refreshProjects();
      setCurrentProject(newP);
      setIsModalOpen(false);
      setName('');
      setDescription('');
    } catch (e: any) {
      alert(`Error creating project: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Project Registry</h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize neural network models, experiments, and datasets within workspace: {currentWorkspace?.name}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-accent-blue px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => {
          const isSelected = p.id === currentProject?.id;
          return (
            <div
              key={p.id}
              onClick={() => setCurrentProject(p)}
              className={`cursor-pointer rounded-xl border p-5 transition-all duration-150 ${
                isSelected
                  ? 'border-accent-blue bg-studio-900/90 shadow-lg shadow-blue-500/10 ring-1 ring-accent-blue/30'
                  : 'border-studio-800 bg-studio-900/50 hover:border-studio-700 hover:bg-studio-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderGit2 className={`h-4 w-4 ${isSelected ? 'text-accent-blue' : 'text-slate-400'}`} />
                  <h3 className="text-sm font-semibold text-white">{p.name}</h3>
                </div>
                {isSelected && (
                  <span className="rounded bg-accent-blue/20 px-2 py-0.5 text-[10px] font-mono text-accent-blue font-semibold">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                {p.description || 'No description provided.'}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-studio-800 pt-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Active'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentProject(p);
                    setActiveTab('studio');
                  }}
                  className="flex items-center gap-1 text-accent-blue hover:underline"
                >
                  Open Studio <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md rounded-2xl border border-studio-700 bg-studio-900 p-6 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white">Create New Project</h3>
            <p className="text-xs text-slate-400 mt-1">Group your architecture graphs and experiments</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vision Transformer Benchmark"
                  className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Project goals, data types, and architectures..."
                  className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-studio-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-studio-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-accent-blue px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
