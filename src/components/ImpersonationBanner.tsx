import React, { useState, useEffect } from 'react';
import { ShieldAlert, LogOut, Clock, Info } from 'lucide-react';
import { User, Tenant } from '../types/index.js';

interface ImpersonationBannerProps {
  currentUser?: User;
  impersonatedUser?: User | null;
  activeTenant?: Tenant;
  reason?: string;
  expiresAt?: string;
  onExit?: () => void;
  onRevert?: () => void;
}

export const ImpersonationBanner: React.FC<ImpersonationBannerProps> = ({
  currentUser,
  impersonatedUser,
  activeTenant,
  reason = 'Support troubleshooting and audio test-dial verification',
  expiresAt,
  onExit,
  onRevert
}) => {
  const activeUser = impersonatedUser || currentUser;
  const handleExit = onRevert || onExit || (() => {});

  // 15-minute session countdown (900 seconds)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (expiresAt) {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      return diff > 0 ? diff : 900;
    }
    return 900;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleExit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [handleExit]);

  if (!activeUser) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isExpiringSoon = secondsRemaining < 120; // less than 2 minutes

  return (
    <div
      id="impersonation-alert-banner"
      className={`px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md text-xs font-medium z-50 select-none border-b transition-colors ${
        isExpiringSoon
          ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
          : 'bg-amber-400 text-slate-950 border-amber-500'
      }`}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
        <div className={`p-1 rounded-full ${isExpiringSoon ? 'bg-rose-700' : 'bg-amber-600'} text-white shrink-0`}>
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2 font-semibold">
            <span>
              <strong>Support Impersonation Session Active:</strong> Acting as{' '}
              <span className="underline underline-offset-2 font-bold text-black">{activeUser.name}</span>{' '}
              <code className="bg-amber-500/40 text-slate-900 px-1 py-0.5 rounded text-[11px] font-mono">
                {activeUser.userId || activeUser.id}
              </code>
              {activeTenant?.name && (
                <span className="text-slate-800 font-normal"> under <strong>{activeTenant.name}</strong></span>
              )}
            </span>
          </div>
          {reason && (
            <div className="text-[11px] opacity-90 flex items-center gap-1">
              <Info className="w-3 h-3 shrink-0" />
              <span>Reason: <em>"{reason}"</em> • All calls operate cleanly with zero password disclosure.</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono font-bold text-xs ${
            isExpiringSoon
              ? 'bg-rose-950 text-white border border-rose-800'
              : 'bg-amber-950/15 text-slate-950 border border-amber-950/20'
          }`}
          title="Session auto-terminates when countdown expires"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{formattedTime}</span>
        </div>

        <button
          id="btn-exit-impersonation"
          onClick={handleExit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-md font-bold text-xs shadow-sm transition cursor-pointer shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>End Session & Return</span>
        </button>
      </div>
    </div>
  );
};

