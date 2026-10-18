import { create } from 'zustand';
import { WorkspaceRecord, ProjectRecord, UserRecord } from '../types';
import { api } from '../api/client';

export type AppTab =
  | 'landing'
  | 'login'
  | 'signup'
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
  isAuthenticated: boolean;
  isLoading: boolean;

  setActiveTab: (tab: AppTab) => void;
  setCurrentWorkspace: (ws: WorkspaceRecord) => void;
  setCurrentProject: (proj: ProjectRecord) => void;
  initApp: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  loginUser: (formData: FormData) => Promise<void>;
  registerUser: (data: { email: string; password: string; full_name: string; role?: string }) => Promise<void>;
  logoutUser: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeTab: 'landing', // Modern default: start on premium Landing Page, seamlessly jump into Studio
  workspaces: [],
  projects: [],
  currentWorkspace: null,
  currentProject: null,
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,

  setActiveTab: (tab) => set({ activeTab: tab }),

  setCurrentWorkspace: (ws) => {
    set({ currentWorkspace: ws });
    get().refreshProjects();
  },

  setCurrentProject: (proj) => set({ currentProject: proj }),

  loginUser: async (formData: FormData) => {
    const data = await api.login(formData);
    set({ currentUser: data.user, isAuthenticated: true, activeTab: 'studio' });
    await get().initApp();
  },

  registerUser: async (regData) => {
    const data = await api.register(regData);
    set({ currentUser: data.user, isAuthenticated: true, activeTab: 'studio' });
    await get().initApp();
  },

  logoutUser: () => {
    api.logout();
    set({
      currentUser: null,
      isAuthenticated: false,
      activeTab: 'landing',
    });
  },

  initApp: async () => {
    set({ isLoading: true });
    try {
      // Fetch user profile if token exists
      try {
        const user = await api.getCurrentUser();
        set({ currentUser: user, isAuthenticated: true });
      } catch {
        // No active remote session; if user visited directly, allow explore mode
        set({
          currentUser: {
            id: 'admin-seed',
            email: 'admin@nnas.local',
            full_name: 'Lead ML Architect',
            role: 'admin',
            is_active: true,
          },
          isAuthenticated: !!api.getToken(),
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
