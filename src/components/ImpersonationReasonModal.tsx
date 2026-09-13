import React, { useState } from 'react';
import { ShieldCheck, X, AlertCircle, Sparkles, KeyRound, Bell } from 'lucide-react';
import { User, Tenant } from '../types/index.js';

interface ImpersonationReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAgent: User | null;
  targetTenant?: Tenant | null;
  onSubmit: (reason: string) => void;
  isLoading?: boolean;
}

const PRESET_REASONS = [
  'Agent reported one-way audio on active SIP extension',
  'Test-dial verification after campaign DID route change',
  'Reproduce queue distribution / hopper lead delivery issue',
  'EspoCRM two-way contact & ticket sync troubleshooting',
  'Agent reported softphone webRTC registration timeout'
];

export const ImpersonationReasonModal: React.FC<ImpersonationReasonModalProps> = ({
  isOpen,
  onClose,
  targetAgent,
  targetTenant,
  onSubmit,
  isLoading = false
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !targetAgent) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError('A defensible support reason of at least 5 characters is mandatory for the audit log.');
      return;
    }
    setError('');
    onSubmit(reason.trim());
  };

  const handleSelectPreset = (preset: string) => {
    setReason(preset);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/80 border border-indigo-400/30 flex items-center justify-center text-indigo-200">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Generate Support Impersonation Session</h3>
              <span className="text-[11px] text-slate-400">
                Target: <strong className="text-white">{targetAgent.name}</strong> ({targetAgent.userId})
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition cursor-pointer p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Security & Zero-Knowledge Hashing Badge */}
          <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-indigo-900">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Zero-Knowledge Authentication Compliance</span>
            </div>
            <p className="text-[11px] text-indigo-800 leading-relaxed">
              Agent passwords are cryptographically hashed and never stored or shown in plaintext. This action generates a <strong>15-minute time-scoped session token</strong> enabling direct softphone test-dialing and diagnosis.
            </p>
          </div>

          {/* Supervisor Notification Transparency Notice */}
          {targetTenant?.notifySupervisorOnImpersonate && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-center gap-2 text-amber-900 text-[11px]">
              <Bell className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Supervisor Transparency Active:</strong> An automated notice will be logged to <em>{targetTenant.name}</em> supervisors.
              </span>
            </div>
          )}

          {/* Preset Quick Select */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Preset Reasons (Audit Trail)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_REASONS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-left text-[11px] px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                    reason === preset
                      ? 'bg-indigo-600 text-white border-indigo-700 font-semibold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Input Field */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700">
              Mandatory Defensible Support Reason *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={e => {
                setReason(e.target.value);
                if (e.target.value.trim().length >= 5) setError('');
              }}
              placeholder="Detail the technical investigation reason (e.g. Agent reported one-way audio, verifying inbound queue SIP channel routing)..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 outline-indigo-500 focus:bg-white transition"
            />
            {error && (
              <div className="flex items-center gap-1 text-rose-600 text-[11px] font-semibold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Target Metadata Summary */}
          <div className="bg-slate-100 rounded-xl p-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600 border border-slate-200">
            <div>
              <span className="text-slate-400 block">Tenant Organization:</span>
              <strong className="text-slate-800">{targetTenant?.name || targetAgent.tenantId}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">SIP Extension:</span>
              <strong className="text-slate-800 font-mono">{targetAgent.mobileExtension || '1002'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Session Limit:</span>
              <strong className="text-emerald-700 font-bold">15 Minutes (Auto-Expires)</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Audit Log ID:</span>
              <span className="text-indigo-600 font-mono font-bold">Auto-assigned</span>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isLoading ? 'Creating Session...' : 'Generate 15-Min Scoped Session'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
