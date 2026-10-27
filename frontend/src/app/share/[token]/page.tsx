'use client';

import React, { useEffect, useState, use } from 'react';
import { ReportCanvas } from '@/components/reports/ReportCanvas';
import * as api from '@/lib/api';
import { ArrowLeft, ShieldAlert, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default function PublicSharePage({ params }: SharePageProps) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [shareData, setShareData] = useState<{
    share: { id: string; includeTranscript: boolean; expiresAt: string | null };
    report: Parameters<typeof ReportCanvas>[0]['report'];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let isCancelled = false;
    api
      .getPublicShare(token)
      .then((data) => {
        if (!isCancelled) {
          setShareData(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err.message || 'Share link is invalid, expired, or revoked.');
        }
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [token]);

  if (isLoading) {
    return (
      <div className="py-24 text-center max-w-md mx-auto space-y-3">
        <div className="w-8 h-8 mx-auto rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <p className="text-xs text-slate-400">Loading verified intelligence dossier...</p>
      </div>
    );
  }

  if (error || !shareData?.report) {
    return (
      <div className="py-24 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Access Restricted
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {error || 'This shared intelligence report could not be accessed.'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to MeetTrack AI
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Public Banner */}
      <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-800/40 text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span>Verified Public Dossier · Shared via MeetTrack AI</span>
        </div>
        <span className="text-[11px] font-mono opacity-70">Read-Only</span>
      </div>

      <ReportCanvas report={shareData.report} />
    </div>
  );
}
