'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wrench, FileText, Activity, AlertTriangle, 
  Settings2, Plus, Clock, Save, Info, CheckCircle2,
  Thermometer, Activity as Vibration, Gauge, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EquipmentType } from '@/types';

export default function ReportIssuePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Form State
  const [equipmentType, setEquipmentType] = useState<EquipmentType | ''>('');
  const [equipmentId, setEquipmentId] = useState('');
  const [equipmentModel, setEquipmentModel] = useState('');
  const [location, setLocation] = useState('');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [isActive, setIsActive] = useState(true);
  
  const [events, setEvents] = useState([{ description: '', eventDate: new Date().toISOString().split('T')[0] }]);
  const [sensors, setSensors] = useState([{ sensorName: '', value: '', unit: '', timestamp: new Date().toISOString().slice(0, 16) }]);
  
  // Fill from URL params if available
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('equipmentId')) {
      setEquipmentId(params.get('equipmentId')!);
      setEquipmentType(params.get('type') as EquipmentType || 'PUMP');
      setEquipmentModel(params.get('model') || '');
    }
  }, []);

  const handleDemoFill = () => {
    setEquipmentType('PUMP');
    setEquipmentId('PUMP-204');
    setEquipmentModel('PX-200');
    setLocation('Production Floor A');
    setTitle('Abnormal vibration and reduced flow');
    setDescription('The pump is producing unusual vibration and the output flow has decreased compared to normal operation.');
    setEvents([{ description: 'Filter replaced', eventDate: new Date().toISOString().split('T')[0] }]);
    setSensors([
      { sensorName: 'Temperature', value: '85', unit: '°C', timestamp: new Date().toISOString().slice(0, 16) },
      { sensorName: 'Pressure', value: '4.2', unit: 'bar', timestamp: new Date().toISOString().slice(0, 16) },
      { sensorName: 'Vibration', value: '7.8', unit: 'mm/s', timestamp: new Date().toISOString().slice(0, 16) },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        equipmentType,
        equipmentId,
        equipmentModel,
        location,
        title,
        description,
        startedAt: new Date(startedAt).toISOString(),
        isActive,
        operatingEvents: events.filter(ev => ev.description.trim() !== '').map(ev => ({
          ...ev,
          eventDate: new Date(ev.eventDate).toISOString()
        })),
        sensorReadings: sensors.filter(s => s.sensorName.trim() !== '' && s.value !== '').map(s => ({
          sensorName: s.sensorName,
          value: parseFloat(s.value),
          unit: s.unit,
          timestamp: new Date(s.timestamp).toISOString()
        }))
      };

      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Redirect to analysis page
        router.push(`/issues/${data.data.issue.id}/analysis`);
      } else {
        alert(data.error || 'Failed to submit issue');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('Network error occurred');
      setLoading(false);
    }
  };

  const isStep1Valid = equipmentType && equipmentId && equipmentModel;
  const isStep2Valid = title && description && startedAt;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Report Equipment Issue</h1>
          <p className="text-slate-500 mt-1">Submit triage information for AI diagnostic analysis.</p>
        </div>
        <button 
          type="button" 
          onClick={handleDemoFill}
          className="text-sm font-medium text-orange-600 hover:text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          Fill Demo Data
        </button>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10 rounded-full"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-orange-500 -z-10 rounded-full transition-all duration-500" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
          
          {[
            { num: 1, label: 'Equipment', icon: Wrench },
            { num: 2, label: 'Issue Details', icon: AlertTriangle },
            { num: 3, label: 'Data & Events', icon: Activity }
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center gap-2 bg-white px-2">
              <button 
                type="button"
                onClick={() => {
                  if (s.num < step) setStep(s.num);
                  if (s.num === 2 && isStep1Valid) setStep(2);
                  if (s.num === 3 && isStep1Valid && isStep2Valid) setStep(3);
                }}
                disabled={(s.num === 2 && !isStep1Valid) || (s.num === 3 && (!isStep1Valid || !isStep2Valid))}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors border-2",
                  step >= s.num 
                    ? "bg-orange-600 border-orange-600 text-white" 
                    : "bg-white border-slate-200 text-slate-400"
                )}
              >
                {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-4 h-4" />}
              </button>
              <span className={cn("text-xs font-semibold", step >= s.num ? "text-slate-900" : "text-slate-400")}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8">
          
          {/* STEP 1: Equipment */}
          {step === 1 && (
            <div className="space-y-6 animate-slide-in">
              <div className="flex items-center text-slate-800 mb-4 pb-2 border-b border-slate-100">
                <Wrench className="w-5 h-5 mr-2 text-orange-600" />
                <h2 className="text-lg font-semibold">Equipment Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Equipment Type *</label>
                  <select 
                    value={equipmentType} 
                    onChange={e => setEquipmentType(e.target.value as EquipmentType)}
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-sm"
                  >
                    <option value="">Select Type</option>
                    {['PUMP', 'COMPRESSOR', 'CNC_MACHINE', 'GENERATOR', 'TURBINE', 'MOTOR', 'BOILER'].map(t => (
                      <option key={t} value={t}>{t.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Equipment ID *</label>
                  <input 
                    type="text" 
                    value={equipmentId} 
                    onChange={e => setEquipmentId(e.target.value)}
                    required
                    placeholder="e.g. PUMP-204"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Model *</label>
                  <input 
                    type="text" 
                    value={equipmentModel} 
                    onChange={e => setEquipmentModel(e.target.value)}
                    required
                    placeholder="e.g. PX-200"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input 
                    type="text" 
                    value={location} 
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Production Floor A"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Issue Details */}
          {step === 2 && (
            <div className="space-y-6 animate-slide-in">
              <div className="flex items-center text-slate-800 mb-4 pb-2 border-b border-slate-100">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                <h2 className="text-lg font-semibold">Issue Description</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Issue Title *</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    required
                    placeholder="Brief description of the problem"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Detailed Description *</label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)}
                    required
                    rows={4}
                    placeholder="Provide as much detail as possible about the symptoms, conditions, and visible damage."
                    className="w-full border border-slate-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">When did the issue start? *</label>
                    <input 
                      type="datetime-local" 
                      value={startedAt} 
                      onChange={e => setStartedAt(e.target.value)}
                      required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                  </div>
                  
                  <div className="flex items-center h-full pt-6">
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isActive} 
                        onChange={e => setIsActive(e.target.checked)}
                        className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm font-medium text-slate-700">Issue is currently active</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Data & Events */}
          {step === 3 && (
            <div className="space-y-8 animate-slide-in">
              
              {/* Sensor Readings */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center text-slate-800">
                    <Activity className="w-5 h-5 mr-2 text-orange-600" />
                    <h2 className="text-lg font-semibold">Sensor Readings</h2>
                  </div>
                  <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full uppercase tracking-wider">Optional</span>
                </div>
                
                <div className="bg-slate-50 rounded-lg p-1 border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-200">
                        <th className="font-semibold text-left p-3">Sensor Name</th>
                        <th className="font-semibold text-left p-3">Value</th>
                        <th className="font-semibold text-left p-3">Unit</th>
                        <th className="font-semibold text-left p-3">Timestamp</th>
                        <th className="p-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sensors.map((s, i) => (
                        <tr key={i} className="bg-white">
                          <td className="p-2">
                            <input 
                              type="text" 
                              value={s.sensorName} 
                              onChange={e => { const n = [...sensors]; n[i].sensorName = e.target.value; setSensors(n); }}
                              placeholder="e.g. Vibration"
                              className="w-full border border-slate-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-orange-500 text-sm"
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              type="number" step="any"
                              value={s.value} 
                              onChange={e => { const n = [...sensors]; n[i].value = e.target.value; setSensors(n); }}
                              placeholder="0.0"
                              className="w-full border border-slate-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-orange-500 text-sm font-mono"
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              type="text" 
                              value={s.unit} 
                              onChange={e => { const n = [...sensors]; n[i].unit = e.target.value; setSensors(n); }}
                              placeholder="mm/s"
                              className="w-full border border-slate-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-orange-500 text-sm text-slate-500"
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              type="datetime-local" 
                              value={s.timestamp} 
                              onChange={e => { const n = [...sensors]; n[i].timestamp = e.target.value; setSensors(n); }}
                              className="w-full border border-slate-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-orange-500 text-sm"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button 
                              type="button" 
                              onClick={() => { const n = [...sensors]; n.splice(i, 1); setSensors(n); }}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                              &times;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSensors([...sensors, { sensorName: '', value: '', unit: '', timestamp: new Date().toISOString().slice(0, 16) }])}
                  className="mt-3 text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Sensor Reading
                </button>
              </div>

              {/* Operating Events */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center text-slate-800">
                    <Clock className="w-5 h-5 mr-2 text-orange-600" />
                    <h2 className="text-lg font-semibold">Recent Operating Events</h2>
                  </div>
                  <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full uppercase tracking-wider">Optional</span>
                </div>
                
                <div className="space-y-3">
                  {events.map((ev, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="flex-1">
                        <input 
                          type="text" 
                          value={ev.description} 
                          onChange={e => { const n = [...events]; n[i].description = e.target.value; setEvents(n); }}
                          placeholder="e.g. Filter replaced, maintenance performed..."
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div className="w-40 shrink-0">
                        <input 
                          type="date" 
                          value={ev.eventDate} 
                          onChange={e => { const n = [...events]; n[i].eventDate = e.target.value; setEvents(n); }}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => { const n = [...events]; n.splice(i, 1); setEvents(n); }}
                        className="mt-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  type="button" 
                  onClick={() => setEvents([...events, { description: '', eventDate: new Date().toISOString().split('T')[0] }])}
                  className="mt-3 text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Event
                </button>
              </div>

            </div>
          )}

        </div>
        
        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          {step > 1 ? (
            <button 
              type="button" 
              onClick={() => setStep(step - 1)}
              className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
          ) : <div></div>}
          
          {step < 3 ? (
            <button 
              type="button" 
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
              className="px-5 py-2.5 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next Step
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={loading}
              className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Analyzing Issue...
                </>
              ) : (
                <>
                  <Settings2 className="w-4 h-4 mr-2" />
                  Submit for AI Analysis
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
