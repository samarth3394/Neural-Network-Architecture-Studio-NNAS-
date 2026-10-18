import React, { useEffect, useState } from 'react';
import { ShieldCheck, Calendar, RefreshCw } from 'lucide-react';
import { api } from '../api/client';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Security & Regulatory Audit Trail</h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable system logs tracking architecture edits, training dispatches, dataset uploads, and deployment rollbacks
          </p>
        </div>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-studio-700 bg-studio-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-studio-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Audit Trail
        </button>
      </div>

      <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-studio-800 text-slate-400">
                <th className="py-2.5 pr-4">Timestamp (UTC)</th>
                <th className="py-2.5 pr-4">Action</th>
                <th className="py-2.5 pr-4">Resource Type</th>
                <th className="py-2.5 pr-4">Resource ID</th>
                <th className="py-2.5 pr-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-studio-800 text-slate-200">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-studio-850">
                  <td className="py-2.5 pr-4 text-slate-400 whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-4 font-bold text-accent-blue font-sans">{l.action}</td>
                  <td className="py-2.5 pr-4 text-slate-300">{l.resource_type}</td>
                  <td className="py-2.5 pr-4 text-slate-400 truncate max-w-[140px]">{l.resource_id || '-'}</td>
                  <td className="py-2.5 pr-4 text-slate-400 truncate max-w-[200px]">
                    {JSON.stringify(l.details)}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No audit records logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
