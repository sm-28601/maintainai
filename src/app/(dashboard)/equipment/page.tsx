'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Wrench, 
  Search,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn, formatEquipmentType, statusBg, formatStatus, formatDate } from '@/lib/utils';

export default function EquipmentListPage() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/equipment')
      .then(res => res.json())
      .then(res => {
        if (res.success) setEquipment(res.data.items);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) {
    return <div className="animate-pulse p-4">Loading equipment...</div>;
  }

  const stats = {
    total: equipment.length,
    operational: equipment.filter(e => e.status === 'OPERATIONAL').length,
    actionRequired: equipment.filter(e => e.status === 'ACTION_REQUIRED' || e.status === 'UNDER_INVESTIGATION').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="text-sm font-semibold tracking-wider text-orange-600 mb-1 uppercase">Asset Inventory</div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Equipment Management</h1>
          <p className="text-slate-500 mt-1 max-w-2xl">Monitor, triage, and manage registered industrial equipment across all operational facilities with real-time AI insights.</p>
        </div>
        <button className="inline-flex items-center justify-center px-4 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 shadow-sm transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Add Equipment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Total Assets</p>
            <div className="flex items-baseline">
              <h3 className="text-3xl font-bold text-slate-900">{stats.total}</h3>
            </div>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-lg"><Wrench className="w-6 h-6" /></div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Operational</p>
            <div className="flex items-baseline">
              <h3 className="text-3xl font-bold text-slate-900">{stats.operational}</h3>
              <span className="ml-2 text-sm font-medium text-emerald-600">{Math.round((stats.operational/stats.total)*100)}% healthy</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg"><CheckCircle2 className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Action Required</p>
            <div className="flex items-baseline">
              <h3 className="text-3xl font-bold text-slate-900">{stats.actionRequired}</h3>
              <span className="ml-2 text-sm font-medium text-red-600">Needs attention</span>
            </div>
          </div>
          <div className="p-3 bg-red-100 text-red-600 rounded-lg"><AlertCircle className="w-6 h-6" /></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search equipment ID, type, model..." 
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <select className="border border-slate-200 rounded-lg text-sm px-3 py-2 bg-white hidden sm:block">
            <option>All Types</option>
            <option>PUMP</option>
            <option>COMPRESSOR</option>
          </select>
          <select className="border border-slate-200 rounded-lg text-sm px-3 py-2 bg-white hidden sm:block">
            <option>All Statuses</option>
            <option>OPERATIONAL</option>
            <option>UNDER_INVESTIGATION</option>
          </select>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Equipment ID</th>
              <th className="px-6 py-4 font-semibold">Type</th>
              <th className="px-6 py-4 font-semibold">Model / Location</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Open Issues</th>
              <th className="px-6 py-4 font-semibold">Last Inspected</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {equipment.map((eq: any) => (
              <tr key={eq.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <Link href={`/equipment/${eq.id}`} className="font-semibold text-orange-600 hover:text-orange-700">
                    {eq.equipmentId}
                  </Link>
                </td>
                <td className="px-6 py-4 text-slate-700">
                  {formatEquipmentType(eq.type)}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{eq.model}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{eq.location}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn('px-3 py-1 rounded-full text-xs font-medium border flex w-fit items-center', statusBg(eq.status))}>
                    <span className={cn("w-1.5 h-1.5 rounded-full mr-2", eq.status === 'OPERATIONAL' ? 'bg-green-600' : eq.status === 'UNDER_INVESTIGATION' ? 'bg-orange-600' : 'bg-red-600')} />
                    {formatStatus(eq.status)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {eq.issues.length > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                      {eq.issues.length} Open {eq.issues.length === 1 ? 'Issue' : 'Issues'}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs font-medium">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {eq.lastMaintenanceAt ? formatDate(eq.lastMaintenanceAt) : 'No record'}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    href={`/equipment/${eq.id}`}
                    className="inline-flex items-center text-sm font-medium text-slate-400 group-hover:text-orange-600 transition-colors"
                  >
                    View <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
