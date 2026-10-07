import { Scale } from 'lucide-react';

export default function RulesPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-sm font-semibold tracking-wider text-orange-600 mb-1 uppercase">Decision Engine</div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Deterministic Rules</h1>
          <p className="text-slate-500 mt-1 max-w-2xl">Manage threshold rules for automated sensor data evaluation.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-12 text-center">
        <Scale className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-slate-900">Rule Management (Coming Soon)</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          The rule engine is currently hardcoded for the demo. In a future update, you will be able to add, edit, and disable threshold rules here.
        </p>
      </div>
    </div>
  );
}
