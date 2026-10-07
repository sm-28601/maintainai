'use client';

import { useState } from 'react';
import { Settings, Shield, Bell, Database, Save, Loader2, Link as LinkIcon, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('ai');
  
  const [config, setConfig] = useState({
    aiProvider: 'gemini',
    apiKey: '••••••••••••••••••••••••••••••',
    confidenceThreshold: '85',
    maxRetrievalChunks: '5',
    autoApproveRules: false,
    emailNotifications: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    
    // Mock save
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  const handleExport = () => {
    alert('This would trigger a download of all system logs and data dumps in a real implementation.');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-sm font-semibold tracking-wider text-orange-600 mb-1 uppercase">System Configuration</div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1 max-w-2xl">Manage AI preferences, integrations, and global system thresholds.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Nav */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
          <nav className="flex flex-col text-sm font-medium">
            <button 
              onClick={() => setActiveTab('ai')}
              className={cn("flex items-center px-4 py-3 border-l-4 transition-colors", activeTab === 'ai' ? "bg-orange-50 text-orange-700 border-orange-500" : "text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-300")}
            >
              <Settings className="w-4 h-4 mr-3" /> AI & Models
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={cn("flex items-center px-4 py-3 border-l-4 transition-colors", activeTab === 'security' ? "bg-orange-50 text-orange-700 border-orange-500" : "text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-300")}
            >
              <Shield className="w-4 h-4 mr-3" /> Security & Access
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={cn("flex items-center px-4 py-3 border-l-4 transition-colors", activeTab === 'notifications' ? "bg-orange-50 text-orange-700 border-orange-500" : "text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-300")}
            >
              <Bell className="w-4 h-4 mr-3" /> Notifications
            </button>
            <button 
              onClick={() => setActiveTab('data')}
              className={cn("flex items-center px-4 py-3 border-l-4 transition-colors", activeTab === 'data' ? "bg-orange-50 text-orange-700 border-orange-500" : "text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-300")}
            >
              <Database className="w-4 h-4 mr-3" /> Data Management
            </button>
            <button 
              onClick={() => setActiveTab('integrations')}
              className={cn("flex items-center px-4 py-3 border-l-4 transition-colors", activeTab === 'integrations' ? "bg-orange-50 text-orange-700 border-orange-500" : "text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-300")}
            >
              <LinkIcon className="w-4 h-4 mr-3" /> Integrations
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="md:col-span-3 space-y-6">
          {activeTab === 'ai' && (
            <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">AI Configuration</h2>
                <p className="text-sm text-slate-500">Configure the large language model and generation parameters.</p>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">AI Provider</label>
                  <select 
                    value={config.aiProvider}
                    onChange={e => setConfig({...config, aiProvider: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 max-w-md"
                  >
                    <option value="gemini">Google Gemini (Recommended)</option>
                    <option value="openai">OpenAI GPT-4</option>
                    <option value="anthropic">Anthropic Claude</option>
                    <option value="mock">Local Mock (Testing Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                  <input 
                    type="password" 
                    value={config.apiKey}
                    onChange={e => setConfig({...config, apiKey: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 max-w-md font-mono"
                  />
                  <p className="text-xs text-slate-500 mt-1">Key is encrypted at rest. Modifying requires admin privileges.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">RAG Context Chunks</label>
                    <input 
                      type="number" 
                      value={config.maxRetrievalChunks}
                      onChange={e => setConfig({...config, maxRetrievalChunks: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">Number of manual sections to inject.</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Confidence (%)</label>
                    <input 
                      type="number" 
                      value={config.confidenceThreshold}
                      onChange={e => setConfig({...config, confidenceThreshold: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">Threshold for marking findings 'High Confidence'.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                <div>
                  {success && (
                    <span className="text-emerald-600 text-sm font-medium flex items-center">
                      Settings saved successfully
                    </span>
                  )}
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 shadow-sm transition-all disabled:opacity-70"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 text-center">
              <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900">Security & Access</h2>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">Manage users, roles, and SSO integration (Coming Soon).</p>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 text-center">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900">Notification Preferences</h2>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">Configure email and push notification rules (Coming Soon).</p>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-red-100 bg-red-50">
                <h2 className="text-lg font-semibold text-red-900">Data Management</h2>
              </div>
              <div className="p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-slate-900">Export System Logs</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">Download full audit logs and historical analysis data for compliance purposes.</p>
                </div>
                <button 
                  onClick={handleExport}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center transition-colors"
                >
                  <Download className="w-4 h-4 mr-2 text-slate-500" /> Export CSV
                </button>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 text-center">
              <LinkIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900">Integrations</h2>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">Connect to ERP or external CMMS (Coming Soon).</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
