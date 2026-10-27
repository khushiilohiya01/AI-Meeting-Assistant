'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Globe, Share2, ShieldCheck, RefreshCw } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import * as api from '@/lib/api';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  reportTitle: string;
}

export function ShareModal(props: ShareModalProps) {
  if (!props.isOpen) return null;
  return <ShareModalContent key={`${props.reportId}`} {...props} />;
}

function ShareModalContent({ onClose, reportId, reportTitle }: ShareModalProps) {
  const { showToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [includeTranscript, setIncludeTranscript] = useState(true);
  const [shareUrl, setShareUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [shareError, setShareError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    api
      .createShare(reportId, { includeTranscript, expiryHours: 168 })
      .then((res) => {
        if (!isCancelled) {
          const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
          setShareUrl(`${origin}/share/${res.publicToken}`);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn('Share creation error:', err);
          setShareError('Failed to generate secure share link on backend.');
        }
      })
      .finally(() => {
        if (!isCancelled) setIsGenerating(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [reportId, includeTranscript]);

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast('Share link copied to clipboard', 'Anyone with the link can view this dossier', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share && shareUrl) {
      try {
        await navigator.share({
          title: reportTitle,
          text: `Check out the AI meeting summary for "${reportTitle}"`,
          url: shareUrl,
        });
        showToast('Shared successfully', undefined, 'success');
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Share Intelligence Report
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            Anyone with this secure unguessable link can view this intelligence report without needing an account.
          </p>

          {/* Link box */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <Globe className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="flex-1 truncate font-mono text-[11px] text-slate-700 dark:text-slate-300">
              {isGenerating ? 'Generating token hash...' : shareUrl || 'No share token'}
            </span>
            <button
              onClick={handleCopy}
              disabled={isGenerating || !shareUrl}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors shrink-0 flex items-center gap-1 disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {shareError && (
            <p className="text-xs text-rose-500">{shareError}</p>
          )}

          {/* Privacy & Scope Options */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center justify-between cursor-pointer py-1">
              <div>
                <span className="font-medium text-slate-800 dark:text-slate-200 block">
                  Include Full Transcript
                </span>
                <span className="text-[11px] text-slate-400">
                  Allow recipients to read searchable dialogue turns
                </span>
              </div>
              <input
                type="checkbox"
                checked={includeTranscript}
                onChange={(e) => setIncludeTranscript(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </label>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Token hash stored in SQLite. Public token is unguessable & revocable.</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleNativeShare}
              disabled={isGenerating || !shareUrl}
              className="w-full py-2 text-center text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Open System Share Sheet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
