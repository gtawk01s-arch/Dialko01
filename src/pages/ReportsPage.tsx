import React from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter as FilterIcon,
  Play,
  Volume2,
  Search,
  Calendar,
  Clock,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneForwarded,
  ArrowUpDown,
  RotateCcw
} from 'lucide-react';
import { CallLog, CallRecording, CallTransfer, Tenant } from '../types/index.js';
import { FilterDrawer } from '../components/FilterDrawer.js';
import { AudioPlayerModal } from '../components/AudioPlayerModal.js';

interface ReportsPageProps {
  activeTenant: Tenant;
  reportType?: string;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ activeTenant, reportType = 'call-logs' }) => {
  const [selectedReport, setSelectedReport] = React.useState(reportType);
  const [callLogs, setCallLogs] = React.useState<CallLog[]>([]);
  const [recordings, setRecordings] = React.useState<CallRecording[]>([]);
  const [transfers, setTransfers] = React.useState<CallTransfer[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);

  // Hourly Performance view toggle (Calls vs Time)
  const [hourlyViewMode, setHourlyViewMode] = React.useState<'Calls' | 'Time'>('Calls');
  // Daily Performance view toggle (Detailed vs Consolidated)
  const [dailyViewMode, setDailyViewMode] = React.useState<'Detailed' | 'Consolidated'>('Detailed');

  // Audio player state
  const [activeAudioModal, setActiveAudioModal] = React.useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    audioUrl: string;
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    audioUrl: ''
  });

  const fetchData = async () => {
    try {
      const [logsRes, recsRes, transRes] = await Promise.all([
        fetch(`/api/reports/call-logs?tenantId=${activeTenant.id}`),
        fetch(`/api/reports/recordings?tenantId=${activeTenant.id}`),
        fetch(`/api/reports/transfers?tenantId=${activeTenant.id}`)
      ]);
      setCallLogs(await logsRes.json());
      setRecordings(await recsRes.json());
      setTransfers(await transRes.json());
    } catch (err) {
      console.error('Failed to load reports data', err);
    }
  };

  React.useEffect(() => {
    setSelectedReport(reportType);
  }, [reportType]);

  React.useEffect(() => {
    fetchData();
  }, [activeTenant.id]);

  const handleExport = (reportName: string) => {
    const csvContent = "data:text/csv;charset=utf-8," +
      ["Date,Call ID,Customer Phone,Agent,Campaign,Duration,Status"].join(",") + "\n" +
      callLogs.map(c => `${c.callDate},${c.callId},${c.customerPhone},${c.agentName},${c.campaign},${c.talkTime},${c.status}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dialko_${reportName}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const reportTabs = [
    { id: 'call-logs', label: 'Call Log Report', badge: 'CR', color: 'bg-pink-600' },
    { id: 'recordings', label: 'Call Recordings', badge: 'CA', color: 'bg-rose-600' },
    { id: 'transfers', label: 'Call Transfer', badge: 'CA', color: 'bg-purple-600' },
    { id: 'hourly-performance', label: 'Hourly Agent Performance', badge: 'HO', color: 'bg-amber-600' },
    { id: 'daily-performance', label: 'Daily Agent Performance', badge: 'DA', color: 'bg-orange-600' },
    { id: 'agent-activity', label: 'Agent Activity', badge: 'AG', color: 'bg-blue-600' },
    { id: 'agent-pause', label: 'Agent Pause', badge: 'AG', color: 'bg-red-600' },
    { id: 'dropped-calls', label: 'Dropped Calls', badge: 'DR', color: 'bg-red-700' },
    { id: 'whatsapp-logs', label: 'Social Chat Log', badge: 'SO', color: 'bg-emerald-600' }
  ];

  return (
    <div id="reports-page-container" className="p-4 space-y-3 select-none">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-pink-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            CR
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              {reportTabs.find(r => r.id === selectedReport)?.label || 'Reports'}
            </h2>
            <span className="text-[11px] text-slate-500">Historical telephony analytics, voice recordings, and audit logs</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search phone, agent, ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 w-44 sm:w-56"
            />
          </div>

          <button
            onClick={() => handleExport(selectedReport)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV / XLSX
          </button>

          <button
            onClick={() => setIsFilterOpen(true)}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200"
          >
            <FilterIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reports Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto bg-white p-1.5 rounded-lg border border-slate-200 text-xs custom-scrollbar">
        {reportTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedReport(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedReport === tab.id
                ? 'bg-[#0284c7] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className={`w-4 h-4 rounded text-[9px] font-bold text-white flex items-center justify-center ${tab.color}`}>
              {tab.badge}
            </span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 1. CALL LOG REPORT VIEW */}
      {selectedReport === 'call-logs' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Date & Time</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Call ID</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Customer Phone</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Agent</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Campaign</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Queue</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200 text-center">Type</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Status</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Talk Time</th>
                  <th className="py-2.5 px-3.5 text-center">Recording</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {callLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono text-[11px] text-slate-600">{log.callDate}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono text-sky-700 font-semibold">{log.callId}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono font-medium text-slate-800">{log.customerPhone}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-700 truncate max-w-[170px]">{log.agentName}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-medium text-slate-800">{log.campaign}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-600">{log.queue}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.callType === 'INBOUND' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
                      }`}>
                        {log.callType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        log.status === 'COMPLETE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono font-semibold text-slate-700">{log.talkTime}</td>
                    <td className="py-2.5 px-3.5 text-center">
                      {log.recordingUrl ? (
                        <button
                          onClick={() => setActiveAudioModal({
                            isOpen: true,
                            title: `Call Recording: ${log.customerPhone}`,
                            subtitle: `Agent: ${log.agentName} • Duration: ${log.talkTime} • Date: ${log.callDate}`,
                            audioUrl: log.recordingUrl!
                          })}
                          className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-full transition cursor-pointer"
                          title="Listen to call recording"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. CALL RECORDINGS REPORT */}
      {selectedReport === 'recordings' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Recording Date</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Agent</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Customer Phone</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Campaign</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Duration</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">File Size</th>
                  <th className="py-2.5 px-3.5 text-center">Audio Player</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recordings.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono text-[11px] text-slate-600">{rec.callDate}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-medium text-slate-800">{rec.agentName}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono text-sky-700">{rec.customerPhone}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-700">{rec.campaign}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono font-semibold text-slate-800">{rec.duration}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono text-slate-500">{rec.fileSize}</td>
                    <td className="py-2.5 px-3.5 text-center">
                      <button
                        onClick={() => setActiveAudioModal({
                          isOpen: true,
                          title: `Recording: ${rec.customerPhone}`,
                          subtitle: `Agent: ${rec.agentName} • Size: ${rec.fileSize}`,
                          audioUrl: rec.audioUrl
                        })}
                        className="flex items-center gap-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded font-semibold text-xs shadow-xs mx-auto cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        Play Audio
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. CALL TRANSFERS REPORT */}
      {selectedReport === 'transfers' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Transfer Time</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Customer Phone</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Initiator Agent</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Target Agent</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Type</th>
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Status</th>
                  <th className="py-2.5 px-3.5">Outcome Disposition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map(tr => (
                  <tr key={tr.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono text-[11px] text-slate-600">{tr.transferTime}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono text-sky-700">{tr.customerPhone}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-800 font-medium">{tr.initiatorAgent}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-800 font-medium">{tr.targetAgent}</td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700">
                        {tr.transferType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-slate-100">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                        {tr.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-700 font-medium">{tr.disposition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. HOURLY AGENT PERFORMANCE */}
      {selectedReport === 'hourly-performance' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
            <span className="font-bold text-xs text-slate-700">Metric View Toggle:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs border border-slate-200">
              <button
                onClick={() => setHourlyViewMode('Calls')}
                className={`px-3 py-1 rounded font-semibold cursor-pointer ${
                  hourlyViewMode === 'Calls' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Calls Breakdown
              </button>
              <button
                onClick={() => setHourlyViewMode('Time')}
                className={`px-3 py-1 rounded font-semibold cursor-pointer ${
                  hourlyViewMode === 'Time' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Talk Time Breakdown
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Agent</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-center">09:00 - 10:00</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-center">10:00 - 11:00</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-center">11:00 - 12:00</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-center">12:00 - 13:00</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-center">14:00 - 15:00</th>
                  <th className="py-2.5 px-3.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {[
                  { agent: 'somnathlead_agent01', h1: 18, h2: 24, h3: 20, h4: 16, h5: 22, total: 100 },
                  { agent: 'somnathlead_agent02', h1: 22, h2: 26, h3: 28, h4: 19, h5: 24, total: 119 },
                  { agent: 'somnathlead_agent03', h1: 14, h2: 18, h3: 16, h4: 12, h5: 18, total: 78 }
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-sans font-medium text-slate-800">{row.agent}</td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-center">{row.h1}</td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-center">{row.h2}</td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-center">{row.h3}</td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-center">{row.h4}</td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-center">{row.h5}</td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-sky-700">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. DAILY AGENT PERFORMANCE */}
      {selectedReport === 'daily-performance' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
            <span className="font-bold text-xs text-slate-700">View Format:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs border border-slate-200">
              <button
                onClick={() => setDailyViewMode('Detailed')}
                className={`px-3 py-1 rounded font-semibold cursor-pointer ${
                  dailyViewMode === 'Detailed' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Detailed (Calls, Dispos, Talk, Pause)
              </button>
              <button
                onClick={() => setDailyViewMode('Consolidated')}
                className={`px-3 py-1 rounded font-semibold cursor-pointer ${
                  dailyViewMode === 'Consolidated' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Consolidated Rollup
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3.5 border-r border-slate-200">Agent Name</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-right">Total Calls</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-right">Answered</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-right">Sales / Conversions</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Login Time</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Talk Time</th>
                  <th className="py-2.5 px-3.5">Pause Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {[
                  { name: 'somnathlead_agent01@dialko.com', total: 113, answered: 85, conv: 14, login: '10:55:52', talk: '05:17:29', pause: '00:45:40' },
                  { name: 'somnathlead_agent02@dialko.com', total: 155, answered: 98, conv: 21, login: '10:56:21', talk: '05:01:53', pause: '00:50:04' },
                  { name: 'somnathlead_agent03@dialko.com', total: 92, answered: 60, conv: 9, login: '10:24:06', talk: '04:24:26', pause: '00:42:46' }
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3.5 border-r border-slate-100 font-sans font-medium text-slate-800">{row.name}</td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-right font-bold">{row.total}</td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-right text-emerald-600 font-semibold">{row.answered}</td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-right text-sky-700 font-bold">{row.conv}</td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-slate-600">{row.login}</td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-emerald-600 font-semibold">{row.talk}</td>
                    <td className="py-2.5 px-3.5 text-amber-600">{row.pause}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. AGENT ACTIVITY REPORT */}
      {selectedReport === 'agent-activity' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3.5 border-r border-slate-200">Agent</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Status</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Campaign</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">First Login</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Last Logout</th>
                <th className="py-2.5 px-3.5">Total Online</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3.5 border-r border-slate-100 font-sans text-slate-800">somnathlead_agent01</td>
                <td className="py-2.5 px-3.5 border-r border-slate-100 font-sans text-emerald-600 font-bold">ONLINE</td>
                <td className="py-2.5 px-3.5 border-r border-slate-100 font-sans">RIYA001</td>
                <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-600">09:00:15</td>
                <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-400">-</td>
                <td className="py-2.5 px-3.5 font-bold text-slate-800">07:45:12</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 7. AGENT PAUSE REPORT */}
      {selectedReport === 'agent-pause' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3.5 border-r border-slate-200">Agent</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Pause Reason</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Start Time</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">End Time</th>
                <th className="py-2.5 px-3.5">Pause Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3.5 border-r border-slate-100 font-sans text-slate-800">somnathlead_agent02</td>
                <td className="py-2.5 px-3.5 border-r border-slate-100 font-sans text-amber-700 font-semibold">Lunch Break</td>
                <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-600">13:00:10</td>
                <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-600">13:35:14</td>
                <td className="py-2.5 px-3.5 font-bold text-amber-600">00:35:04</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 8. DROPPED CALLS REPORT */}
      {selectedReport === 'dropped-calls' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3.5 border-r border-slate-200">Timestamp</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">DID Number</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Caller Phone</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Queue Name</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Wait Duration</th>
                <th className="py-2.5 px-3.5">Drop Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-600">2026-08-25 14:12:08</td>
                <td className="py-2.5 px-3.5 border-r border-slate-100 text-sky-700 font-bold">27001</td>
                <td className="py-2.5 px-3.5 border-r border-slate-100 font-medium text-slate-800">919876500000</td>
                <td className="py-2.5 px-3.5 border-r border-slate-100 font-sans">somnathlead_Incoming</td>
                <td className="py-2.5 px-3.5 border-r border-slate-100 text-rose-600 font-bold">00:00:45</td>
                <td className="py-2.5 px-3.5 font-sans text-rose-600">Caller Abandoned Before Agent Pickup</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 9. SOCIAL / WHATSAPP CHAT LOG */}
      {selectedReport === 'whatsapp-logs' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3.5 border-r border-slate-200">Date & Time</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Platform</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Sender / Phone</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Agent</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Message Content</th>
                <th className="py-2.5 px-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono text-[11px] text-slate-600">2026-08-25 15:30:10</td>
                <td className="py-2.5 px-3.5 border-r border-slate-100">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    WhatsApp Business
                  </span>
                </td>
                <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono text-sky-700">918073236368</td>
                <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-800 font-medium">somnathlead_agent01</td>
                <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-600 truncate max-w-[280px]">
                  Thank you for confirming your quotation. We have scheduled the demo.
                </td>
                <td className="py-2.5 px-3.5 text-emerald-600 font-bold">Delivered</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => {}}
        onReset={() => setSearchTerm('')}
        title="Filter Reports"
      >
        <div>
          <label className="block text-slate-700 font-bold mb-1">Date Range</label>
          <select className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs">
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="This Month">This Month</option>
          </select>
        </div>
        <div>
          <label className="block text-slate-700 font-bold mb-1">Search Keyword</label>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs"
          />
        </div>
      </FilterDrawer>

      {/* Audio Player Modal for Recordings */}
      <AudioPlayerModal
        isOpen={activeAudioModal.isOpen}
        onClose={() => setActiveAudioModal({ ...activeAudioModal, isOpen: false })}
        title={activeAudioModal.title}
        subtitle={activeAudioModal.subtitle}
        audioUrl={activeAudioModal.audioUrl}
      />
    </div>
  );
};
