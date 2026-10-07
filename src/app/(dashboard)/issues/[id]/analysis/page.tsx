'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, CheckCircle2, ChevronRight, Clock, Activity, FileText, 
  Settings2, Wrench, ShieldAlert, Cpu, XCircle
} from 'lucide-react';
import { cn, priorityBg, priorityColor, statusBg, formatStatus } from '@/lib/utils';
import type { FindingStatus } from '@/types';

export default function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/issues/${id}`)
      .then(res => res.json())
      .then(res => {
        if (res.success) setIssue(res.data);
        setLoading(false);
      })
      .catch(console.error);
  }, [id]);

  const updateFindingStatus = async (findingId: string, status: FindingStatus) => {
    try {
      const res = await fetch(`/api/issues/${issue.id}/findings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingId, status })
      });
      if (res.ok) {
        // Optimistic update
        setIssue((prev: any) => ({
          ...prev,
          findings: prev.findings.map((f: any) => 
            f.id === findingId ? { ...f, status } : f
          )
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="animate-pulse p-8">Loading analysis...</div>;
  if (!issue) return <div className="p-8 text-red-500">Issue not found</div>;

  const analysis = issue.aiAnalyses[0]; // Get most recent analysis
  const hasAnalysis = !!analysis;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-semibold tracking-wider text-slate-500 uppercase">Issue Triage Report</span>
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border', priorityBg(issue.priority))}>
              {issue.priority} Priority
            </span>
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium border', statusBg(issue.status))}>
              {formatStatus(issue.status)}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{issue.title}</h1>
          <p className="text-slate-500 mt-1 flex items-center">
            <Wrench className="w-4 h-4 mr-1.5" /> 
            {issue.equipment.equipmentId} ({issue.equipment.model}) — Reported {new Date(issue.createdAt).toLocaleString()}
          </p>
        </div>
        
        {issue.workOrders.length > 0 && (
          <Link 
            href={`/work-orders/${issue.workOrders[0].id}`}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            View Draft Work Order
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Analysis Results */}
        <div className="lg:col-span-2 space-y-6">
          
          {hasAnalysis ? (
            <>
              {/* AI Executive Summary */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 to-[#1e3a5f] p-4 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-3">
                    <Cpu className="w-5 h-5 text-orange-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">AI Diagnostic Summary</h2>
                </div>
                <div className="p-6">
                  <p className="text-slate-700 text-lg leading-relaxed">{analysis.summary}</p>
                  
                  <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                        <Activity className="w-4 h-4 mr-2 text-blue-600" /> Key Observations
                      </h3>
                      <ul className="space-y-2">
                        {analysis.observations.map((obs: string, i: number) => (
                          <li key={i} className="text-sm text-slate-600 flex items-start">
                            <span className="text-blue-500 mr-2 mt-1">•</span>
                            {obs}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                        <ShieldAlert className="w-4 h-4 mr-2 text-orange-600" /> Priority Reasoning
                      </h3>
                      <p className="text-sm text-slate-600 bg-orange-50 p-3 rounded-lg border border-orange-100">
                        {analysis.priorityReason}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Evidence (Knowledge Base) */}
              {analysis.evidence && analysis.evidence.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-slate-400" /> Supporting Evidence from Manuals
                  </h2>
                  <div className="space-y-4">
                    {analysis.evidence.map((ev: any, i: number) => (
                      <div key={i} className="evidence-card evidence-manual bg-slate-50 rounded-r-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-sm text-slate-900">{ev.title}</h4>
                          <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                            Page {ev.pageNumber || 'N/A'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 italic border-l-2 border-slate-300 pl-3 py-1 my-2">
                          "{ev.excerpt}"
                        </p>
                        <div className="text-xs text-blue-600 font-medium">Source: {ev.documentId || 'Equipment Manual'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technician Verification of Causes */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-t-4 border-t-orange-500">
                <div className="p-6 border-b border-slate-100 bg-orange-50/30">
                  <h2 className="text-lg font-semibold text-slate-900">Possible Causes & Verification</h2>
                  <p className="text-sm text-slate-600 mt-1">AI has identified these potential causes based on symptoms and sensor data. <strong>Technician verification is required.</strong></p>
                </div>
                
                <div className="divide-y divide-slate-100">
                  {issue.findings.map((finding: any) => (
                    <div key={finding.id} className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center hover:bg-slate-50 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 text-base">{finding.description}</div>
                        {finding.status !== 'POSSIBLE' && (
                          <div className="text-xs mt-1.5 flex items-center">
                            <span className="text-slate-500">
                              {finding.status === 'CONFIRMED' ? 'Confirmed by' : 'Rejected by'} {finding.confirmedBy?.name || 'Technician'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {finding.status === 'POSSIBLE' ? (
                          <>
                            <button 
                              onClick={() => updateFindingStatus(finding.id, 'REJECTED')}
                              className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                            >
                              Reject
                            </button>
                            <button 
                              onClick={() => updateFindingStatus(finding.id, 'CONFIRMED')}
                              className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors flex items-center"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Confirm
                            </button>
                          </>
                        ) : (
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold border flex items-center",
                            finding.status === 'CONFIRMED' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
                          )}>
                            {finding.status === 'CONFIRMED' ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <XCircle className="w-3.5 h-3.5 mr-1" />}
                            {finding.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
              <Settings2 className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-spin-slow" />
              <h2 className="text-xl font-semibold text-slate-800">AI Analysis Pending</h2>
              <p className="text-slate-500 mt-2">The system is currently analyzing the issue data against manuals and rules...</p>
            </div>
          )}
        </div>

        {/* Right Column: Original Data & Rule Results */}
        <div className="space-y-6">
          
          {/* Rule Engine Results (Deterministic) */}
          {issue.thresholdResults && issue.thresholdResults.length > 0 && (
            <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-red-50 border-b border-red-100 flex items-center justify-between">
                <h3 className="font-semibold text-red-900 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" /> Threshold Alerts
                </h3>
                <span className="text-xs font-bold bg-red-200 text-red-800 px-2 py-0.5 rounded">Deterministic</span>
              </div>
              <div className="p-4 space-y-4">
                {issue.thresholdResults.map((tr: any) => (
                  <div key={tr.id} className="text-sm">
                    <div className="flex justify-between font-medium text-slate-900 mb-1">
                      <span>{tr.sensorName}</span>
                      <span className={tr.severity === 'CRITICAL' ? 'text-red-600' : 'text-orange-600'}>
                        {tr.value} {tr.unit}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Rule: Must be {tr.operator} {tr.threshold} {tr.unit}
                    </div>
                    <div className="text-xs text-red-600 mt-1 bg-red-50 p-1.5 rounded">
                      {tr.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reported Description */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 mb-3 border-b pb-2">Original Description</h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {issue.description}
            </p>
          </div>

          {/* Sensor Data */}
          {issue.sensorReadings && issue.sensorReadings.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900 mb-3 border-b pb-2">Sensor Data Logged</h3>
              <div className="space-y-2">
                {issue.sensorReadings.map((sr: any) => (
                  <div key={sr.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded">
                    <span className="text-slate-600 font-medium">{sr.sensorName}</span>
                    <span className="font-mono text-slate-900">{sr.value} <span className="text-slate-400">{sr.unit}</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
