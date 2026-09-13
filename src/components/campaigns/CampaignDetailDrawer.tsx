import React from 'react';
import {
  X,
  Radio,
  Eye,
  PhoneIncoming,
  Volume2,
  Sliders,
  Clock,
  Shield,
  Layers,
  Settings,
  Edit2,
  PhoneCall,
  CheckCircle,
  FileText,
  Activity
} from 'lucide-react';
import { Campaign } from '../../types/index.js';

interface CampaignDetailDrawerProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (camp: Campaign) => void;
}

export const CampaignDetailDrawer: React.FC<CampaignDetailDrawerProps> = ({
  campaign,
  isOpen,
  onClose,
  onEdit
}) => {
  if (!isOpen || !campaign) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-100">{campaign.name}</h3>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-semibold border border-emerald-500/30">
                  {campaign.type}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                VICI ID: {campaign.viciCampaignId || 'SYNCED'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(campaign)}
              className="flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-bold transition cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Status</span>
              <span className={`font-bold text-xs ${campaign.active === 'Yes' ? 'text-emerald-600' : 'text-slate-500'}`}>
                {campaign.active === 'Yes' ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Process Target</span>
              <span className="font-bold text-xs text-indigo-700">{campaign.process || 'Leads'}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Wrap Time</span>
              <span className="font-bold text-xs text-slate-800">{campaign.wrapTimeSec || 15}s</span>
            </div>
          </div>

          {/* TYPE-SPECIFIC ARCHITECTURE BREAKDOWN */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                {campaign.type === 'PREDICTIVE' && <Radio className="w-4 h-4 text-sky-600" />}
                {campaign.type === 'PREVIEW' && <Eye className="w-4 h-4 text-indigo-600" />}
                {campaign.type === 'INBOUND' && <PhoneIncoming className="w-4 h-4 text-emerald-600" />}
                {campaign.type === 'IVR' && <Volume2 className="w-4 h-4 text-purple-600" />}
                {campaign.type} Architecture Configuration
              </span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
                Core Engine
              </span>
            </div>

            {campaign.type === 'PREDICTIVE' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Dial Ratio</span>
                  <span className="font-bold text-slate-800">{campaign.dial_ratio || '1.5'}x</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Hopper Buffer Level</span>
                  <span className="font-bold text-slate-800">{campaign.buffer_level || 100}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Max Concurrent Calls</span>
                  <span className="font-bold text-slate-800">{campaign.maxConcurrentCalls || 30} calls</span>
                </div>
                <div>
                  <span className="text-slate-500 block">AMD / Answer Detection</span>
                  <span className="font-bold text-slate-800">{campaign.amdDetection || 'Standard AMD'}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200">
                  <span className="text-slate-500 block">Retry Cadence</span>
                  <span className="font-medium text-slate-700">
                    Max {campaign.retryRules?.maxRetries || 3} retries at {campaign.retryRules?.retryIntervalMin || 30} min intervals
                  </span>
                </div>
              </div>
            )}

            {campaign.type === 'PREVIEW' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Preview Timer</span>
                  <span className="font-bold text-slate-800">{campaign.previewTimeSec || 20} seconds</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Agent Accept / Reject</span>
                  <span className="font-bold text-emerald-700">
                    {campaign.agentAcceptReject ? 'Allowed' : 'Enforced Dial'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Auto Dial on Timeout</span>
                  <span className="font-bold text-slate-800">{campaign.autoDial ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Wrap Time</span>
                  <span className="font-bold text-slate-800">{campaign.wrapTimeSec || 15}s</span>
                </div>
              </div>
            )}

            {campaign.type === 'INBOUND' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Routing Strategy</span>
                  <span className="font-bold text-emerald-700">{campaign.routingType || 'Sticky Agent'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Ring Timeout</span>
                  <span className="font-bold text-slate-800">{campaign.ringTimeoutSec || 25} seconds</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Fallback Routing</span>
                  <span className="font-bold text-slate-800">{campaign.fallbackRouting || 'Voicemail'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Missed Call Handling</span>
                  <span className="font-bold text-indigo-700">{campaign.missedCallHandling || 'Create Ticket'}</span>
                </div>
              </div>
            )}

            {campaign.type === 'IVR' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block">IVR Flow Menu</span>
                    <span className="font-mono font-bold text-slate-800">{campaign.ivrSelection || 'MAIN_IVR'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Menu Timeout</span>
                    <span className="font-bold text-slate-800">{campaign.timeoutSec || 10}s</span>
                  </div>
                </div>

                {campaign.ivrFlow && (
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">GREETING PROMPT</span>
                    <p className="text-slate-700 italic text-[11px]">{campaign.ivrFlow}</p>
                  </div>
                )}

                {campaign.dtmfOptions && campaign.dtmfOptions.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-slate-500 block font-bold">DTMF Keypress Matrix</span>
                    <div className="space-y-1">
                      {campaign.dtmfOptions.map((opt, i) => (
                        <div key={i} className="flex items-center justify-between bg-white px-2.5 py-1 rounded border border-slate-200">
                          <span className="font-bold text-purple-700 font-mono">Key [{opt.key}]</span>
                          <span className="text-slate-700">{opt.label}</span>
                          <span className="text-[10px] text-slate-500 font-mono">→ {opt.destinationType}: {opt.destinationValue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* COMMON SETTINGS BREAKDOWN */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <span className="font-bold text-slate-900 text-xs block border-b border-slate-200 pb-2">
              Common Telephony & Automation Settings
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 block">Outbound DID</span>
                <span className="font-mono font-bold text-slate-800">{campaign.outboundCallerId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">DID Rotate Strategy</span>
                <span className="font-bold text-sky-700">{campaign.didRotateStrategy || 'Direct'}</span>
                {campaign.didNumbers && campaign.didNumbers.length > 1 && (
                  <span className="text-[10px] text-slate-500 block font-mono">
                    Pool: {campaign.didNumbers.length} DIDs configured
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-500 block">Industry</span>
                <span className="font-semibold text-slate-800">{campaign.industry}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Assigned Queue</span>
                <span className="font-semibold text-slate-800">{campaign.queue || 'Default Queue'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Dynamic Script</span>
                <span className="font-semibold text-slate-800">{campaign.scriptName || 'Default Script'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Auto Answer</span>
                <span className={`font-semibold ${campaign.autoAnswer ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {campaign.autoAnswer ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Auto Disposition</span>
                <span className={`font-semibold ${campaign.autoDispo ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {campaign.autoDispo ? `Yes (${campaign.autoDispoValue})` : 'Disabled'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Call Masking</span>
                <span className={`font-semibold ${campaign.callMasking ? 'text-indigo-600' : 'text-slate-500'}`}>
                  {campaign.callMasking ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Allowed Pause Codes */}
            {campaign.pauseCodes && campaign.pauseCodes.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-500 block mb-1">Allowed Pause Codes</span>
                <div className="flex flex-wrap gap-1">
                  {campaign.pauseCodes.map(p => (
                    <span key={p} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
