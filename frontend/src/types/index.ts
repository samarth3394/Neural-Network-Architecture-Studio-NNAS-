export type LayerType =
  | 'Input'
  | 'Linear'
  | 'Dense'
  | 'ReLU'
  | 'Sigmoid'
  | 'Tanh'
  | 'Dropout'
  | 'BatchNorm1d'
  | 'BatchNorm2d'
  | 'Flatten'
  | 'Conv2d'
  | 'MaxPool2d'
  | 'AvgPool2d'
  | 'LSTM'
  | 'GRU'
  | 'TransformerEncoder'
  | 'Softmax';

export interface ArchitectureNode {
  id: string;
  type: LayerType;
  name?: string;
  parameters: Record<string, any>;
  position?: { x: number; y: number };
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  source_handle?: string;
  target_handle?: string;
}

export interface ArchitectureGraph {
  id?: string;
  name: string;
  version: string;
  description?: string;
  task: 'classification' | 'regression';
  framework: 'pytorch';
  input_shape: number[];
  num_classes?: number;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  metadata?: Record<string, any>;
}

export interface LayerShapeInfo {
  node_id: string;
  layer_type: string;
  input_shape: number[];
  output_shape: number[];
  param_count: number;
  trainable_params: number;
}

export interface ValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  total_parameters: number;
  trainable_parameters: number;
  layer_shapes: LayerShapeInfo[];
  execution_order: string[];
}

export interface LayerCatalogItem {
  category: string;
  description: string;
  params: Record<string, {
    type: string;
    default: any;
    min?: number;
    max?: number;
    description: string;
  }>;
}

export interface ArchitectureRecord {
  id: string;
  project_id: string;
  name: string;
  version: string;
  description?: string;
  task: string;
  input_shape: number[];
  num_classes: number;
  total_params: number;
  trainable_params: number;
  is_valid: boolean;
  graph: ArchitectureGraph;
  created_at: string;
}

export interface DatasetRecord {
  id: string;
  workspace_id: string;
  name: string;
  dataset_type: string;
  num_samples: number;
  input_shape: number[];
  num_classes: number;
  fingerprint?: string;
  schema_info: Record<string, any>;
  created_at: string;
}

export interface TrainingMetric {
  epoch: number;
  train_loss: number;
  val_loss: number;
  train_acc?: number;
  val_acc?: number;
  epoch_time_seconds: number;
}

export interface TrainingJobRecord {
  id: string;
  project_id: string;
  architecture_id: string;
  dataset_id: string;
  status: 'QUEUED' | 'STARTING' | 'RUNNING' | 'PAUSING' | 'PAUSED' | 'CANCELLING' | 'CANCELLED' | 'SUCCEEDED' | 'FAILED';
  current_epoch: number;
  total_epochs: number;
  best_val_loss?: number;
  best_epoch?: number;
  duration_seconds: number;
  metrics_history: TrainingMetric[];
  logs: string[];
  evaluation: Record<string, any>;
  error_message?: string;
  created_at: string;
}

export interface ExperimentRecord {
  id: string;
  project_id: string;
  name: string;
  notes?: string;
  training_job_id: string;
  architecture_id: string;
  metrics_summary: Record<string, any>;
  created_at: string;
}

export interface ModelRecord {
  id: string;
  project_id: string;
  architecture_id: string;
  training_job_id?: string;
  name: string;
  version: string;
  stage: 'draft' | 'trained' | 'evaluated' | 'approved' | 'deployed' | 'archived';
  metrics: Record<string, any>;
  checkpoint_path?: string;
  approval_notes?: string;
  created_at: string;
}

export interface DeploymentRecord {
  id: string;
  model_id: string;
  name: string;
  endpoint_path: string;
  status: string;
  latency_p50: number;
  latency_p95: number;
  request_count: number;
  created_at: string;
}

export interface UserRecord {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
}

export interface WorkspaceRecord {
  id: string;
  name: string;
  slug: string;
  description?: string;
  owner_id: string;
  role: string;
}

export interface ProjectRecord {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  created_at: string;
}
