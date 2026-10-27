'use client';

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  FileCode,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getCalendarIcsUrl } from '@/lib/api';

interface ConnectCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectCalendarModal({ isOpen, onClose }: ConnectCalendarModalProps) {
  const { showToast } = useApp();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const icsUrl = getCalendarIcsUrl();

  const handleDownloadIcs = () => {
    window.open(icsUrl, '_blank');
    showToast('Downloading iCalendar file', 'Import .ics into Google Calendar or Outlook', 'success');
  };

  const handleCopyFeed = () => {
    navigator.clipboard.writeText(icsUrl);
    setCopied(true);
    showToast('Calendar feed URL copied', 'Add as a subscription calendar', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Calendar Integration & Export
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Working .ics Local Export Card */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Local iCalendar (.ics) Sync
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Export all scheduled meetings and task deadlines as a standard RFC 5545 iCalendar file compatible with Apple Calendar, Google Calendar, and Microsoft Outlook.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadIcs}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .ics File</span>
              </button>
              <button
                type="button"
                onClick={handleCopyFeed}
                className="flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
                title="Copy Calendar Feed URL"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Feed URL'}</span>
              </button>
            </div>
          </div>

          {/* Cloud OAuth Sync Status */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Cloud OAuth 2.0 Provider
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                Unconfigured
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Automatic background bot auto-joining via Google Calendar or Microsoft Graph OAuth requires client credentials in backend/.env. Local .ics export is active and recommended for single-user workflows.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
