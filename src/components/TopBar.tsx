import React from 'react';
import {
  ArrowLeft,
  Headphones,
  RotateCcw,
  Building2,
  UserCheck,
  LogOut,
  ChevronDown,
  PhoneCall,
  Radio,
  SlidersHorizontal,
  Volume2,
  ShieldAlert
} from 'lucide-react';
import { Tenant, User } from '../types/index.js';

interface TopBarProps {
  pageTitle?: string;
  activeTenant: Tenant;
  tenants?: Tenant[];
  onSelectTenant?: (tenant: Tenant) => void;
  currentUser?: User;
  impersonatedUser?: User | null;
  isImpersonating?: boolean;
  onExitImpersonation?: () => void;
  onRandomLiveListen: () => void;
  onRefresh?: () => void;
  onNavigate?: (page: string, subPage?: string) => void;
  onLogout?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  pageTitle = 'Dashboard',
  activeTenant,
  tenants = [],
  onSelectTenant,
  currentUser,
  impersonatedUser,
  isImpersonating,
  onExitImpersonation,
  onRandomLiveListen,
  onRefresh,
  onNavigate,
  onLogout
}) => {
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);

  const activeUser = impersonatedUser || currentUser || {
    id: 'u-1',
    name: 'Admin Supervisor',
    userId: 'admin_master',
    emailId: 'admin@dialko.com',
    role: 'SUPER_ADMIN'
  };

  const handleReload = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-xs select-none sticky top-0 z-30">
      {/* Left side: Context & Quick Breadcrumbs */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            {pageTitle.charAt(0)}
          </div>
          <span className="font-bold text-slate-800 text-sm tracking-tight">{pageTitle}</span>
          <span className="text-slate-300">/</span>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">{activeTenant.name}</span>
        </div>
      </div>

      {/* Right side: Tenant Badge, Balance, License, Random Listen, Profile */}
      <div className="flex items-center gap-3">
        {/* Tenant Information Badge (Fixed for current tenant) */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          <span className="max-w-[150px] truncate">{activeTenant.name}</span>
        </div>

        {/* User Licenses & Available Minutes Badge */}
        <div className="hidden lg:flex items-center gap-3 text-xs bg-slate-50 px-3 py-1 rounded-md border border-slate-200 text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-500">Licenses:</span>
            <span className="text-blue-600 font-bold">{activeTenant.maxUsers || 25}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-500">Minutes:</span>
            <span className="text-emerald-600 font-bold">{(activeTenant.minutesBalance || 12500).toLocaleString()} mins</span>
          </div>
        </div>

        {/* Supervisor "Random Live Call Listen" Button */}
        <button
          id="btn-random-live-listen"
          onClick={onRandomLiveListen}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition cursor-pointer"
          title="Listen to a random live active call"
        >
          <Headphones className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Listen Random Call</span>
        </button>

        {/* Refresh Page Button */}
        <button
          id="btn-refresh-page"
          onClick={handleReload}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition cursor-pointer"
          title="Refresh Data"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Direct Header Logout Button */}
        {onLogout && (
          <button
            id="btn-topbar-logout"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-xs font-semibold transition cursor-pointer"
            title="Log out of Admin Panel"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}

        {/* User Profile & Role Info */}
        <div className="relative">
          <div
            id="user-profile-menu-trigger"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 cursor-pointer p-1 rounded-md hover:bg-slate-100"
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {activeUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[110px]">
                {activeUser.name}
              </span>
              <span className="text-[10px] text-slate-500 leading-tight">{activeUser.role}</span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>

          {showUserDropdown && (
            <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-800">{activeUser.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{activeUser.emailId || activeUser.userId}</p>
                <span className="inline-block mt-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded font-semibold">
                  Role: {activeUser.role}
                </span>
              </div>

              {impersonatedUser && onExitImpersonation && (
                <button
                  onClick={() => {
                    onExitImpersonation();
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Exit Impersonation
                </button>
              )}

              {onLogout && (
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium border-t border-slate-100 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              )}

              <div className="px-3 py-1.5 text-slate-400 text-[10px] border-t border-slate-100">
                Dialko Cloud v2.1.108
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
