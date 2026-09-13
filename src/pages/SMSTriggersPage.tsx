import React from 'react';
import {
  MessageSquare,
  Plus,
  Zap,
  Send,
  CheckCircle,
  Clock,
  Trash2,
  Edit2,
  X,
  Smartphone
} from 'lucide-react';
import { SMSTemplate, SMSTrigger, SMSLog, Tenant } from '../types/index.js';

interface SMSTriggersPageProps {
  activeTenant: Tenant;
}

export const SMSTriggersPage: React.FC<SMSTriggersPageProps> = ({ activeTenant }) => {
  const [templates, setTemplates] = React.useState<SMSTemplate[]>([]);
  const [triggers, setTriggers] = React.useState<SMSTrigger[]>([]);
  const [logs, setLogs] = React.useState<SMSLog[]>([]);
  const [activeTab, setActiveTab] = React.useState<'templates' | 'triggers' | 'logs'>('templates');

  // Modals
  const [isTemplateModalOpen, setIsTemplateModalOpen] = React.useState(false);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = React.useState(false);
  const [isTestSendOpen, setIsTestSendOpen] = React.useState(false);

  // Forms
  const [templateForm, setTemplateForm] = React.useState({
    name: '',
    senderId: 'DIALKO',
    content: 'Hi {CUSTOMER_NAME}, thank you for speaking with Dialko. Here is your reference #{TICKET_ID}.'
  });

  const [triggerForm, setTriggerForm] = React.useState({
    campaign: 'RIYA001',
    disposition: 'Interested - Send Details',
    templateId: 't-1',
    delayMinutes: 0
  });

  const [testSendForm, setTestSendForm] = React.useState({
    phoneNumber: '918073236368',
    templateId: 't-1'
  });

  const [sendSuccessMsg, setSendSuccessMsg] = React.useState('');

  const fetchData = async () => {
    try {
      const [tRes, trRes, lRes] = await Promise.all([
        fetch(`/api/sms/templates?tenantId=${activeTenant.id}`),
        fetch(`/api/sms/triggers?tenantId=${activeTenant.id}`),
        fetch(`/api/sms/logs?tenantId=${activeTenant.id}`)
      ]);
      setTemplates(await tRes.json());
      setTriggers(await trRes.json());
      setLogs(await lRes.json());
    } catch (err) {
      console.error('Failed to load SMS data', err);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [activeTenant.id]);

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/sms/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
      body: JSON.stringify(templateForm)
    });
    setIsTemplateModalOpen(false);
    fetchData();
  };

  const handleSaveTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/sms/triggers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
      body: JSON.stringify(triggerForm)
    });
    setIsTriggerModalOpen(false);
    fetchData();
  };

  const handleDispatchTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedT = templates.find(t => t.id === testSendForm.templateId);
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify({
          recipient: testSendForm.phoneNumber,
          message: selectedT?.content || 'Test SMS message from Dialko gateway.',
          templateId: testSendForm.templateId,
          triggeredBy: 'Manual Admin Test'
        })
      });
      const data = await res.json();
      setSendSuccessMsg(`SMS dispatched successfully! Gateway ID: ${data.gatewayResponse?.messageId || 'MSG-OK'}`);
      setTimeout(() => {
        setSendSuccessMsg('');
        setIsTestSendOpen(false);
      }, 2000);
      fetchData();
    } catch (err) {
      console.error('Test SMS failed', err);
    }
  };

  return (
    <div id="sms-triggers-container" className="p-4 space-y-3 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            SM
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">SMS Gateway & Automated Triggers</h2>
            <span className="text-[11px] text-slate-500">Post-call automated SMS triggers, dynamic templates, and live dispatch logs</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="bg-slate-100 p-1 rounded-md flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3 py-1 rounded font-semibold cursor-pointer ${
                activeTab === 'templates' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Templates ({templates.length})
            </button>
            <button
              onClick={() => setActiveTab('triggers')}
              className={`px-3 py-1 rounded font-semibold cursor-pointer ${
                activeTab === 'triggers' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Triggers ({triggers.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1 rounded font-semibold cursor-pointer ${
                activeTab === 'logs' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              SMS Logs ({logs.length})
            </button>
          </div>

          <button
            onClick={() => setIsTestSendOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Test Send SMS
          </button>

          {activeTab === 'templates' && (
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Template
            </button>
          )}

          {activeTab === 'triggers' && (
            <button
              onClick={() => setIsTriggerModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded font-bold shadow-xs cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              Add Trigger
            </button>
          )}
        </div>
      </div>

      {/* 1. TEMPLATES VIEW */}
      {activeTab === 'templates' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3.5 border-r border-slate-200">Template Name</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Sender ID</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Content / Variables</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 text-center">DLT Approved</th>
                <th className="py-2.5 px-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {templates.map(tpl => (
                <tr key={tpl.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3.5 border-r border-slate-100 font-bold text-slate-800">{tpl.name}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono font-semibold text-sky-700">{tpl.senderId}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-700">{tpl.content}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-emerald-700 bg-emerald-50">
                      DLT Verified
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <button className="p-1 text-slate-400 hover:text-slate-600 rounded">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. AUTOMATION TRIGGERS VIEW */}
      {activeTab === 'triggers' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3.5 border-r border-slate-200">Campaign</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Call Disposition Trigger</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Assigned SMS Template</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 text-center">Delay</th>
                <th className="py-2.5 px-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {triggers.map(trig => (
                <tr key={trig.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3.5 border-r border-slate-100 font-bold text-sky-700">{trig.campaign}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800">
                      On Disposition: {trig.disposition}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-800 font-medium">{trig.templateName}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 text-center font-mono">
                    {trig.delayMinutes === 0 ? 'Instant' : `${trig.delayMinutes} min`}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-emerald-700 bg-emerald-50">
                      {trig.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. LIVE SMS LOGS VIEW */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3.5 border-r border-slate-200">Timestamp</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Recipient Phone</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Trigger Reason</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Message Content</th>
                <th className="py-2.5 px-3.5 text-center">Gateway Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-600">{log.sentAt}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 font-bold text-sky-700">{log.recipient}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 font-sans text-slate-800">{log.triggeredBy}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 font-sans text-slate-600 truncate max-w-[280px]">{log.message}</td>
                  <td className="py-2.5 px-3.5 text-center font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-emerald-700 bg-emerald-50">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-3.5 bg-[#0284c7] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Add SMS Template</h3>
              <button onClick={() => setIsTemplateModalOpen(false)} className="p-1 hover:bg-white/20 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveTemplate} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Template Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Intro Offer"
                  value={templateForm.name}
                  onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Sender ID (6 Chars)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={templateForm.senderId}
                  onChange={e => setTemplateForm({ ...templateForm, senderId: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Message Content (Supports {'{CUSTOMER_NAME}'}, {'{TICKET_ID}'}) *</label>
                <textarea
                  required
                  rows={4}
                  value={templateForm.content}
                  onChange={e => setTemplateForm({ ...templateForm, content: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsTemplateModalOpen(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#0284c7] text-white rounded font-bold">Save Template</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Trigger Modal */}
      {isTriggerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-3.5 bg-[#0284c7] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Add Automated SMS Trigger</h3>
              <button onClick={() => setIsTriggerModalOpen(false)} className="p-1 hover:bg-white/20 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveTrigger} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Campaign</label>
                <select
                  value={triggerForm.campaign}
                  onChange={e => setTriggerForm({ ...triggerForm, campaign: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                >
                  <option value="RIYA001">RIYA001</option>
                  <option value="MAHI002">MAHI002</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Disposition Trigger *</label>
                <input
                  type="text"
                  required
                  value={triggerForm.disposition}
                  onChange={e => setTriggerForm({ ...triggerForm, disposition: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select SMS Template</label>
                <select
                  value={triggerForm.templateId}
                  onChange={e => setTriggerForm({ ...triggerForm, templateId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsTriggerModalOpen(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#0284c7] text-white rounded font-bold">Save Trigger</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test SMS Dispatch Modal */}
      {isTestSendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Live SMS Gateway Test Dispatch
              </h3>
              <button onClick={() => setIsTestSendOpen(false)} className="p-1 hover:bg-white/20 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleDispatchTest} className="p-5 space-y-3 text-xs">
              {sendSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 font-bold">
                  {sendSuccessMsg}
                </div>
              )}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Recipient Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={testSendForm.phoneNumber}
                  onChange={e => setTestSendForm({ ...testSendForm, phoneNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Template</label>
                <select
                  value={testSendForm.templateId}
                  onChange={e => setTestSendForm({ ...testSendForm, templateId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsTestSendOpen(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold">
                  Send SMS Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
