import React from 'react';
import {
  X,
  Radio,
  Eye,
  Megaphone,
  Layers,
  FileText,
  Sliders,
  CheckCircle2,
  Check,
  ChevronRight,
  ChevronLeft,
  PhoneCall,
  Shield,
  Clock,
  Sparkles,
  PhoneIncoming,
  RotateCw,
  Lock,
  GitFork
} from 'lucide-react';
import {
  Campaign,
  Tenant
} from '../../types/index.js';

interface CampaignWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  activeTenant: Tenant;
  editingCampaign?: Campaign | null;
}

export const CampaignWizardModal: React.FC<CampaignWizardModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  activeTenant,
  editingCampaign
}) => {
  const [currentStep, setCurrentStep] = React.useState<1 | 2 | 3>(1);
  const [saving, setSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  // Loaded Options from Telephony Config & Server
  const [telephonyQueues, setTelephonyQueues] = React.useState<{ id: string; queueName: string; ringingStrategy: string; visitTimeoutSec: number }[]>([]);
  const [telephonyDispositions, setTelephonyDispositions] = React.useState<{ id: string; disposition: string; category?: string }[]>([]);
  const [telephonyPauseCodes, setTelephonyPauseCodes] = React.useState<{ id: string; pauseCode: string; description?: string }[]>([]);
  const [telephonyScripts, setTelephonyScripts] = React.useState<{ id: string; scriptName: string; type?: string }[]>([]);
  const [didsList, setDidsList] = React.useState<string[]>([]);

  // Step 1: Basics & Dialing Mode
  const [name, setName] = React.useState('');
  const [campaignType, setCampaignType] = React.useState<'PREDICTIVE' | 'PREVIEW' | 'VOICE BLAST'>('PREDICTIVE');
  const [active, setActive] = React.useState<'Yes' | 'No'>('Yes');
  const [outboundCallerId, setOutboundCallerId] = React.useState('8005490671');
  const [didRotateStrategy, setDidRotateStrategy] = React.useState<'Direct' | 'Rotate' | 'Random' | 'Local Presence' | 'Agent'>('Direct');
  const [didNumbers, setDidNumbers] = React.useState<string[]>(['8005490671']);
  const [newDidInput, setNewDidInput] = React.useState('');
  const [dialRatio, setDialRatio] = React.useState('1.5');
  const [previewTimeSec, setPreviewTimeSec] = React.useState(20);
  const [autoDial, setAutoDial] = React.useState(true);
  const [maxConcurrentCalls, setMaxConcurrentCalls] = React.useState(30);
  const [amdDetection, setAmdDetection] = React.useState<'Disabled' | 'Standard AMD' | 'Aggressive AMD'>('Standard AMD');
  const [process, setProcess] = React.useState<'Leads' | 'Contacts' | 'Tickets' | 'Meetings'>('Leads');
  const [industry, setIndustry] = React.useState('IT & Telecom');

  // Step 2: Assign Telephony Queues & Inbound Routing
  const [primaryQueue, setPrimaryQueue] = React.useState('');
  const [mappedQueues, setMappedQueues] = React.useState<string[]>([]);
  const [inboundCallSetting, setInboundCallSetting] = React.useState<'Allow' | 'Block'>('Allow');
  const [routingType, setRoutingType] = React.useState<'Queue Routing' | 'Sticky Agent Routing' | 'External Number Routing'>('Queue Routing');
  const [inboundTargetQueue, setInboundTargetQueue] = React.useState('');
  const [externalForwardNumber, setExternalForwardNumber] = React.useState('+919480732362');
  const [ringTimeoutSec, setRingTimeoutSec] = React.useState(25);
  const [fallbackRouting, setFallbackRouting] = React.useState('Voicemail');

  // Step 3: Dispositions, Scripts & Features
  const [dispositionStatuses, setDispositionStatuses] = React.useState<string[]>([
    'SALE', 'INTERESTED', 'CALLBACK', 'CALL_LATER', 'NOT_INTERESTED', 'DNC'
  ]);
  const [pauseCodes, setPauseCodes] = React.useState<string[]>([
    'Meeting', 'Lunch', 'Tea Break', 'Training', 'WASHROOM'
  ]);
  const [scriptName, setScriptName] = React.useState('');
  const [onDemandRecording, setOnDemandRecording] = React.useState(true);
  const [dncCheck, setDncCheck] = React.useState(true);
  const [callMasking, setCallMasking] = React.useState(false);

  // Auto-Disposition Settings (User Request: Auto-Dispo option & active countdown timer)
  const [autoDispo, setAutoDispo] = React.useState(true);
  const [autoDispoTimerSec, setAutoDispoTimerSec] = React.useState(15);
  const [autoDispoValue, setAutoDispoValue] = React.useState('CALL_LATER');

  // Load live Telephony Configuration data
  React.useEffect(() => {
    if (!isOpen) return;

    // Fetch Queues from Telephony Config
    fetch(`/api/configurations/queues?tenantId=${activeTenant.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTelephonyQueues(data);
          if (data.length > 0 && !primaryQueue) {
            setPrimaryQueue(data[0].queueName);
            if (mappedQueues.length === 0) {
              setMappedQueues([data[0].queueName]);
            }
          }
        }
      })
      .catch(err => console.error('Failed to load telephony queues', err));

    // Fetch Dispositions, Pause Codes, Scripts, DIDs from config options
    fetch(`/api/campaign-config-options?tenantId=${activeTenant.id}`)
      .then(res => res.json())
      .then(opts => {
        if (opts.dispositions) setTelephonyDispositions(opts.dispositions);
        if (opts.pauseCodes) setTelephonyPauseCodes(opts.pauseCodes);
        if (opts.scripts) {
          setTelephonyScripts(opts.scripts);
          if (opts.scripts.length > 0 && !scriptName) {
            setScriptName(opts.scripts[0].scriptName);
          }
        }
        if (opts.dids) {
          const didNums = opts.dids.map((d: any) => d.didNumber || d);
          setDidsList(didNums);
          if (didNums.length > 0 && !outboundCallerId) {
            setOutboundCallerId(didNums[0]);
          }
        }
      })
      .catch(err => console.error('Failed to load campaign config options', err));
  }, [isOpen, activeTenant.id]);

  // Load editing campaign values
  React.useEffect(() => {
    if (editingCampaign && isOpen) {
      setName(editingCampaign.name || '');
      setCampaignType((editingCampaign.type as any) || 'PREDICTIVE');
      setActive(editingCampaign.active || 'Yes');
      setOutboundCallerId(editingCampaign.outboundCallerId || '8005490671');
      setDidRotateStrategy((editingCampaign.didRotateStrategy as any) || 'Direct');
      setDidNumbers(editingCampaign.didNumbers && editingCampaign.didNumbers.length > 0 ? editingCampaign.didNumbers : [editingCampaign.outboundCallerId || '8005490671']);
      setDialRatio(editingCampaign.dial_ratio || '1.5');
      setPreviewTimeSec(editingCampaign.previewTimeSec || 20);
      setAutoDial(editingCampaign.autoDial !== undefined ? editingCampaign.autoDial : true);
      setMaxConcurrentCalls(editingCampaign.maxConcurrentCalls || 30);
      setAmdDetection((editingCampaign.amdDetection as any) || 'Standard AMD');
      setProcess((editingCampaign.process as any) || 'Leads');
      setIndustry(editingCampaign.industry || 'IT & Telecom');

      setPrimaryQueue(editingCampaign.queue || '');
      setMappedQueues(editingCampaign.mappedQueues || (editingCampaign.queue ? [editingCampaign.queue] : []));
      setInboundCallSetting((editingCampaign.inboundCallSetting as any) || 'Allow');
      setRoutingType((editingCampaign.routingType as any) || 'Queue Routing');
      setInboundTargetQueue(editingCampaign.inboundTargetQueue || editingCampaign.queue || '');
      setExternalForwardNumber(editingCampaign.externalForwardNumber || '+919480732362');
      setRingTimeoutSec(editingCampaign.ringTimeoutSec || 25);
      setFallbackRouting((editingCampaign.fallbackRouting as any) || 'Voicemail');

      if (editingCampaign.dispositionStatuses && editingCampaign.dispositionStatuses.length > 0) {
        setDispositionStatuses(editingCampaign.dispositionStatuses);
      }
      if (editingCampaign.pauseCodes && editingCampaign.pauseCodes.length > 0) {
        setPauseCodes(editingCampaign.pauseCodes);
      }
      setScriptName(editingCampaign.scriptName || '');
      setOnDemandRecording(editingCampaign.onDemandRecording !== undefined ? editingCampaign.onDemandRecording : true);
      setDncCheck(editingCampaign.dncCheck !== undefined ? editingCampaign.dncCheck : true);
      setCallMasking(Boolean(editingCampaign.callMasking));
      
      setAutoDispo(editingCampaign.autoDispo !== undefined ? editingCampaign.autoDispo : true);
      setAutoDispoTimerSec(editingCampaign.autoDispoTimerSec || 15);
      setAutoDispoValue(editingCampaign.autoDispoValue || 'CALL_LATER');

      setCurrentStep(1);
      setErrorMessage('');
    } else if (isOpen && !editingCampaign) {
      // Defaults for brand new campaign
      setName('');
      setCampaignType('PREDICTIVE');
      setActive('Yes');
      setOutboundCallerId('8005490671');
      setDialRatio('1.5');
      setPreviewTimeSec(20);
      setAutoDial(true);
      setMaxConcurrentCalls(30);
      setAmdDetection('Standard AMD');
      setProcess('Leads');
      setIndustry('IT & Telecom');
      setInboundCallSetting('Allow');
      setRoutingType('Queue Routing');
      setInboundTargetQueue('');
      setExternalForwardNumber('+919480732362');
      setRingTimeoutSec(25);
      setFallbackRouting('Voicemail');
      setDispositionStatuses(['SALE', 'INTERESTED', 'CALLBACK', 'CALL_LATER', 'NOT_INTERESTED', 'DNC']);
      setPauseCodes(['Meeting', 'Lunch', 'Tea Break', 'Training', 'WASHROOM']);
      setOnDemandRecording(true);
      setDncCheck(true);
      setCallMasking(false);
      setAutoDispo(true);
      setAutoDispoTimerSec(15);
      setAutoDispoValue('CALL_LATER');
      setDidRotateStrategy('Direct');
      setDidNumbers(['8005490671']);
      setCurrentStep(1);
      setErrorMessage('');
    }
  }, [editingCampaign, isOpen]);

  const handleNext = () => {
    setErrorMessage('');
    if (currentStep === 1) {
      if (!name.trim()) {
        setErrorMessage('Please enter a Campaign Name');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!primaryQueue && telephonyQueues.length > 0) {
        setPrimaryQueue(telephonyQueues[0].queueName);
      }
      if (mappedQueues.length === 0 && telephonyQueues.length > 0) {
        setMappedQueues([telephonyQueues[0].queueName]);
      }
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setErrorMessage('');
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as any);
    }
  };

  const toggleItem = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter(i => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleSave = async () => {
    setErrorMessage('');
    if (!name.trim()) {
      setCurrentStep(1);
      setErrorMessage('Campaign Name is required');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Campaign> = {
        name: name.trim(),
        type: campaignType,
        active,
        outboundCallerId: outboundCallerId || '8005490671',
        didRotateStrategy,
        didNumbers: didNumbers.length > 0 ? didNumbers : [outboundCallerId || '8005490671'],
        dial_ratio: dialRatio,
        previewTimeSec,
        autoDial,
        maxConcurrentCalls,
        amdDetection,
        process,
        industry,
        queue: primaryQueue || (telephonyQueues[0]?.queueName || 'General_Queue'),
        mappedQueues: mappedQueues.length > 0 ? mappedQueues : (primaryQueue ? [primaryQueue] : ['General_Queue']),
        inboundCallSetting,
        inboundDid: outboundCallerId || '27001',
        routingType,
        inboundTargetQueue: inboundTargetQueue || primaryQueue || (telephonyQueues[0]?.queueName || 'General_Queue'),
        externalForwardNumber,
        ringTimeoutSec,
        fallbackRouting: fallbackRouting as any,
        dispositionStatuses: dispositionStatuses.length > 0 ? dispositionStatuses : ['SALE', 'INTERESTED', 'CALLBACK', 'NOT_INTERESTED', 'DNC'],
        pauseCodes: pauseCodes.length > 0 ? pauseCodes : ['Meeting', 'Lunch', 'Tea Break', 'Training'],
        scriptName: scriptName || (telephonyScripts[0]?.scriptName || 'Standard_Sales_Script'),
        onDemandRecording,
        dncCheck,
        callMasking,
        autoDispo,
        autoDispoTimerSec: Number(autoDispoTimerSec) || 15,
        autoDispoValue
      };

      const url = editingCampaign ? `/api/campaigns/${editingCampaign.id}` : '/api/campaigns';
      const method = editingCampaign ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save campaign');
      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to save campaign. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const standardDispos = telephonyDispositions.length > 0
    ? telephonyDispositions.map(d => d.disposition)
    : ['SALE', 'INTERESTED', 'CALLBACK', 'CALL_LATER', 'ANSWER', 'NOT_INTERESTED', 'DNC', 'BUSY', 'NO_ANSWER'];

  const standardPauses = telephonyPauseCodes.length > 0
    ? telephonyPauseCodes.map(p => p.pauseCode)
    : ['Meeting', 'Lunch', 'Tea Break', 'Training', 'WASHROOM', 'Technical Break'];

  return (
    <div id="campaign-wizard-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {editingCampaign ? `Edit Campaign: ${editingCampaign.name}` : 'Create New Campaign'}
              </h2>
              <p className="text-xs text-slate-400">
                Setup dialer behavior, assign telephony queues, and configure dispositions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-8 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              currentStep === 1 ? 'bg-sky-600 text-white shadow-xs' : currentStep > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <span className={`text-xs font-bold ${currentStep === 1 ? 'text-sky-800' : 'text-slate-600'}`}>
              Basics & Dialing
            </span>
          </div>

          <div className="w-12 h-0.5 bg-slate-200" />

          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              currentStep === 2 ? 'bg-sky-600 text-white shadow-xs' : currentStep > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <span className={`text-xs font-bold ${currentStep === 2 ? 'text-sky-800' : 'text-slate-600'}`}>
              Assign Queues
            </span>
          </div>

          <div className="w-12 h-0.5 bg-slate-200" />

          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              currentStep === 3 ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600'
            }`}>
              3
            </div>
            <span className={`text-xs font-bold ${currentStep === 3 ? 'text-sky-800' : 'text-slate-600'}`}>
              Dispositions & Scripts
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs custom-scrollbar">
          
          {/* ========================================================================= */}
          {/* STEP 1: BASICS & DIALING MODE */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-5">
              {/* Campaign Name & Status */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Campaign Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Inbound Sales Campaign"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Status</label>
                  <select
                    value={active}
                    onChange={e => setActive(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-sky-500"
                  >
                    <option value="Yes">Active (Dialing Allowed)</option>
                    <option value="No">Inactive (Paused)</option>
                  </select>
                </div>
              </div>

              {/* Dialing Engine Selection */}
              <div>
                <label className="block text-slate-700 font-bold mb-2">Dialing Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  {/* PREDICTIVE */}
                  <div
                    onClick={() => setCampaignType('PREDICTIVE')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      campaignType === 'PREDICTIVE'
                        ? 'border-sky-600 bg-sky-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                          <Radio className="w-4 h-4" />
                        </div>
                        {campaignType === 'PREDICTIVE' && <CheckCircle2 className="w-4 h-4 text-sky-600" />}
                      </div>
                      <h4 className="font-bold text-xs text-slate-800">Predictive Dialer</h4>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Multi-line automated pacing to maximize talk times and reduce idle time.
                      </p>
                    </div>
                  </div>

                  {/* PREVIEW */}
                  <div
                    onClick={() => setCampaignType('PREVIEW')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      campaignType === 'PREVIEW'
                        ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                          <Eye className="w-4 h-4" />
                        </div>
                        {campaignType === 'PREVIEW' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <h4 className="font-bold text-xs text-slate-800">Preview Dialer</h4>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Agents inspect customer lead data before dialing starts.
                      </p>
                    </div>
                  </div>

                  {/* VOICE BLAST */}
                  <div
                    onClick={() => setCampaignType('VOICE BLAST')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      campaignType === 'VOICE BLAST'
                        ? 'border-amber-600 bg-amber-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                          <Megaphone className="w-4 h-4" />
                        </div>
                        {campaignType === 'VOICE BLAST' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                      </div>
                      <h4 className="font-bold text-xs text-slate-800">Voice Blast</h4>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Automated broadcast announcements with optional transfer to agent queue.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* DID Rotation Strategy & Outbound Caller ID Pool */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <RotateCw className="w-3.5 h-3.5 text-sky-600" />
                      Outbound Caller ID (DID) & Rotation Strategy
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Configure how caller IDs are presented to customers during automated hopper and manual dialing.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                    {didRotateStrategy}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      DID Rotate Strategy <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={didRotateStrategy}
                      onChange={e => {
                        const val = e.target.value as any;
                        setDidRotateStrategy(val);
                        if (val === 'Direct' && didNumbers.length === 0) {
                          setDidNumbers([outboundCallerId || '8005490671']);
                        }
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-800"
                    >
                      <option value="Direct">Direct (Single Fixed Trunk Caller ID)</option>
                      <option value="Rotate">Round Robin / Sequential Rotation (Pool of DIDs)</option>
                      <option value="Random">Random Rotation (Random DID from Pool)</option>
                      <option value="Local Presence">Local Presence (Area Code / Prefix Match)</option>
                      <option value="Agent">Agent Assigned (Agent Dedicated Extension DID)</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {didRotateStrategy === 'Direct' && 'All outbound calls present the fixed primary trunk DID.'}
                      {didRotateStrategy === 'Rotate' && 'Cycles sequentially through the DID pool on each dial to balance carrier load & prevent spam tags.'}
                      {didRotateStrategy === 'Random' && 'Randomly selects a DID from the configured pool for each call.'}
                      {didRotateStrategy === 'Local Presence' && 'Matches caller ID area code/prefix to customer phone number to boost pickup rates.'}
                      {didRotateStrategy === 'Agent' && 'Uses the specific extension DID assigned to the logged-in agent.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Primary Trunk DID (Default Caller ID) *</label>
                    <input
                      type="text"
                      value={outboundCallerId}
                      onChange={e => {
                        const val = e.target.value;
                        setOutboundCallerId(val);
                        if (!didNumbers.includes(val) && val.trim()) {
                          setDidNumbers([val, ...didNumbers.filter(d => d !== outboundCallerId)]);
                        }
                      }}
                      placeholder="8005490671"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Multi-DID Pool Manager */}
                {didRotateStrategy !== 'Direct' && didRotateStrategy !== 'Agent' && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-700 font-bold text-xs">
                        DID Rotation Pool ({didNumbers.length} DIDs configured)
                      </label>
                      <span className="text-[10px] text-slate-500">
                        Enter phone number with country/area code and press Add
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newDidInput}
                        onChange={e => setNewDidInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newDidInput.trim() && !didNumbers.includes(newDidInput.trim())) {
                              setDidNumbers([...didNumbers, newDidInput.trim()]);
                              setNewDidInput('');
                            }
                          }
                        }}
                        placeholder="e.g. +14155552671 or 918073236368"
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newDidInput.trim() && !didNumbers.includes(newDidInput.trim())) {
                            setDidNumbers([...didNumbers, newDidInput.trim()]);
                            setNewDidInput('');
                          }
                        }}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Add to Pool
                      </button>
                    </div>

                    {/* DID Pool Chips */}
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-white border border-slate-200 rounded-lg">
                      {didNumbers.map((did, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-mono font-semibold"
                        >
                          <span>{did}</span>
                          {did === outboundCallerId && (
                            <span className="text-[9px] px-1 py-0.2 bg-sky-200 text-sky-800 rounded font-sans font-bold">
                              Primary
                            </span>
                          )}
                          {didNumbers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setDidNumbers(didNumbers.filter(d => d !== did))}
                              className="text-slate-400 hover:text-rose-600 font-bold ml-1"
                            >
                              &times;
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mode-Specific Settings */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {campaignType === 'PREDICTIVE' && (
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Dial Ratio (Calls per Agent)</label>
                      <select
                        value={dialRatio}
                        onChange={e => setDialRatio(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-semibold"
                      >
                        <option value="1.0">1.0x (1 call per agent)</option>
                        <option value="1.5">1.5x (Balanced)</option>
                        <option value="2.0">2.0x (High Velocity)</option>
                        <option value="3.0">3.0x (Aggressive Predictive)</option>
                      </select>
                    </div>
                  )}

                  {campaignType === 'PREVIEW' && (
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Preview Lead Time</label>
                      <select
                        value={previewTimeSec}
                        onChange={e => setPreviewTimeSec(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-semibold"
                      >
                        <option value={15}>15 Seconds</option>
                        <option value={20}>20 Seconds</option>
                        <option value={30}>30 Seconds</option>
                        <option value={60}>60 Seconds</option>
                      </select>
                    </div>
                  )}

                  {campaignType === 'VOICE BLAST' && (
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Concurrent Channels</label>
                      <input
                        type="number"
                        value={maxConcurrentCalls}
                        onChange={e => setMaxConcurrentCalls(Number(e.target.value) || 30)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-mono"
                      />
                    </div>
                  )}

                  {campaignType === 'PREDICTIVE' && (
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">AMD (Answering Machine Detection)</label>
                      <select
                        value={amdDetection}
                        onChange={e => setAmdDetection(e.target.value as any)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-semibold"
                      >
                        <option value="Standard AMD">Standard AMD (92% Accuracy)</option>
                        <option value="Aggressive AMD">Aggressive AMD (Fast Disconnect)</option>
                        <option value="Disabled">Disabled</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Target Process Module</label>
                    <select
                      value={process}
                      onChange={e => setProcess(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs"
                    >
                      <option value="Leads">Leads & Telesales</option>
                      <option value="Contacts">Contacts & Directory</option>
                      <option value="Tickets">Customer Support Tickets</option>
                      <option value="Meetings">Scheduled Meetings</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Industry Vertical</label>
                    <select
                      value={industry}
                      onChange={e => setIndustry(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs"
                    >
                      <option value="IT & Telecom">IT & Telecom</option>
                      <option value="Financial Services">Financial Services & Banking</option>
                      <option value="Healthcare">Healthcare & Insurance</option>
                      <option value="Real Estate">Real Estate & Property</option>
                      <option value="E-commerce & Retail">E-commerce & Retail</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: ASSIGN TELEPHONY QUEUES */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <GitFork className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-indigo-950">Assign Telephony Queues to this Campaign</h4>
                  <p className="text-[11px] text-indigo-700 mt-0.5 leading-relaxed">
                    Select queues configured under <strong>Telephony Configurations</strong>. When agents log in to this campaign, calls will be routed through the selected queues.
                  </p>
                </div>
              </div>

              {/* Primary Queue Selection */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Primary Routing Queue <span className="text-rose-500">*</span>
                </label>
                <select
                  value={primaryQueue}
                  onChange={e => {
                    setPrimaryQueue(e.target.value);
                    if (!mappedQueues.includes(e.target.value)) {
                      setMappedQueues([...mappedQueues, e.target.value]);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold text-slate-800"
                >
                  {telephonyQueues.map(q => (
                    <option key={q.id} value={q.queueName}>
                      {q.queueName} ({q.ringingStrategy})
                    </option>
                  ))}
                </select>
              </div>

              {/* Mapped Queues Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-700 font-bold">
                    Active Queues for this Campaign ({mappedQueues.length} selected)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMappedQueues(telephonyQueues.map(q => q.queueName))}
                      className="text-[11px] text-sky-600 hover:text-sky-700 font-bold cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setMappedQueues(primaryQueue ? [primaryQueue] : [])}
                      className="text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Primary Only
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {telephonyQueues.map(q => {
                    const isSelected = mappedQueues.includes(q.queueName);
                    return (
                      <div
                        key={q.id}
                        onClick={() => toggleItem(mappedQueues, q.queueName, setMappedQueues)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${
                            isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-400'
                          }`}>
                            <GitFork className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-mono text-xs block">{q.queueName}</span>
                            <span className="text-[10px] text-slate-500 font-normal">{q.ringingStrategy} • {q.visitTimeoutSec}s</span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-sky-600 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inbound Call Handling & Incoming Routing Types (User Request: Queue Routing, Sticky Agent Routing, External Number Routing) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <PhoneIncoming className="w-4 h-4 text-sky-600" />
                    <h4 className="font-bold text-xs text-slate-900">Inbound Call Routing Engine</h4>
                  </div>
                  <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded font-mono text-[10px] font-bold">
                    Inbound Telephony
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Inbound Permission</label>
                    <select
                      value={inboundCallSetting}
                      onChange={e => setInboundCallSetting(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-semibold"
                    >
                      <option value="Allow">Allow Inbound Calls</option>
                      <option value="Block">Block Inbound Calls (Outbound Only)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Ring Timeout</label>
                    <select
                      value={ringTimeoutSec}
                      onChange={e => setRingTimeoutSec(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-semibold"
                    >
                      <option value={15}>15 Seconds (Rapid Ring)</option>
                      <option value={25}>25 Seconds (Standard ACD)</option>
                      <option value={35}>35 Seconds</option>
                      <option value={45}>45 Seconds (Extended)</option>
                    </select>
                  </div>
                </div>

                {inboundCallSetting === 'Allow' && (
                  <div className="space-y-3 pt-2 border-t border-slate-200/80">
                    <label className="block text-slate-800 font-bold text-xs">
                      Select Incoming Routing Strategy *
                    </label>
                    
                    {/* 3 Dedicated Incoming Routing Types */}
                    <div className="grid grid-cols-3 gap-2.5">
                      
                      {/* 1. Queue Routing */}
                      <div
                        onClick={() => setRoutingType('Queue Routing')}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                          routingType === 'Queue Routing'
                            ? 'bg-sky-50 border-sky-600 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-sky-900">Queue Routing</span>
                            {routingType === 'Queue Routing' && <Check className="w-3.5 h-3.5 text-sky-600" />}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight">
                            Routes calls to ACD queue with round-robin / ring-all agent distribution.
                          </p>
                        </div>
                      </div>

                      {/* 2. Sticky Agent Routing */}
                      <div
                        onClick={() => setRoutingType('Sticky Agent Routing')}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                          routingType === 'Sticky Agent Routing'
                            ? 'bg-emerald-50 border-emerald-600 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-emerald-900">Sticky Agent</span>
                            {routingType === 'Sticky Agent Routing' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight">
                            Routes customer to their dedicated/last-spoke agent. Falls back to queue if offline.
                          </p>
                        </div>
                      </div>

                      {/* 3. External Number Routing */}
                      <div
                        onClick={() => setRoutingType('External Number Routing')}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                          routingType === 'External Number Routing'
                            ? 'bg-purple-50 border-purple-600 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-purple-900">External Forward</span>
                            {routingType === 'External Number Routing' && <Check className="w-3.5 h-3.5 text-purple-600" />}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight">
                            Directly forwards inbound call to external mobile/PSTN number.
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* Routing Type Specific Configuration Input */}
                    {routingType === 'Queue Routing' && (
                      <div className="p-3 bg-white rounded-lg border border-sky-200 space-y-2 text-xs">
                        <label className="block font-bold text-slate-700">Target Inbound ACD Queue</label>
                        <select
                          value={inboundTargetQueue || primaryQueue}
                          onChange={e => setInboundTargetQueue(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-semibold"
                        >
                          {telephonyQueues.map(q => (
                            <option key={q.id} value={q.queueName}>
                              {q.queueName} (Strategy: {q.ringingStrategy})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {routingType === 'Sticky Agent Routing' && (
                      <div className="p-3 bg-white rounded-lg border border-emerald-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-700">Sticky Fallback Queue (if Agent Busy/Offline)</label>
                          <span className="text-[10px] text-emerald-700 font-semibold">CRM & Call Log Memory Active</span>
                        </div>
                        <select
                          value={inboundTargetQueue || primaryQueue}
                          onChange={e => setInboundTargetQueue(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-semibold"
                        >
                          {telephonyQueues.map(q => (
                            <option key={q.id} value={q.queueName}>
                              Fallback: {q.queueName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {routingType === 'External Number Routing' && (
                      <div className="p-3 bg-white rounded-lg border border-purple-200 space-y-2 text-xs">
                        <label className="block font-bold text-slate-700">
                          External Forwarding Mobile / PSTN Number *
                        </label>
                        <input
                          type="text"
                          value={externalForwardNumber}
                          onChange={e => setExternalForwardNumber(e.target.value)}
                          placeholder="+91 94807 32362 or 18005550199"
                          className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                        />
                        <span className="text-[10px] text-slate-500 block">
                          Incoming calls on DID {outboundCallerId} will be automatically bridged to this PSTN phone.
                        </span>
                      </div>
                    )}

                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: DISPOSITIONS, SCRIPTS & COMPLIANCE */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {/* Dispositions Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-700 font-bold">
                    Allowed Dispositions ({dispositionStatuses.length} selected)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDispositionStatuses(standardDispos)}
                      className="text-[11px] text-sky-600 hover:text-sky-700 font-bold cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setDispositionStatuses(['SALE', 'CALLBACK', 'NOT_INTERESTED'])}
                      className="text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Standard Only
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                  {standardDispos.map(d => {
                    const isSelected = dispositionStatuses.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => toggleItem(dispositionStatuses, d, setDispositionStatuses)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{d}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pause Codes Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-700 font-bold">
                    Agent Break / Pause Codes ({pauseCodes.length} selected)
                  </label>
                  <button
                    type="button"
                    onClick={() => setPauseCodes(standardPauses)}
                    className="text-[11px] text-sky-600 hover:text-sky-700 font-bold cursor-pointer"
                  >
                    Select All
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {standardPauses.map(p => {
                    const isSelected = pauseCodes.includes(p);
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => toggleItem(pauseCodes, p, setPauseCodes)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{p}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Auto-Disposition & Wrap-Up Timer Automation */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <h4 className="font-bold text-xs text-slate-900">Auto-Disposition & Wrap-Up Timer</h4>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoDispo}
                      onChange={e => setAutoDispo(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-bold text-slate-700 text-xs">Enable Auto-Dispo</span>
                  </label>
                </div>

                {autoDispo && (
                  <div className="grid grid-cols-2 gap-3 pt-1 animate-in fade-in">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 text-xs">
                        Active Wrap-up Countdown Timer
                      </label>
                      <select
                        value={autoDispoTimerSec}
                        onChange={e => setAutoDispoTimerSec(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold"
                      >
                        <option value={5}>5 Seconds (Ultra Rapid)</option>
                        <option value={10}>10 Seconds</option>
                        <option value={15}>15 Seconds (Standard)</option>
                        <option value={30}>30 Seconds</option>
                        <option value={45}>45 Seconds</option>
                        <option value={60}>60 Seconds</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 text-xs">
                        Default Auto-Disposed Code
                      </label>
                      <select
                        value={autoDispoValue}
                        onChange={e => setAutoDispoValue(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold"
                      >
                        {dispositionStatuses.length > 0 ? (
                          dispositionStatuses.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))
                        ) : (
                          <>
                            <option value="CALL_LATER">CALL_LATER</option>
                            <option value="NO_ANSWER">NO_ANSWER</option>
                            <option value="NOT_INTERESTED">NOT_INTERESTED</option>
                            <option value="INTERESTED">INTERESTED</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Call Script & Toggles */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Dynamic Agent Call Script</label>
                  <select
                    value={scriptName}
                    onChange={e => setScriptName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-semibold"
                  >
                    {telephonyScripts.length > 0 ? (
                      telephonyScripts.map(s => (
                        <option key={s.id} value={s.scriptName}>
                          {s.scriptName} ({s.type || 'General'})
                        </option>
                      ))
                    ) : (
                      <option value="Telecom_Product_Pitch_V2">Telecom Product Pitch V2</option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200/60">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onDemandRecording}
                      onChange={e => setOnDemandRecording(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span className="font-bold text-slate-700 text-[11px]">Call Recording</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dncCheck}
                      onChange={e => setDncCheck(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span className="font-bold text-slate-700 text-[11px]">Enforce DNC List</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={callMasking}
                      onChange={e => setCallMasking(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span className="font-bold text-slate-700 text-[11px]">Mask Phone #</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs cursor-pointer shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs transition"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs transition disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'Saving Campaign...' : editingCampaign ? 'Save Changes' : 'Create Campaign'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
