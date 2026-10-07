'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ClipboardList, Search, ArrowRight,
  Clock, CheckCircle2, AlertTriangle, FileText
} from 'lucide-react';
import { cn, formatEquipmentType, priorityBg, statusBg, formatStatus, formatDate, timeAgo } from '@/lib/utils';

export default function IssuesListPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/issues')
      .then(res => res.json())
      .then(res => {
        if (res.success) setIssues(res.data.items);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) {
    return <div className="animate-pulse p-4">Loading issues...</div>;
  }

  const activeIssues = issues.filter(i => i.status !== 'CLOSED' && i.status !== 'RESOLVED').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="text-sm font-semibold tracking-wider text-orange-600 mb-1 uppercase">Triage Center</div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Issue Management</h1>
          <p className="text-slate-500 mt-1 max-w-2xl">Track, analyze, and resolve equipment issues with AI-assisted diagnostics.</p>
        </div>
        <Link 
          href="/issues/report"
          className="inline-flex items-center justify-center px-4 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 shadow-sm transition-colors"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Report Issue
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search issues, equipment..." 
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <select className="border border-slate-200 rounded-lg text-sm px-3 py-2 bg-white">
            <option>All Priorities</option>
            <option>CRITICAL</option>
            <option>HIGH</option>
            <option>MEDIUM</option>
            <option>LOW</option>
          </select>
          <select className="border border-slate-200 rounded-lg text-sm px-3 py-2 bg-white">
            <option>All Statuses</option>
            <option>OPEN</option>
            <option>UNDER_INVESTIGATION</option>
            <option>PENDING_APPROVAL</option>
            <option>RESOLVED</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Issue Details</th>
                <th className="px-6 py-4 font-semibold">Equipment</th>
                <th className="px-6 py-4 font-semibold">Priority</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">AI Analysis</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {issues.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 mb-0.5 line-clamp-1">{issue.title}</div>
                    <div className="text-xs text-slate-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> Reported {timeAgo(issue.createdAt)} by {issue.assignedUser?.name || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/equipment/${issue.equipment.equipmentId}`} className="font-medium text-orange-600 hover:text-orange-700">
                      {issue.equipment.equipmentId}
                    </Link>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {formatEquipmentType(issue.equipment.type)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border inline-block', priorityBg(issue.priority))}>
                      {issue.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium border inline-block', statusBg(issue.status))}>
                      {formatStatus(issue.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {issue._count.aiAnalyses > 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                        <FileText className="w-3 h-3 mr-1" /> Completed
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/issues/${issue.id}/analysis`}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 hover:text-orange-600 transition-colors"
                    >
                      View Analysis
                    </Link>
                  </td>
                </tr>
              ))}
              {issues.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No issues found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
