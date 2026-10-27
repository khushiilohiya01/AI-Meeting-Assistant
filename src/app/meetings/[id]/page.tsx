import React, { Suspense } from 'react';
import { meetings } from '@/data/meetings';
import MeetingDetailContent from './MeetingDetailContent';

export function generateStaticParams() {
  return meetings.map((m) => ({ id: m.id }));
}

interface MeetingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Loading meeting details...</div>}>
      <MeetingDetailContent id={id} />
    </Suspense>
  );
}
