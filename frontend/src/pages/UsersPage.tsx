import React, { useState } from 'react';
import { Users, Shield, UserPlus, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export const UsersPage: React.FC = () => {
  const currentUser = useAppStore((s) => s.currentUser);

  const [members, setMembers] = useState([
    {
      id: 'usr_1',
      name: 'Lead ML Architect',
      email: 'admin@nnas.local',
      role: 'admin',
      status: 'Active',
    },
    {
      id: 'usr_2',
      name: 'Senior Deep Learning Engineer',
      email: 'mle@nnas.local',
      role: 'ml_engineer',
      status: 'Active',
    },
    {
      id: 'usr_3',
      name: 'AI Research Scientist',
      email: 'research@nnas.local',
      role: 'researcher',
      status: 'Active',
    },
  ]);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">User Access & Role-Based Governance (RBAC)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage workspace members, role permissions, and access privileges across models and datasets
          </p>
        </div>
      </div>

      {/* Role Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="rounded-xl border border-studio-800 bg-studio-900/60 p-3.5">
          <div className="font-bold text-white flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-accent-blue" />
            Admin / Owner
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Full control over workspaces, deployments, quotas, and stage approval gates.</p>
        </div>

        <div className="rounded-xl border border-studio-800 bg-studio-900/60 p-3.5">
          <div className="font-bold text-white flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-accent-cyan" />
            ML Engineer
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Create architectures, run training jobs, evaluate models, and register versions.</p>
        </div>

        <div className="rounded-xl border border-studio-800 bg-studio-900/60 p-3.5">
          <div className="font-bold text-white flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-accent-purple" />
            Researcher
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Run architecture search, view explainability saliency maps, and track experiments.</p>
        </div>

        <div className="rounded-xl border border-studio-800 bg-studio-900/60 p-3.5">
          <div className="font-bold text-white flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-slate-400" />
            Viewer
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Read-only access to architecture canvas, metrics charts, and deployed endpoints.</p>
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Workspace Members ({members.length})</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-studio-800 text-slate-400 font-mono">
                <th className="py-2.5 pr-4">User</th>
                <th className="py-2.5 pr-4">Email</th>
                <th className="py-2.5 pr-4">Role</th>
                <th className="py-2.5 pr-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-studio-800 text-slate-200">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-studio-850">
                  <td className="py-3 pr-4 font-semibold text-white">{m.name}</td>
                  <td className="py-3 pr-4 font-mono text-slate-400">{m.email}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded bg-accent-blue/15 px-2 py-0.5 font-mono text-[10px] uppercase text-accent-blue font-bold">
                      {m.role}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {m.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
