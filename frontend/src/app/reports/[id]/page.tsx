import React, { Suspense } from 'react';
import ReportDetailContent from './ReportDetailContent';

interface ReportDetailPageProps {
  params: Promise<{ id: string }>;
}

async function ReportDetailWrapper({ params }: ReportDetailPageProps) {
  const { id } = await params;
  return <ReportDetailContent id={id} />;
}

export default function ReportDetailPage({ params }: ReportDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-xs text-slate-400">
          Loading intelligence report...
        </div>
      }
    >
      <ReportDetailWrapper params={params} />
    </Suspense>
  );
}
