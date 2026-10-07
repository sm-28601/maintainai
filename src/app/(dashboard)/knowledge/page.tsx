'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Upload, FileText, 
  Trash2, AlertTriangle, CheckCircle2, Clock
} from 'lucide-react';
import { formatEquipmentType, formatDate } from '@/lib/utils';
import type { EquipmentType } from '@/types';

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [equipmentType, setEquipmentType] = useState<EquipmentType | ''>('');
  const [docType, setDocType] = useState('MANUAL');

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/knowledge');
      const data = await res.json();
      if (data.success) setDocuments(data.data);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name || !docType) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('equipmentType', equipmentType);
    formData.append('docType', docType);

    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setUploadModalOpen(false);
        setFile(null);
        setName('');
        setEquipmentType('');
        await fetchDocuments();
      } else {
        alert('Failed to upload document');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const res = await fetch(`/api/knowledge/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchDocuments();
      } else {
        alert('Failed to delete document');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred while deleting the document');
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="text-sm font-semibold tracking-wider text-orange-600 mb-1 uppercase">AI Grounding Data</div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Knowledge Base</h1>
          <p className="text-slate-500 mt-1 max-w-2xl">Manage OEM manuals, maintenance procedures, and historical data used by the AI assistant for diagnostics.</p>
        </div>
        <button 
          onClick={() => setUploadModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 shadow-sm transition-colors"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10"><BookOpen className="w-32 h-32" /></div>
          <div className="relative z-10">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-400" />
              Retrieval Augmented Generation
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Documents uploaded here are automatically chunked and vectorized. The AI Assistant retrieves highly relevant sections to ensure all recommendations are grounded in official documentation and verified procedures.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Documents</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-5 h-5" /></div>
          </div>
          <div className="text-4xl font-bold text-slate-900">{documents.length}</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Vectorized Chunks</h3>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Search className="w-5 h-5" /></div>
          </div>
          <div className="text-4xl font-bold text-slate-900">
            {documents.reduce((acc, doc) => acc + (doc._count?.chunks || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search documents by name, type, or equipment..." 
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <select className="border border-slate-200 rounded-lg text-sm px-3 py-2 bg-white">
            <option>All Document Types</option>
            <option>MANUAL</option>
            <option>MAINTENANCE_LOG</option>
            <option>SCHEMATIC</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Document Name</th>
                <th className="px-6 py-4 font-semibold">Type / Equipment</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Details</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 animate-pulse">Loading documents...</td></tr>
              ) : documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-slate-400" />
                      {doc.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 ml-6">{doc.filename} ({(doc.fileSize / 1024 / 1024).toFixed(2)} MB)</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{doc.docType.replace('_', ' ')}</div>
                    <div className="text-xs text-slate-500">{doc.equipmentType ? formatEquipmentType(doc.equipmentType) : 'Global Document'}</div>
                  </td>
                  <td className="px-6 py-4">
                    {doc.status === 'INDEXED' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Indexed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                        <Clock className="w-3 h-3 mr-1" /> {doc.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-slate-600 font-medium">{doc._count.chunks} sections chunked</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Uploaded {formatDate(doc.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(doc.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-2" 
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && documents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No documents uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Upload Knowledge Document</h2>
              <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            
            <form onSubmit={handleUpload} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Document File (PDF, TXT)</label>
                <input 
                  type="file" 
                  accept=".pdf,.txt,.md"
                  required
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setFile(f);
                      if (!name) setName(f.name.replace(/\.[^/.]+$/, ""));
                    }
                  }}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. PX-200 Maintenance Manual"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Document Type</label>
                  <select 
                    value={docType}
                    onChange={e => setDocType(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="MANUAL">OEM Manual</option>
                    <option value="MAINTENANCE_LOG">Maintenance Log</option>
                    <option value="SCHEMATIC">Schematic/Diagram</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target Equipment</label>
                  <select 
                    value={equipmentType}
                    onChange={e => setEquipmentType(e.target.value as EquipmentType)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">General (All Types)</option>
                    <option value="PUMP">Pump</option>
                    <option value="COMPRESSOR">Compressor</option>
                    <option value="CNC_MACHINE">CNC Machine</option>
                    <option value="GENERATOR">Generator</option>
                    <option value="TURBINE">Turbine</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-3 mt-2">
                <InfoIcon className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  The document will be processed immediately. Once status is "Indexed", the AI assistant will be able to reference its contents for issue analysis.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={uploading || !file}
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors flex items-center"
                >
                  {uploading ? 'Processing...' : 'Upload & Index'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  );
}
