import React, { useEffect, useState } from 'react';
import {
  Database,
  Upload,
  CheckCircle2,
  FileText,
  BarChart2,
  Fingerprint,
  BrainCircuit,
  ArrowRight,
  PlayCircle,
  FolderArchive,
  Layers,
  Info,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useStudioStore } from '../store/studioStore';
import { api } from '../api/client';
import { DatasetRecord } from '../types';

export const DatasetsPage: React.FC = () => {
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setTargetDatasetId = useAppStore((s) => s.setTargetDatasetId);
  const resetGraph = useStudioStore((s) => s.resetGraph);
  const updateGraphMetadata = useStudioStore((s) => s.updateGraphMetadata);
  const [datasets, setDatasets] = useState<DatasetRecord[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<DatasetRecord | null>(null);

  // CSV Upload State
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [targetColumn, setTargetColumn] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [loadingCsv, setLoadingCsv] = useState(false);

  // Image ZIP Upload State
  const [isUploadingZip, setIsUploadingZip] = useState(false);
  const [zipName, setZipName] = useState('');
  const [zipColorMode, setZipColorMode] = useState<'grayscale' | 'rgb'>('grayscale');
  const [zipImageSize, setZipImageSize] = useState<number>(28);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [loadingZip, setLoadingZip] = useState(false);

  const loadDatasets = async () => {
    try {
      const data = await api.getDatasets();
      setDatasets(data);
      if (data.length > 0 && !selectedDataset) {
        setSelectedDataset(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, [currentWorkspace]);

  const handleUploadCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !uploadFile || !uploadName.trim()) return;
    setLoadingCsv(true);
    try {
      const created = await api.uploadCsvDataset(
        currentWorkspace.id,
        uploadName.trim(),
        uploadFile,
        targetColumn.trim() || undefined
      );
      await loadDatasets();
      setSelectedDataset(created);
      setIsUploadingCsv(false);
      setUploadName('');
      setTargetColumn('');
      setUploadFile(null);
    } catch (e: any) {
      alert(`Upload failed: ${e.message}`);
    } finally {
      setLoadingCsv(false);
    }
  };

  const handleUploadZip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !zipFile || !zipName.trim()) return;
    setLoadingZip(true);
    try {
      const created = await api.uploadImageZipDataset(
        currentWorkspace.id,
        zipName.trim(),
        zipFile,
        zipColorMode,
        zipImageSize
      );
      await loadDatasets();
      setSelectedDataset(created);
      setIsUploadingZip(false);
      setZipName('');
      setZipFile(null);
    } catch (e: any) {
      alert(`Upload failed: ${e.message}`);
    } finally {
      setLoadingZip(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Dataset Registry & Schema Quality</h1>
          <p className="text-xs text-slate-400 mt-1">
            Certified training, validation, and test datasets with zero-leakage preprocessing pipelines
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsUploadingZip(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-colors"
          >
            <FolderArchive className="h-4 w-4" />
            <span>Upload Image ZIP (.zip)</span>
          </button>
          <button
            type="button"
            onClick={() => setIsUploadingCsv(true)}
            className="flex items-center gap-1.5 rounded-lg bg-accent-blue px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Upload CSV Dataset</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Datasets List */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Datasets</div>
          <div className="space-y-2">
            {datasets.map((d) => {
              const isSelected = d.id === selectedDataset?.id;
              const isImageZip = d.dataset_type === 'custom_image_zip';
              const isCsv = d.dataset_type === 'custom_csv';

              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDataset(d)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all duration-150 ${
                    isSelected
                      ? 'border-accent-blue bg-studio-900/90 shadow-md ring-1 ring-accent-blue/30'
                      : 'border-studio-800 bg-studio-900/50 hover:border-studio-700 hover:bg-studio-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isImageZip ? (
                        <FolderArchive className={`h-4 w-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                      ) : (
                        <Database className={`h-4 w-4 ${isSelected ? 'text-accent-blue' : 'text-slate-400'}`} />
                      )}
                      <h4 className="text-xs font-semibold text-white truncate max-w-[170px]">{d.name}</h4>
                    </div>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-mono uppercase ${
                        isImageZip
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          : isCsv
                          ? 'bg-blue-950/80 text-blue-400 border border-blue-800/60'
                          : 'bg-studio-800 text-slate-400'
                      }`}
                    >
                      {isImageZip ? 'IMAGE ZIP' : isCsv ? 'TABULAR CSV' : d.dataset_type}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{d.num_samples.toLocaleString()} samples</span>
                    <span>shape: [{d.input_shape.join(', ')}]</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Dataset Inspection */}
        <div className="lg:col-span-2 rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm">
          {selectedDataset ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-studio-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedDataset.name}</h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                    <span>
                      Type:{' '}
                      <strong className="text-slate-200">
                        {selectedDataset.dataset_type === 'custom_image_zip'
                          ? 'Image Archive (ZIP)'
                          : selectedDataset.dataset_type === 'custom_csv'
                          ? 'Tabular CSV'
                          : selectedDataset.dataset_type}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Total Samples: <strong className="text-slate-200">{selectedDataset.num_samples.toLocaleString()}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Classes: <strong className="text-slate-200">{selectedDataset.num_classes}</strong>
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedDataset.input_shape.length > 1) {
                        resetGraph('convnet');
                      } else {
                        resetGraph('tabular');
                      }
                      updateGraphMetadata(
                        `${selectedDataset.name} Network`,
                        'classification',
                        selectedDataset.input_shape
                      );
                      setActiveTab('studio');
                    }}
                    className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
                  >
                    <BrainCircuit className="h-3.5 w-3.5" />
                    <span>Design Model for this Dataset</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetDatasetId(selectedDataset.id);
                      setActiveTab('training');
                    }}
                    className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <PlayCircle className="h-3.5 w-3.5 text-blue-400" />
                    <span>Train with this Dataset</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>

                  <div className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified Schema
                  </div>
                </div>
              </div>

              {/* Data Quality & Fingerprint */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-studio-800 bg-studio-950 p-4 space-y-2">
                  <span className="text-[11px] font-semibold uppercase text-slate-400 flex items-center gap-1.5">
                    <Fingerprint className="h-3.5 w-3.5 text-accent-cyan" />
                    Dataset Fingerprint (SHA-256)
                  </span>
                  <div className="font-mono text-[10px] text-slate-300 break-all bg-studio-900 p-2 rounded border border-studio-800">
                    {selectedDataset.fingerprint || 'Standard Benchmark Seed Fingerprint'}
                  </div>
                </div>

                <div className="rounded-xl border border-studio-800 bg-studio-950 p-4 space-y-2">
                  <span className="text-[11px] font-semibold uppercase text-slate-400 flex items-center gap-1.5">
                    <BarChart2 className="h-3.5 w-3.5 text-accent-blue" />
                    Split Partitioning Policy
                  </span>
                  <div className="text-xs text-slate-300 space-y-1">
                    <div>• 70% Train, 15% Validation, 15% Held-Out Test</div>
                    <div>• Zero Leakage: Normalization fit strictly on train split</div>
                  </div>
                </div>
              </div>

              {/* Image Specific Specs Card */}
              {selectedDataset.dataset_type === 'custom_image_zip' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-studio-800 bg-studio-950 p-3">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">Image Resolution</div>
                    <div className="mt-1 text-sm font-bold text-white font-mono">
                      {selectedDataset.input_shape[1]} × {selectedDataset.input_shape[2]} px
                    </div>
                  </div>
                  <div className="rounded-xl border border-studio-800 bg-studio-950 p-3">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">Color Mode</div>
                    <div className="mt-1 text-sm font-bold text-white">
                      {selectedDataset.input_shape[0] === 3 ? 'RGB (3 Channels)' : 'Grayscale (1 Channel)'}
                    </div>
                  </div>
                  <div className="rounded-xl border border-studio-800 bg-studio-950 p-3">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">Class Folders Found</div>
                    <div className="mt-1 text-sm font-bold text-emerald-400">
                      {selectedDataset.num_classes} Distinct Classes
                    </div>
                  </div>
                </div>
              )}

              {/* Schema Details */}
              {selectedDataset.schema_info && (
                <div className="rounded-xl border border-studio-800 bg-studio-950 p-4">
                  <h4 className="text-xs font-semibold text-slate-300 mb-2">Class Distribution & Feature Schema</h4>
                  {selectedDataset.schema_info.class_distribution ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 font-mono text-xs">
                      {Object.entries(selectedDataset.schema_info.class_distribution).map(([cls, count]) => {
                        const classLabel =
                          selectedDataset.schema_info?.classes && selectedDataset.schema_info.classes[Number(cls)]
                            ? selectedDataset.schema_info.classes[Number(cls)]
                            : `Class ${cls}`;
                        return (
                          <div key={cls} className="rounded bg-studio-900 border border-studio-800 p-2 text-center">
                            <div className="text-slate-400 text-[10px] truncate" title={classLabel}>
                              {classLabel}
                            </div>
                            <div className="text-accent-cyan font-bold mt-0.5">{String(count)}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <pre className="text-xs font-mono text-slate-400 overflow-x-auto bg-studio-900 p-3 rounded">
                      {JSON.stringify(selectedDataset.schema_info, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">Select a dataset to inspect schema properties</div>
          )}
        </div>
      </div>

      {/* Image ZIP Upload Modal */}
      {isUploadingZip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleUploadZip}
            className="w-full max-w-lg rounded-2xl border border-studio-700 bg-studio-900 p-6 shadow-2xl"
          >
            <div className="flex items-center gap-2">
              <FolderArchive className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Upload Custom Image Dataset (.ZIP)</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Supports medical X-Rays, histology scans, or photos up to 1GB. Images are automatically resized and normalized.
            </p>

            {/* Folder Structure Guide */}
            <div className="mt-3 rounded-lg border border-studio-800 bg-studio-950 p-3 text-[11px] text-slate-300 font-mono">
              <div className="text-slate-400 font-sans font-medium text-[11px] mb-1 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-blue-400" />
                Folder structure inside your .ZIP archive:
              </div>
              <div className="text-slate-400">
                dataset.zip/<br />
                &nbsp;&nbsp;├── normal/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-slate-500"># Class name extracted from folder</span><br />
                &nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── scan_001.jpg<br />
                &nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;└── scan_002.png<br />
                &nbsp;&nbsp;└── pneumonia/&nbsp;&nbsp;&nbsp;<span className="text-slate-500"># Class name extracted from folder</span><br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── scan_003.jpg<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── scan_004.jpeg
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Dataset Name</label>
                <input
                  type="text"
                  required
                  value={zipName}
                  onChange={(e) => setZipName(e.target.value)}
                  placeholder="e.g. Chest X-Ray Pneumonia vs Normal"
                  className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Color Mode</label>
                  <select
                    value={zipColorMode}
                    onChange={(e) => setZipColorMode(e.target.value as 'grayscale' | 'rgb')}
                    className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="grayscale">Grayscale (1 Channel - X-Ray/CT)</option>
                    <option value="rgb">RGB (3 Channels - Color Photos/Stains)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300">Target Resolution</label>
                  <select
                    value={zipImageSize}
                    onChange={(e) => setZipImageSize(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value={28}>28 × 28 px (Fast training, lightweight)</option>
                    <option value={64}>64 × 64 px (Standard spatial resolution)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">ZIP File (.zip archive)</label>
                <input
                  type="file"
                  required
                  accept=".zip"
                  onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                  className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-400 file:mr-3 file:rounded file:border-0 file:bg-studio-800 file:px-2.5 file:py-1 file:text-xs file:text-slate-200 hover:file:bg-studio-700"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsUploadingZip(false)}
                className="rounded-lg border border-studio-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-studio-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loadingZip}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                {loadingZip ? 'Decoding & Normalizing Images...' : 'Upload & Process Images'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CSV Upload Modal */}
      {isUploadingCsv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleUploadCsv}
            className="w-full max-w-md rounded-2xl border border-studio-700 bg-studio-900 p-6 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white">Upload Tabular CSV Dataset</h3>
            <p className="text-xs text-slate-400 mt-1">Automatic schema inspection, missing-value imputation, and normalization (Supports datasets up to 1GB)</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Dataset Name</label>
                <input
                  type="text"
                  required
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. Customer Churn Tabular"
                  className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Target Column (optional, defaults to last column)</label>
                <input
                  type="text"
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  placeholder="e.g. churn_label or target"
                  className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">CSV File</label>
                <input
                  type="file"
                  required
                  accept=".csv"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-400 file:mr-3 file:rounded file:border-0 file:bg-studio-800 file:px-2.5 file:py-1 file:text-xs file:text-slate-200 hover:file:bg-studio-700"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsUploadingCsv(false)}
                className="rounded-lg border border-studio-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-studio-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loadingCsv}
                className="rounded-lg bg-accent-blue px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {loadingCsv ? 'Uploading & Validating...' : 'Upload & Register'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
