import React, { Suspense } from 'react';
import { reports } from '@/data/reports';
import ReportDetailContent from './ReportDetailContent';

export function generateStaticParams() {
  return reports.map((r) => ({ id: r.id }));
}

interface ReportDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Loading intelligence report...</div>}>
      <ReportDetailContent id={id} />
    </Suspense>
  );
}
