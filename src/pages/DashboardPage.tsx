import React from 'react';
import {
  RotateCcw,
  Users,
  PhoneCall,
  PhoneIncoming,
  PhoneForwarded,
  Activity,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Search,
  Filter,
  Shield,
  Check
} from 'lucide-react';
import { Tenant } from '../types/index.js';

interface DashboardPageProps {
  activeTenant: Tenant;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ activeTenant }) => {
  const [timeRange, setTimeRange] = React.useState('Today');
  const [selectedCampaign, setSelectedCampaign] = React.useState('ALL');
  const [isLiveRefreshing, setIsLiveRefreshing] = React.useState(true);

  // Live Agent Statuses
  const liveAgents = [
    { id: 'somnathlead_agent01', name: 'Somnath Lead 1', campaign: 'RIYA001', status: 'ON_CALL', customer: '918073236368', duration: '03:42', callsHandled: 85, sales: 12 },
    { id: 'somnathlead_agent02', name: 'Somnath Lead 2', campaign: 'MAHI002', status: 'ON_CALL', customer: '919845012345', duration: '01:15', callsHandled: 98, sales: 15 },
    { id: 'somnathlead_agent03', name: 'Somnath Lead 3', campaign: 'RIYA001', status: 'READY', customer: '-', duration: '00:24', callsHandled: 60, sales: 8 },
    { id: 'somnathlead_agent04', name: 'Somnath Lead 4', campaign: 'NISHA 005', status: 'PAUSED', pauseReason: 'Tea Break', duration: '04:12', callsHandled: 42, sales: 5 },
    { id: 'somnathlead_agent05', name: 'Somnath Lead 5', campaign: 'RIYA001', status: 'ON_CALL', customer: '917760192834', duration: '05:10', callsHandled: 40, sales: 6 },
    { id: 'somnathlead_agent06', name: 'Somnath Lead 6', campaign: 'MAHI002', status: 'PAUSED', pauseReason: 'Lunch', duration: '18:40', callsHandled: 36, sales: 4 },
    { id: 'somnathlead_agent07', name: 'Somnath Lead 7', campaign: 'RIYA001', status: 'READY', customer: '-', duration: '01:05', callsHandled: 28, sales: 3 },
    { id: 'somnathlead_agent08', name: 'Somnath Lead 8', campaign: 'Sales_Outbound_Q4', status: 'ON_CALL', customer: '919900112233', duration: '02:30', callsHandled: 512, sales: 64 }
  ];

  // Campaign Metrics
  const campaignSummaries = [
    { name: 'RIYA001', type: 'PREDICTIVE', totalCalls: 265, answered: 198, connectRate: '74.7%', sales: 26, avgTalkTime: '3m 12s', inboundStatus: 'Block' },
    { name: 'MAHI002', type: 'PREVIEW', totalCalls: 191, answered: 134, connectRate: '70.1%', sales: 19, avgTalkTime: '4m 05s', inboundStatus: 'Allow' },
    { name: 'NISHA 005', type: 'PREDICTIVE', totalCalls: 84, answered: 56, connectRate: '66.6%', sales: 7, avgTalkTime: '2m 45s', inboundStatus: 'Block' },
    { name: 'Sales_Outbound_Q4', type: 'PREDICTIVE', totalCalls: 735, answered: 512, connectRate: '69.6%', sales: 64, avgTalkTime: '3m 48s', inboundStatus: 'Allow' }
  ];

  // Disposition Breakdown Data
  const dispositionsData = [
    { dispo: 'SALE', count: 116, percentage: 12.8, color: 'bg-emerald-500' },
    { dispo: 'INTERESTED', count: 184, percentage: 20.3, color: 'bg-sky-500' },
    { dispo: 'CALLBACK', count: 242, percentage: 26.7, color: 'bg-amber-500' },
    { dispo: 'NOT_INTERESTED', count: 290, percentage: 32.0, color: 'bg-slate-400' },
    { dispo: 'DNC', count: 74, percentage: 8.2, color: 'bg-rose-500' }
  ];

  const hourlyTrends = [
    { hour: '09:00', calls: 42, connected: 31 },
    { hour: '10:00', calls: 98, connected: 72 },
    { hour: '11:00', calls: 145, connected: 112 },
    { hour: '12:00', calls: 168, connected: 124 },
    { hour: '13:00', calls: 110, connected: 78 },
    { hour: '14:00', calls: 154, connected: 115 },
    { hour: '15:00', calls: 172, connected: 129 },
    { hour: '16:00', calls: 189, connected: 142 },
    { hour: '17:00', calls: 140, connected: 104 }
  ];

  const maxHourlyCalls = Math.max(...hourlyTrends.map(h => h.calls));

  return (
    <div id="dashboard-page-container" className="p-4 space-y-4 select-none max-w-7xl mx-auto">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            <BarChart3 className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">Telephony Operations Dashboard</h2>
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Sync
              </span>
            </div>
            <span className="text-xs text-slate-500">Real-time VICIdial telephony telemetry, call traffic, and agent productivity</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
            {['Today', 'Yesterday', 'Last 7 Days'].map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  timeRange === r ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={() => window.location.reload()}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 cursor-pointer transition-colors"
            title="Refresh Metrics"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Calls */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span className="font-semibold">Total Calls Dialed</span>
            <PhoneCall className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 font-mono">1,275</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +14.2% vs yesterday
          </div>
        </div>

        {/* Answered Calls */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span className="font-semibold">Connected Calls</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">900</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Overall Connect Rate: <strong className="text-emerald-700">70.5%</strong>
          </div>
        </div>

        {/* Converted Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span className="font-semibold">Sales / Conversions</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 font-mono">116</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Conversion Ratio: <strong className="text-purple-700">12.8%</strong>
          </div>
        </div>

        {/* Active Agents */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span className="font-semibold">Active Agents</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 font-mono">8 / 10</div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-1">
            4 on call • 2 ready • 2 paused
          </div>
        </div>

        {/* Avg Talk Time */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span className="font-semibold">Avg Talk Time (ATT)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 font-mono">03:32</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Wrap-up avg: <strong className="text-slate-700">14 sec</strong>
          </div>
        </div>
      </div>

      {/* Main Grid: Hourly Activity & Disposition Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hourly Call Traffic Bar Chart */}
        <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Hourly Call Traffic & Connection Trend</h3>
              <p className="text-xs text-slate-500">Distribution of dialed calls vs answered calls throughout the shift</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-sky-200"></span>
                <span className="text-slate-600">Dialed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-sky-600"></span>
                <span className="text-slate-800 font-bold">Connected</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="grid grid-cols-9 gap-3 items-end h-48 pt-4 pb-2 border-b border-slate-100">
            {hourlyTrends.map(h => {
              const totalHeight = (h.calls / maxHourlyCalls) * 100;
              const connectedHeight = (h.connected / maxHourlyCalls) * 100;

              return (
                <div key={h.hour} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="text-[10px] font-mono text-slate-400 group-hover:text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                    {h.connected}/{h.calls}
                  </div>
                  <div className="w-full max-w-[28px] bg-sky-100 rounded-t-md relative flex flex-col justify-end overflow-hidden" style={{ height: `${totalHeight}%` }}>
                    <div className="w-full bg-sky-600 rounded-t-xs transition-all" style={{ height: `${(connectedHeight / totalHeight) * 100}%` }}></div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{h.hour}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Disposition Breakdown */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Disposition Breakdown</h3>
            <p className="text-xs text-slate-500 mb-4">Summary of categorized call outcomes</p>

            <div className="space-y-3">
              {dispositionsData.map(d => (
                <div key={d.dispo} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-700">{d.dispo}</span>
                    <span className="text-slate-500 font-mono">
                      <strong>{d.count}</strong> ({d.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`${d.color} h-full rounded-full`} style={{ width: `${d.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Positive Outcome Rate:</span>
            <strong className="text-emerald-700">33.1% (Sales + Interested)</strong>
          </div>
        </div>
      </div>

      {/* Live Agent Operational Status Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Live Agent Floor Monitor</h3>
            <p className="text-xs text-slate-500">Real-time status of connected agents, active calls, and break times</p>
          </div>
          <span className="text-xs text-slate-500 font-mono">8 Active Agents</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white text-slate-600 font-bold border-b border-slate-200">
                <th className="py-2.5 px-4 border-r border-slate-100">Agent ID / Name</th>
                <th className="py-2.5 px-4 border-r border-slate-100">Campaign</th>
                <th className="py-2.5 px-4 border-r border-slate-100 text-center">Live Status</th>
                <th className="py-2.5 px-4 border-r border-slate-100">Customer Phone</th>
                <th className="py-2.5 px-4 border-r border-slate-100 text-center">State Duration</th>
                <th className="py-2.5 px-4 border-r border-slate-100 text-right">Calls Handled</th>
                <th className="py-2.5 px-4 text-right">Conversions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {liveAgents.map(ag => (
                <tr key={ag.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 border-r border-slate-100 font-medium text-slate-800">
                    <div className="font-bold">{ag.name}</div>
                    <span className="text-[10px] text-slate-400 font-mono">{ag.id}</span>
                  </td>
                  <td className="py-2.5 px-4 border-r border-slate-100 font-mono text-sky-700 font-semibold">
                    {ag.campaign}
                  </td>
                  <td className="py-2.5 px-4 border-r border-slate-100 text-center">
                    {ag.status === 'ON_CALL' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ● On Call
                      </span>
                    )}
                    {ag.status === 'READY' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        ● Ready
                      </span>
                    )}
                    {ag.status === 'PAUSED' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        ❚❚ {ag.pauseReason || 'Paused'}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 border-r border-slate-100 font-mono text-slate-700">
                    {ag.customer !== '-' ? ag.customer : <span className="text-slate-400">-</span>}
                  </td>
                  <td className="py-2.5 px-4 border-r border-slate-100 text-center font-mono font-bold text-slate-700">
                    {ag.duration}
                  </td>
                  <td className="py-2.5 px-4 border-r border-slate-100 text-right font-mono font-bold text-slate-800">
                    {ag.callsHandled}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                    {ag.sales}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Performance Summary Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Campaign Operational Summary</h3>
            <p className="text-xs text-slate-500">Performance and throughput grouped by campaign</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white text-slate-600 font-bold border-b border-slate-200">
                <th className="py-2.5 px-4 border-r border-slate-100">Campaign Name</th>
                <th className="py-2.5 px-4 border-r border-slate-100">Dialer Type</th>
                <th className="py-2.5 px-4 border-r border-slate-100 text-right">Total Calls</th>
                <th className="py-2.5 px-4 border-r border-slate-100 text-right">Answered</th>
                <th className="py-2.5 px-4 border-r border-slate-100 text-center">Connect Rate</th>
                <th className="py-2.5 px-4 border-r border-slate-100 text-right">Conversions</th>
                <th className="py-2.5 px-4 border-r border-slate-100 text-center">Avg Talk Time</th>
                <th className="py-2.5 px-4 text-center">Inbound Setting</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {campaignSummaries.map(c => (
                <tr key={c.name} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 border-r border-slate-100 font-bold text-sky-700">{c.name}</td>
                  <td className="py-2.5 px-4 border-r border-slate-100">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {c.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 border-r border-slate-100 text-right font-mono font-bold text-slate-800">{c.totalCalls}</td>
                  <td className="py-2.5 px-4 border-r border-slate-100 text-right font-mono text-emerald-600 font-semibold">{c.answered}</td>
                  <td className="py-2.5 px-4 border-r border-slate-100 text-center font-mono font-bold text-slate-700">{c.connectRate}</td>
                  <td className="py-2.5 px-4 border-r border-slate-100 text-right font-mono font-bold text-purple-700">{c.sales}</td>
                  <td className="py-2.5 px-4 border-r border-slate-100 text-center font-mono text-slate-600">{c.avgTalkTime}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.inboundStatus === 'Allow' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {c.inboundStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
