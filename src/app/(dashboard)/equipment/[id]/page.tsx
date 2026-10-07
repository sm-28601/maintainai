'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Wrench, AlertTriangle, 
  ClipboardList, Activity, Clock, CheckCircle2, ChevronRight
} from 'lucide-react';
import { cn, formatEquipmentType, statusBg, formatStatus, formatDate } from '@/lib/utils';

export default function EquipmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [equipment, setEquipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/equipment/${id}`)
      .then(res => res.json())
      .then(res => {
        if (res.success) setEquipment(res.data);
        setLoading(false);
      })
      .catch(console.error);
  }, [id]);

  if (loading) {
    return <div className="animate-pulse p-8">Loading equipment details...</div>;
  }

  if (!equipment) {
    return <div className="p-8 text-red-500">Equipment not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link href="/equipment" className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Equipment
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl font-bold tracking-tight text-slate-900">{equipment.equipmentId}</span>
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border', statusBg(equipment.status))}>
              {formatStatus(equipment.status)}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-100 text-slate-700 border-slate-200">
              {formatEquipmentType(equipment.type)}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{equipment.model}</h1>
          <p className="text-slate-500 mt-1">{equipment.description || 'No description provided.'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-slate-400" /> Active Issues
            </h2>
            
            {equipment.issues?.length > 0 ? (
              <div className="space-y-3">
                {equipment.issues.map((issue: any) => (
                  <Link 
                    key={issue.id} 
                    href={`/issues/${issue.id}/analysis`}
                    className="block p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-orange-300 transition-colors group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">{issue.title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-1 mt-1">{issue.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-orange-500" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No issues reported for this equipment.</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center">
              <ClipboardList className="w-5 h-5 mr-2 text-slate-400" /> Recent Work Orders
            </h2>
            
            {equipment.workOrders?.length > 0 ? (
              <div className="space-y-3">
                {equipment.workOrders.slice(0, 5).map((wo: any) => (
                  <Link 
                    key={wo.id} 
                    href={`/work-orders/${wo.id}`}
                    className="block p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-orange-300 transition-colors group"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono">{wo.woId}</span>
                          <span className={cn('px-2 py-0.5 rounded text-[10px] font-semibold uppercase', statusBg(wo.status))}>
                            {formatStatus(wo.status)}
                          </span>
                        </div>
                        <h3 className="font-medium text-slate-800 text-sm mt-1 group-hover:text-orange-600">{wo.title}</h3>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-orange-500" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No recent work orders found.</p>
            )}
          </div>
          
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800">
              Details
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Location</div>
                <div className="text-sm text-slate-800">{equipment.location || 'Unknown'}</div>
              </div>
              
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Manufacturer</div>
                <div className="text-sm text-slate-800">{equipment.manufacturer || 'Unknown'}</div>
              </div>
              
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Installation Date</div>
                <div className="text-sm text-slate-800">
                  {equipment.installedAt ? formatDate(equipment.installedAt) : 'Unknown'}
                </div>
              </div>
              
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Last Maintenance</div>
                <div className="text-sm text-slate-800 flex items-center">
                  <Clock className="w-4 h-4 mr-1.5 text-slate-400" />
                  {equipment.lastMaintenanceAt ? formatDate(equipment.lastMaintenanceAt) : 'Never'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
