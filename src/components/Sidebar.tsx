import React from 'react';
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  FileSpreadsheet,
  Activity,
  Settings,
  Wrench,
  GitFork,
  ShieldCheck,
  Radio,
  MessageSquare,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Headphones,
  Sliders,
  Calendar,
  ShieldAlert,
  Building2,
  Server
} from 'lucide-react';
import { UserRole } from '../types/index.js';

interface SidebarProps {
  activePage?: string;
  onNavigate?: (page: string, subPage?: string) => void;
  currentTab?: string;
  setCurrentTab?: (tab: string) => void;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
  userRole?: UserRole | string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage = 'dashboard',
  onNavigate,
  currentTab,
  setCurrentTab,
  collapsed = false,
  setCollapsed,
  userRole = 'Administrator'
}) => {
  const isSuperAdmin = userRole === 'SUPER_ADMIN' || userRole === 'Master Admin';
  const active = currentTab || activePage;
  const navigate = (tabId: string, subPage?: string) => {
    if (setCurrentTab) setCurrentTab(tabId);
    if (onNavigate) onNavigate(tabId, subPage);
  };

  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    crm: true,
    users: false,
    reports: false,
    realtime: false,
    configurations: false,
    customBuilder: false
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const navItemClass = (tabId: string) =>
    `flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
      active === tabId
        ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 font-semibold pl-2.5'
        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
    }`;

  const subBadgeClass = (color: string = 'bg-blue-600') =>
    `w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center text-white shrink-0 ${color}`;

  return (
    <aside
      id="dialko-sidebar"
      className={`bg-[#0F172A] text-slate-300 h-screen flex flex-col border-r border-slate-800 select-none shrink-0 transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#0B1120]">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-md shrink-0">
            D
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-tight leading-tight">DIALKO ADMIN</span>
              <span className="text-[10px] text-slate-400 font-medium">Enterprise Telephony</span>
            </div>
          )}
        </div>
        {setCollapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
          >
            {collapsed ? '→' : '←'}
          </button>
        )}
      </div>

      {/* Navigation Menu Links */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800 text-xs">
        {/* Main Section */}
        <div className="px-2 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {!collapsed && 'Main Console'}
        </div>

        {/* Dashboard */}
        <div
          id="nav-dashboard"
          onClick={() => navigate('dashboard')}
          className={navItemClass('dashboard')}
        >
          <LayoutDashboard className="w-4 h-4 text-blue-400 shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </div>

        {/* Real-time Monitoring */}
        <div
          id="nav-realtime"
          onClick={() => navigate('realtime')}
          className={navItemClass('realtime')}
        >
          <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
          {!collapsed && <span>Real-Time Monitor</span>}
        </div>

        {/* CRM Module (Order: Campaigns, Lists, Leads, Contacts, Tickets, Meetings) */}
        <div className="pt-1">
          <div
            onClick={() => toggleSection('crm')}
            className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer rounded hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-2.5">
              <PhoneCall className="w-4 h-4 text-sky-400 shrink-0" />
              {!collapsed && <span>CRM & Sales</span>}
            </div>
            {!collapsed && (openSections.crm ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />)}
          </div>

          {openSections.crm && !collapsed && (
            <div className="pl-3 pr-1 py-1 space-y-0.5 border-l border-slate-700/50 ml-4 my-0.5">
              <div id="nav-campaigns" onClick={() => navigate('campaigns')} className={navItemClass('campaigns')}>
                <span className={subBadgeClass('bg-indigo-600')}>CP</span>
                <span>Campaigns</span>
              </div>
              <div id="nav-lists" onClick={() => navigate('lists')} className={navItemClass('lists')}>
                <span className={subBadgeClass('bg-blue-600')}>LS</span>
                <span>Lists</span>
              </div>
              <div id="nav-leads" onClick={() => navigate('leads')} className={navItemClass('leads')}>
                <span className={subBadgeClass('bg-sky-600')}>LD</span>
                <span>Leads</span>
              </div>
              <div id="nav-contacts" onClick={() => navigate('contacts')} className={navItemClass('contacts')}>
                <span className={subBadgeClass('bg-teal-600')}>CT</span>
                <span>Contacts</span>
              </div>
              <div id="nav-tickets" onClick={() => navigate('tickets')} className={navItemClass('tickets')}>
                <span className={subBadgeClass('bg-amber-600')}>TK</span>
                <span>Tickets</span>
              </div>
              <div id="nav-meetings" onClick={() => navigate('meetings')} className={navItemClass('meetings')}>
                <span className={subBadgeClass('bg-purple-600')}>MT</span>
                <span>Meetings</span>
              </div>
            </div>
          )}
        </div>

        {/* Users & Team Management */}
        <div className="pt-1">
          <div
            onClick={() => toggleSection('users')}
            className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer rounded hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-purple-400 shrink-0" />
              {!collapsed && <span>User Management</span>}
            </div>
            {!collapsed && (openSections.users ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />)}
          </div>

          {openSections.users && !collapsed && (
            <div className="pl-3 pr-1 py-1 space-y-0.5 border-l border-slate-700/50 ml-4 my-0.5">
              <div id="nav-users-groups" onClick={() => navigate('users-groups')} className={navItemClass('users-groups')}>
                <span className={subBadgeClass('bg-purple-600')}>UG</span>
                <span>Users & Groups</span>
              </div>
              <div id="nav-teams" onClick={() => navigate('teams')} className={navItemClass('teams')}>
                <span className={subBadgeClass('bg-fuchsia-600')}>TM</span>
                <span>Team Management</span>
              </div>
            </div>
          )}
        </div>

        {/* Reports Section */}
        <div className="pt-1">
          <div
            onClick={() => toggleSection('reports')}
            className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer rounded hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-amber-400 shrink-0" />
              {!collapsed && <span>Analytics & Reports</span>}
            </div>
            {!collapsed && (openSections.reports ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />)}
          </div>

          {openSections.reports && !collapsed && (
            <div className="pl-3 pr-1 py-1 space-y-0.5 border-l border-slate-700/50 ml-4 my-0.5">
              <div id="nav-call-logs" onClick={() => navigate('reports', 'call-logs')} className={navItemClass('reports')}>
                <span className={subBadgeClass('bg-amber-600')}>CL</span>
                <span>Call Logs</span>
              </div>
              <div id="nav-agent-reports" onClick={() => navigate('reports', 'agent-performance')} className={navItemClass('reports')}>
                <span className={subBadgeClass('bg-orange-600')}>AG</span>
                <span>Agent Performance</span>
              </div>
              <div id="nav-dispositions" onClick={() => navigate('reports', 'dispositions')} className={navItemClass('reports')}>
                <span className={subBadgeClass('bg-yellow-600')}>DS</span>
                <span>Dispositions</span>
              </div>
            </div>
          )}
        </div>

        {/* Telephony Configurations (Queues & Ring Strategy, Dispos & Pause Codes, Blocked Numbers, Scripts) */}
        <div className="pt-1">
          <div
            onClick={() => toggleSection('configurations')}
            className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer rounded hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4 text-cyan-400 shrink-0" />
              {!collapsed && <span>Telephony Config</span>}
            </div>
            {!collapsed && (openSections.configurations ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />)}
          </div>

          {openSections.configurations && !collapsed && (
            <div className="pl-3 pr-1 py-1 space-y-0.5 border-l border-slate-700/50 ml-4 my-0.5">
              <div id="nav-config-queues" onClick={() => navigate('configurations', 'queues')} className={navItemClass('configurations')}>
                <span className={subBadgeClass('bg-cyan-600')}>QU</span>
                <span>Queues & Ring Strategy</span>
              </div>
              <div id="nav-config-dispos" onClick={() => navigate('configurations', 'dispositions')} className={navItemClass('configurations')}>
                <span className={subBadgeClass('bg-blue-600')}>DP</span>
                <span>Dispositions & Pauses</span>
              </div>
              <div id="nav-config-blocked" onClick={() => navigate('configurations', 'blocked-numbers')} className={navItemClass('configurations')}>
                <span className={subBadgeClass('bg-rose-600')}>DN</span>
                <span>Block & DNC</span>
              </div>
              <div id="nav-config-scripts" onClick={() => navigate('configurations', 'scripts')} className={navItemClass('configurations')}>
                <span className={subBadgeClass('bg-violet-600')}>SC</span>
                <span>Call Scripts</span>
              </div>
            </div>
          )}
        </div>

        {/* Custom Builder & Surveys */}
        <div
          id="nav-surveys"
          onClick={() => navigate('surveys')}
          className={navItemClass('surveys')}
        >
          <ClipboardList className="w-4 h-4 text-emerald-400 shrink-0" />
          {!collapsed && <span>Notes & Surveys</span>}
        </div>

        {/* Call Flow / IVR Builder */}
        <div
          id="nav-call-flow"
          onClick={() => navigate('call-flow')}
          className={navItemClass('call-flow')}
        >
          <GitFork className="w-4 h-4 text-blue-400 shrink-0" />
          {!collapsed && <span>Call Flow / IVR</span>}
        </div>

        {/* SMS Triggers & Automation */}
        <div
          id="nav-sms-triggers"
          onClick={() => navigate('sms-triggers')}
          className={navItemClass('sms-triggers')}
        >
          <MessageSquare className="w-4 h-4 text-teal-400 shrink-0" />
          {!collapsed && <span>SMS Automation</span>}
        </div>
      </div>

      {/* Integration Indicator Footer with Professional Polish */}
      <div className="p-3.5 mt-auto bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400">
        {!collapsed ? (
          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">SYSTEM STATUS</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs text-slate-300 font-medium">SIP Dialer Engine: Connected</span>
              </div>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400 font-mono font-bold">LIVE</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span>CRM Data Sync</span>
              <span className="text-emerald-400 font-medium">Operational</span>
            </div>
          </div>
        ) : (
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mx-auto animate-pulse" />
        )}
      </div>
    </aside>
  );
};
