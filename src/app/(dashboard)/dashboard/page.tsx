'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Activity, 
  ClipboardList, 
  Search,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Wrench
} from 'lucide-react';
import { cn, timeAgo, priorityBg, priorityColor, statusBg, formatStatus } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { DashboardStats, IssuePriority } from '@/types';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(res => {
        if (res.success) setData(res.data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-xl border border-slate-200"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white rounded-xl border border-slate-200"></div>
          <div className="h-96 bg-white rounded-xl border border-slate-200"></div>
        </div>
      </div>
    );
  }

  const { stats, recentIssues, timeline } = data;

  const priorityData = [
    { name: 'Critical', value: stats.criticalIssues, color: '#dc2626' },
    { name: 'High', value: stats.highPriority, color: '#ea580c' },
    { name: 'Medium', value: stats.openIssues - stats.criticalIssues - stats.highPriority, color: '#ca8a04' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Equipment maintenance overview and active triage intelligence.</p>
        </div>
        <Link 
          href="/issues/report" 
          className="inline-flex items-center justify-center px-4 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Report Equipment Issue
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Critical Issues" 
          value={stats.criticalIssues} 
          icon={AlertTriangle}
          trend="+1 today"
          trendUp={true}
          colorClass="text-red-600 bg-red-100"
        />
        <StatCard 
          title="High Priority" 
          value={stats.highPriority} 
          icon={Activity}
          trend="Unchanged"
          trendUp={false}
          colorClass="text-orange-600 bg-orange-100"
        />
        <StatCard 
          title="Draft Work Orders" 
          value={stats.draftWorkOrders} 
          icon={ClipboardList}
          trend="Ready for review"
          trendUp={true}
          colorClass="text-blue-600 bg-blue-100"
        />
        <StatCard 
          title="Under Investigation" 
          value={stats.underInvestigation} 
          icon={Search}
          trend="AI analysis active"
          trendUp={true}
          colorClass="text-purple-600 bg-purple-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Issues Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-semibold text-slate-900">Active Equipment Issues</h2>
            <Link href="/issues" className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Equipment</th>
                  <th className="px-6 py-4 font-semibold">Issue</th>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentIssues.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No active issues reported.
                    </td>
                  </tr>
                ) : recentIssues.map((issue: any) => (
                  <tr key={issue.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 flex items-center">
                        <Wrench className="w-4 h-4 text-slate-400 mr-2" />
                        {issue.equipment.equipmentId}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{issue.equipment.type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 line-clamp-1">{issue.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center">
                        <Clock className="w-3 h-3 mr-1" /> {timeAgo(issue.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border', priorityBg(issue.priority))}>
                        {issue.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium border', statusBg(issue.status))}>
                        {formatStatus(issue.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority Chart & Timeline */}
        <div className="space-y-6">
          {/* Priority Distribution */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Priority Distribution</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={70} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}} 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[350px]">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h2 className="text-lg font-semibold text-slate-900">Activity Timeline</h2>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <div className="relative pl-3 space-y-6">
                {timeline.map((log: any) => (
                  <div key={log.id} className="relative timeline-item pb-1">
                    <div className="absolute -left-[17px] top-1 w-[9px] h-[9px] rounded-full bg-orange-500 border-2 border-white shadow-sm z-10" />
                    <div>
                      <div className="text-xs font-semibold text-slate-500 mb-0.5 uppercase tracking-wider">
                        {timeAgo(log.timestamp)}
                      </div>
                      <div className="text-sm font-medium text-slate-800">
                        {formatActionName(log.action)}
                      </div>
                      {log.details && (
                        <div className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                          {formatAuditDetails(log.details)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, trendUp, colorClass }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">{value}</h3>
        </div>
        <div className={cn('p-3 rounded-xl', colorClass)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        {trendUp ? (
          <TrendingUp className="w-4 h-4 text-emerald-500 mr-1.5" />
        ) : (
          <TrendingDown className="w-4 h-4 text-slate-400 mr-1.5" />
        )}
        <span className={trendUp ? 'text-emerald-600 font-medium' : 'text-slate-500'}>{trend}</span>
      </div>
    </div>
  );
}

function formatActionName(action: string): string {
  const map: Record<string, string> = {
    ISSUE_CREATED: 'Issue Reported',
    SENSOR_DATA_SUBMITTED: 'Sensor Data Logged',
    RULE_EVALUATION_PERFORMED: 'Threshold Check Completed',
    MANUAL_RETRIEVED: 'Manual Evidence Retrieved',
    AI_ANALYSIS_GENERATED: 'AI Analysis Completed',
    WORK_ORDER_CREATED: 'Draft Work Order Generated',
    WORK_ORDER_EDITED: 'Work Order Updated',
    WORK_ORDER_APPROVED: 'Work Order Approved',
    FINDING_CONFIRMED: 'Technician Confirmed Finding',
  };
  return map[action] || action.replace(/_/g, ' ');
}

function formatAuditDetails(details: any): string {
  if (details.equipmentId) return `Equipment: ${details.equipmentId}`;
  if (details.woId) return `Work Order: ${details.woId}`;
  if (details.model) return `Model: ${details.model}`;
  if (details.chunkCount) return `Retrieved ${details.chunkCount} document sections`;
  return JSON.stringify(details).replace(/[{}"']/g, '').substring(0, 50);
}
