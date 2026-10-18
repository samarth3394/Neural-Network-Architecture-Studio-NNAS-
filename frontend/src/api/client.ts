import {
  ArchitectureGraph,
  ValidationResult,
  ArchitectureRecord,
  DatasetRecord,
  TrainingJobRecord,
  ExperimentRecord,
  ModelRecord,
  DeploymentRecord,
  UserRecord,
  WorkspaceRecord,
  ProjectRecord,
  LayerCatalogItem,
} from '../types';

const API_BASE = '/api/v1';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('nnas_auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('nnas_auth_token', token);
    } else {
      localStorage.removeItem('nnas_auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errDetail = 'Request failed';
      try {
        const errJson = await response.json();
        errDetail = errJson.detail || JSON.stringify(errJson);
      } catch {
        errDetail = response.statusText;
      }
      throw new Error(errDetail);
    }

    return response.json();
  }

  // Auth
  async login(formData: FormData) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      let detail = 'Invalid email or password';
      try {
        const err = await res.json();
        detail = err.detail || detail;
      } catch {}
      throw new Error(detail);
    }
    const data = await res.json();
    this.setToken(data.access_token);
    return data;
  }

  async register(data: { email: string; password: string; full_name: string; role?: string }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      let detail = 'Registration failed';
      try {
        const err = await res.json();
        detail = err.detail || detail;
      } catch {}
      throw new Error(detail);
    }
    const resData = await res.json();
    this.setToken(resData.access_token);
    return resData;
  }

  logout() {
    this.setToken(null);
  }

  async getCurrentUser(): Promise<UserRecord> {
    return this.request<UserRecord>('/auth/me');
  }

  // Workspaces & Projects
  async getWorkspaces(): Promise<WorkspaceRecord[]> {
    return this.request<WorkspaceRecord[]>('/workspaces');
  }

  async getProjects(workspaceId?: string): Promise<ProjectRecord[]> {
    const query = workspaceId ? `?workspace_id=${workspaceId}` : '';
    return this.request<ProjectRecord[]>(`/projects${query}`);
  }

  async createProject(workspaceId: string, name: string, description: string): Promise<ProjectRecord> {
    return this.request<ProjectRecord>('/projects', {
      method: 'POST',
      body: JSON.stringify({ workspace_id: workspaceId, name, description }),
    });
  }

  // Architectures
  async getLayerCatalog(): Promise<Record<string, LayerCatalogItem>> {
    return this.request<Record<string, LayerCatalogItem>>('/architectures/catalog');
  }

  async validateArchitecture(graph: ArchitectureGraph): Promise<ValidationResult> {
    return this.request<ValidationResult>('/architectures/validate', {
      method: 'POST',
      body: JSON.stringify(graph),
    });
  }

  async generatePyTorchCode(graph: ArchitectureGraph): Promise<{ code: string }> {
    return this.request<{ code: string }>('/architectures/generate-code', {
      method: 'POST',
      body: JSON.stringify(graph),
    });
  }

  async getArchitectures(projectId?: string): Promise<ArchitectureRecord[]> {
    const query = projectId ? `?project_id=${projectId}` : '';
    return this.request<ArchitectureRecord[]>(`/architectures${query}`);
  }

  async saveArchitecture(data: {
    project_id: string;
    name: string;
    version?: string;
    description?: string;
    task: string;
    graph: ArchitectureGraph;
  }): Promise<ArchitectureRecord> {
    return this.request<ArchitectureRecord>('/architectures', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateArchitecture(id: string, data: {
    project_id: string;
    name: string;
    version?: string;
    description?: string;
    task: string;
    graph: ArchitectureGraph;
  }): Promise<ArchitectureRecord> {
    return this.request<ArchitectureRecord>(`/architectures/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Datasets
  async getDatasets(workspaceId?: string): Promise<DatasetRecord[]> {
    const query = workspaceId ? `?workspace_id=${workspaceId}` : '';
    return this.request<DatasetRecord[]>(`/datasets${query}`);
  }

  async uploadCsvDataset(workspaceId: string, name: string, file: File, targetColumn?: string): Promise<DatasetRecord> {
    const formData = new FormData();
    formData.append('workspace_id', workspaceId);
    formData.append('name', name);
    if (targetColumn) formData.append('target_column', targetColumn);
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(`${API_BASE}/datasets/upload-csv`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  }

  async uploadImageZipDataset(
    workspaceId: string,
    name: string,
    file: File,
    colorMode: 'grayscale' | 'rgb' = 'grayscale',
    imageSize: number = 28
  ): Promise<DatasetRecord> {
    const formData = new FormData();
    formData.append('workspace_id', workspaceId);
    formData.append('name', name);
    formData.append('color_mode', colorMode);
    formData.append('image_size', String(imageSize));
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(`${API_BASE}/datasets/upload-zip`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  }

  // Training
  async submitTrainingJob(config: {
    project_id: string;
    architecture_id: string;
    dataset_id: string;
    epochs: number;
    batch_size: number;
    learning_rate: number;
    optimizer: string;
  }): Promise<TrainingJobRecord> {
    return this.request<TrainingJobRecord>('/training/jobs', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getTrainingJobs(projectId?: string): Promise<TrainingJobRecord[]> {
    const query = projectId ? `?project_id=${projectId}` : '';
    return this.request<TrainingJobRecord[]>(`/training/jobs${query}`);
  }

  async getTrainingJob(id: string): Promise<TrainingJobRecord> {
    return this.request<TrainingJobRecord>(`/training/jobs/${id}`);
  }

  async cancelTrainingJob(id: string): Promise<void> {
    await this.request(`/training/jobs/${id}/cancel`, { method: 'POST' });
  }

  async pauseTrainingJob(id: string): Promise<void> {
    await this.request(`/training/jobs/${id}/pause`, { method: 'POST' });
  }

  async resumeTrainingJob(id: string): Promise<void> {
    await this.request(`/training/jobs/${id}/resume`, { method: 'POST' });
  }

  // Experiments
  async getExperiments(projectId?: string): Promise<ExperimentRecord[]> {
    const query = projectId ? `?project_id=${projectId}` : '';
    return this.request<ExperimentRecord[]>(`/experiments${query}`);
  }

  async compareExperiments(ids: string[]): Promise<{ experiments: any[] }> {
    return this.request('/experiments/compare', {
      method: 'POST',
      body: JSON.stringify({ experiment_ids: ids }),
    });
  }

  // Architecture Optimization (NAS)
  async submitOptimizationJob(config: {
    project_id: string;
    base_architecture_id: string;
    dataset_id: string;
    max_trials: number;
    timeout_seconds: number;
    strategy: string;
  }): Promise<any> {
    return this.request('/optimization/jobs', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getOptimizationJobs(projectId?: string): Promise<any[]> {
    const query = projectId ? `?project_id=${projectId}` : '';
    return this.request(`/optimization/jobs${query}`);
  }

  async getOptimizationJob(id: string): Promise<any> {
    return this.request(`/optimization/jobs/${id}`);
  }

  // Model Registry
  async getModels(projectId?: string, stage?: string): Promise<ModelRecord[]> {
    const params = new URLSearchParams();
    if (projectId) params.append('project_id', projectId);
    if (stage) params.append('stage', stage);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<ModelRecord[]>(`/registry/models${query}`);
  }

  async transitionModelStage(id: string, stage: string, notes?: string): Promise<ModelRecord> {
    return this.request<ModelRecord>(`/registry/models/${id}/transition-stage`, {
      method: 'POST',
      body: JSON.stringify({ stage, approval_notes: notes }),
    });
  }

  // Deployments
  async getDeployments(): Promise<DeploymentRecord[]> {
    return this.request<DeploymentRecord[]>('/deployments');
  }

  async createDeployment(modelId: string, name: string, endpointPath: string): Promise<DeploymentRecord> {
    return this.request<DeploymentRecord>('/deployments', {
      method: 'POST',
      body: JSON.stringify({ model_id: modelId, name, endpoint_path: endpointPath }),
    });
  }

  async benchmarkDeployment(id: string): Promise<any> {
    return this.request(`/deployments/${id}/benchmark`, { method: 'POST' });
  }

  async rollbackDeployment(id: string, targetModelId: string): Promise<any> {
    return this.request(`/deployments/${id}/rollback?target_model_id=${targetModelId}`, { method: 'POST' });
  }

  // Inference
  async predictDeployment(deploymentId: string, inputData: any): Promise<any> {
    return this.request(`/inference/deployments/${deploymentId}/predict`, {
      method: 'POST',
      body: JSON.stringify({ input_data: inputData }),
    });
  }

  async inferMNISTCanvas(pixels: number[][], modelId?: string): Promise<{
    model_used: string;
    predicted_digit: number;
    confidence: number;
    probabilities: number[];
    saliency_heatmap: number[][];
    attribution_method: string;
  }> {
    return this.request('/inference/mnist-canvas', {
      method: 'POST',
      body: JSON.stringify({ pixels, model_id: modelId }),
    });
  }

  // Visualization
  async getLayerActivations(architectureId: string, sampleInput?: any): Promise<any> {
    return this.request('/visualization/activations', {
      method: 'POST',
      body: JSON.stringify({ architecture_id: architectureId, sample_input: sampleInput }),
    });
  }

  async getWeightDistributions(architectureId: string): Promise<any> {
    return this.request(`/visualization/weights/${architectureId}`);
  }

  // Monitoring & Audit
  async getMonitoringHealth(): Promise<any> {
    return this.request('/monitoring/health');
  }

  async getAuditLogs(workspaceId?: string): Promise<any[]> {
    const query = workspaceId ? `?workspace_id=${workspaceId}` : '';
    return this.request(`/audit${query}`);
  }
}

export const api = new ApiClient();
