'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ClipboardList, CheckCircle2, XCircle, 
  Clock, AlertTriangle, FileText, ChevronRight, Edit3, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { cn, formatEquipmentType, priorityBg, statusBg, formatStatus, formatDate, timeAgo } from '@/lib/utils';
import type { IssuePriority } from '@/types';

export default function WorkOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [wo, setWo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  
  // Edit state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('MEDIUM');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetch(`/api/work-orders/${id}`)
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setWo(res.data);
          setTitle(res.data.title);
          setDescription(res.data.description);
          setPriority(res.data.priority);
          setNotes(res.data.notes || '');
        }
        setLoading(false);
      })
      .catch(console.error);
  }, [id]);

  const handleApprove = async () => {
    if (!confirm('Approve this work order? It will be marked as approved by you.')) return;
    
    try {
      const res = await fetch(`/api/work-orders/${wo.id}/approve`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setWo(data.data);
      } else alert('Failed to approve');
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Reason for rejection:');
    if (reason === null) return;
    
    try {
      const res = await fetch(`/api/work-orders/${wo.id}/reject`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        const data = await res.json();
        setWo(data.data);
      } else alert('Failed to reject');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/work-orders/${wo.id}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, priority, notes })
      });
      if (res.ok) {
        setEditing(false);
        const updated = await res.json();
        setWo(updated.data);
      }
      else alert('Failed to save');
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 animate-pulse">Loading work order...</div>;
  if (!wo) return <div className="p-8 text-red-500">Work order not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/work-orders" className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Work Orders
      </Link>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl font-bold tracking-tight text-slate-900">{wo.woId}</span>
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border', priorityBg(wo.priority))}>
              {wo.priority} Priority
            </span>
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium border', statusBg(wo.status))}>
              {formatStatus(wo.status)}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{wo.title}</h1>
        </div>
        
        {wo.status === 'DRAFT' || wo.status === 'EDITED' ? (
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Changes</button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center">
                  <Edit3 className="w-4 h-4 mr-2" /> Edit
                </button>
                <button onClick={handleReject} className="px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-200 flex items-center">
                  <XCircle className="w-4 h-4 mr-2" /> Reject
                </button>
                <button onClick={handleApprove} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Approve Work Order
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Description</h2>
            {editing ? (
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={6}
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500"
              />
            ) : (
              <div className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">{wo.description}</div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Required Inspection Steps</h2>
            <ul className="space-y-3">
              {wo.inspectionSteps.map((step: string, i: number) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold mt-0.5">
                    {i + 1}
                  </div>
                  <div className="text-sm text-slate-800">{step}</div>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Possible AI Identified Causes</h2>
            <div className="text-xs text-slate-500 mb-4 bg-orange-50 p-3 rounded border border-orange-100 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
              <span>These causes were generated by AI and remain unconfirmed. Technician verification is strictly required.</span>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
              {wo.possibleCauses.map((cause: string, i: number) => (
                <li key={i}>{cause}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800">
              Details
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Equipment</div>
                <Link href={`/equipment/${wo.equipment.id}`} className="font-medium text-orange-600 hover:underline flex items-center">
                  {wo.equipment.equipmentId} <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
                <div className="text-sm text-slate-600">{formatEquipmentType(wo.equipment.type)} - {wo.equipment.model}</div>
              </div>
              
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Associated Issue</div>
                <Link href={`/issues/${wo.issue.id}/analysis`} className="text-sm text-blue-600 hover:underline line-clamp-2">
                  {wo.issue.title}
                </Link>
              </div>
              
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Generated On</div>
                <div className="text-sm text-slate-800">{formatDateTime(wo.createdAt)}</div>
              </div>

              {wo.approvedBy && (
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Approved By</div>
                  <div className="text-sm text-slate-800 flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1.5" />
                    {wo.approvedBy.name} on {formatDate(wo.approvedAt)}
                  </div>
                </div>
              )}
              
              {wo.rejectionReason && (
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Rejection Reason</div>
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">
                    {wo.rejectionReason}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString();
}
