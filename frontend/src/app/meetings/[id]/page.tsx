import React, { Suspense } from 'react';
import MeetingDetailContent from './MeetingDetailContent';

interface MeetingDetailPageProps {
  params: Promise<{ id: string }>;
}

async function MeetingDetailWrapper({ params }: MeetingDetailPageProps) {
  const { id } = await params;
  return <MeetingDetailContent id={id} />;
}

export default function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-xs text-slate-400">
          Loading meeting details...
        </div>
      }
    >
      <MeetingDetailWrapper params={params} />
    </Suspense>
  );
}
