import React from 'react';
import {
  GitFork,
  Plus,
  Play,
  Save,
  PhoneCall,
  Volume2,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  Settings
} from 'lucide-react';
import { Tenant } from '../types/index.js';

interface CallFlowBuilderProps {
  activeTenant: Tenant;
}

interface FlowNode {
  id: string;
  type: 'incoming_did' | 'ivr_menu' | 'queue_transfer' | 'voicemail' | 'hangup';
  title: string;
  subtitle: string;
  config: Record<string, any>;
  x: number;
  y: number;
}

export const CallFlowBuilderPage: React.FC<CallFlowBuilderProps> = ({ activeTenant }) => {
  const [nodes, setNodes] = React.useState<FlowNode[]>([
    {
      id: 'n1',
      type: 'incoming_did',
      title: 'DID Inbound Route: 27001',
      subtitle: 'Primary Trunk Line (PRI/SIP)',
      config: { did: '27001' },
      x: 50,
      y: 80
    },
    {
      id: 'n2',
      type: 'ivr_menu',
      title: 'Main IVR: Welcome Prompt',
      subtitle: 'Audio: welcome_dialko.wav (DTMF 1, 2, 9)',
      config: { audio: 'welcome_dialko.wav', timeout: 5 },
      x: 350,
      y: 80
    },
    {
      id: 'n3',
      type: 'queue_transfer',
      title: 'DTMF 1: Sales Inbound Queue',
      subtitle: 'Strategy: ringall • Wait: 45s • Ring Parallel',
      config: { queue: 'somnathlead_Incoming', timeout: 45 },
      x: 680,
      y: 30
    },
    {
      id: 'n4',
      type: 'queue_transfer',
      title: 'DTMF 2: Technical Support',
      subtitle: 'Strategy: rrmemory • Sticky Agent Enabled',
      config: { queue: 'Support_Tier1', timeout: 60 },
      x: 680,
      y: 160
    }
  ]);

  const [selectedNode, setSelectedNode] = React.useState<FlowNode | null>(nodes[1]);
  const [saveStatus, setSaveStatus] = React.useState('');

  const handleSaveDialplan = () => {
    setSaveStatus('Dialplan compiled & synced to Asterisk extensions.conf');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  return (
    <div id="call-flow-builder-container" className="p-4 space-y-3 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-indigo-700 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            CF
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Visual Call Flow & IVR Builder</h2>
            <span className="text-[11px] text-slate-500">Interactive Asterisk dialplan designer, multi-level IVRs, and queue branch router</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {saveStatus && (
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              {saveStatus}
            </span>
          )}
          <button
            onClick={handleSaveDialplan}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded font-bold shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Deploy to Asterisk
          </button>
        </div>
      </div>

      {/* Main Builder Canvas and Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Flow Canvas */}
        <div className="lg:col-span-3 bg-slate-900 rounded-lg border border-slate-800 p-6 min-h-[440px] relative overflow-hidden shadow-inner flex flex-col justify-between">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

          <div className="flex flex-wrap items-center gap-6 relative z-10">
            {nodes.map((node, idx) => (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={`p-4 rounded-xl border w-64 cursor-pointer transition shadow-lg ${
                  selectedNode?.id === node.id
                    ? 'bg-slate-800 border-sky-400 ring-2 ring-sky-400/30'
                    : 'bg-slate-800/80 border-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    node.type === 'incoming_did' ? 'bg-teal-950 text-teal-400 border border-teal-800' :
                    node.type === 'ivr_menu' ? 'bg-purple-950 text-purple-400 border border-purple-800' :
                    'bg-sky-950 text-sky-400 border border-sky-800'
                  }`}>
                    {node.type.replace('_', ' ')}
                  </span>
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <h4 className="text-white text-xs font-bold">{node.title}</h4>
                <p className="text-slate-400 text-[11px] mt-1">{node.subtitle}</p>
              </div>
            ))}
          </div>

          <div className="relative z-10 pt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800">
            <span>Asterisk Context: <strong className="text-slate-200">default_inbound_routing</strong></span>
            <span>Active Trunk: <strong className="text-emerald-400">SIP/Tata_Tele_Trunk01 (ONLINE)</strong></span>
          </div>
        </div>

        {/* Node Property Inspector */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Settings className="w-4 h-4 text-sky-600" />
            <h3 className="font-bold text-xs text-slate-800">Node Configuration</h3>
          </div>

          {selectedNode ? (
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Node Title</label>
                <input
                  type="text"
                  value={selectedNode.title}
                  onChange={e => {
                    const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, title: e.target.value } : n);
                    setNodes(updated);
                    setSelectedNode({ ...selectedNode, title: e.target.value });
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Audio Prompt (WAV / GSM)</label>
                <select className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs">
                  <option>welcome_dialko.wav</option>
                  <option>sales_intro_english.wav</option>
                  <option>after_hours_closed.wav</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Max Retries</label>
                <input type="number" defaultValue={3} className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs" />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Invalid Key Press Route</label>
                <input type="text" defaultValue="Hangup / Voicemail" className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs" />
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Select a node from the canvas to edit its properties.</p>
          )}
        </div>
      </div>
    </div>
  );
};
