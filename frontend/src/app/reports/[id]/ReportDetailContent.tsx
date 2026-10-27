'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { ReportCanvas } from '@/components/reports/ReportCanvas';
import { ArrowLeft } from 'lucide-react';

export default function ReportDetailContent({ id }: { id: string }) {
  const { reports } = useApp();

  const report = reports.find((r) => r.id === id);

  if (!report) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          Report Not Found
        </h2>
        <p className="text-xs text-slate-500">
          The requested meeting intelligence report could not be located or may have been archived.
        </p>
        <Link
          href="/reports"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to All Reports
        </Link>
      </div>
    );
  }

  return <ReportCanvas report={report} />;
}
