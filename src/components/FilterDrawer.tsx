import React from 'react';
import { X, Filter as FilterIcon, RotateCcw } from 'lucide-react';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  title?: string;
  children: React.ReactNode;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  onApply,
  onReset,
  title = 'Filter',
  children
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-[#0284c7] text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <FilterIcon className="w-4 h-4" />
              <h2 className="text-sm font-bold tracking-wide">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-md transition text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs custom-scrollbar">
            {children}
          </div>

          {/* Footer Actions */}
          <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onReset}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => {
                onApply();
                onClose();
              }}
              className="px-5 py-1.5 text-xs font-bold text-white bg-[#0284c7] hover:bg-[#0369a1] rounded shadow transition cursor-pointer"
            >
              Filter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
