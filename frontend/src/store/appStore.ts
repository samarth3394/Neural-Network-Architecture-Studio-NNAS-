import { create } from 'zustand';
import { WorkspaceRecord, ProjectRecord, UserRecord } from '../types';
import { api } from '../api/client';

export type AppTab =
  | 'dashboard'
  | 'projects'
  | 'studio'
  | 'datasets'
  | 'training'
  | 'experiments'
  | 'optimization'
  | 'registry'
  | 'deployment'
  | 'explainability'
  | 'monitoring'
  | 'settings'
  | 'users'
  | 'audit';

interface AppState {
  activeTab: AppTab;
  workspaces: WorkspaceRecord[];
  projects: ProjectRecord[];
  currentWorkspace: WorkspaceRecord | null;
  currentProject: ProjectRecord | null;
  currentUser: UserRecord | null;
  isLoading: boolean;

  setActiveTab: (tab: AppTab) => void;
  setCurrentWorkspace: (ws: WorkspaceRecord) => void;
  setCurrentProject: (proj: ProjectRecord) => void;
  initApp: () => Promise<void>;
  refreshProjects: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeTab: 'studio', // Architecture Studio is the main product experience
  workspaces: [],
  projects: [],
  currentWorkspace: null,
  currentProject: null,
  currentUser: null,
  isLoading: true,

  setActiveTab: (tab) => set({ activeTab: tab }),

  setCurrentWorkspace: (ws) => {
    set({ currentWorkspace: ws });
    get().refreshProjects();
  },

  setCurrentProject: (proj) => set({ currentProject: proj }),

  initApp: async () => {
    set({ isLoading: true });
    try {
      // Fetch user profile
      try {
        const user = await api.getCurrentUser();
        set({ currentUser: user });
      } catch {
        // Fallback default admin
        set({
          currentUser: {
            id: 'admin-seed',
            email: 'admin@nnas.local',
            full_name: 'Lead ML Architect',
            role: 'admin',
            is_active: true,
          },
        });
      }

      // Fetch Workspaces
      const wsList = await api.getWorkspaces();
      set({ workspaces: wsList });
      const defaultWs = wsList.find((w) => w.slug === 'default') || wsList[0] || null;
      set({ currentWorkspace: defaultWs });

      if (defaultWs) {
        const projList = await api.getProjects(defaultWs.id);
        set({ projects: projList });
        if (projList.length > 0) {
          set({ currentProject: projList[0] });
        }
      }
    } catch (e) {
      console.error('App init error:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  refreshProjects: async () => {
    const ws = get().currentWorkspace;
    if (!ws) return;
    try {
      const projList = await api.getProjects(ws.id);
      set({ projects: projList });
      if (projList.length > 0 && !projList.some((p) => p.id === get().currentProject?.id)) {
        set({ currentProject: projList[0] });
      }
    } catch (e) {
      console.error('Failed to refresh projects:', e);
    }
  },
}));
