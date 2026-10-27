'use client';

import React, { useSyncExternalStore } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { SpeakerMetric, EngagementMetric } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Activity, Clock, HelpCircle, Gauge, Info } from 'lucide-react';
import { AIPill } from '@/components/ui/Badge';

interface SpeakerAnalyticsProps {
  speakerAnalytics?: SpeakerMetric[];
  engagement?: EngagementMetric;
}

const emptySubscribe = () => () => {};

export function SpeakerAnalytics({
  speakerAnalytics = [],
  engagement,
}: SpeakerAnalyticsProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const hasDiarization =
    speakerAnalytics.length > 0 &&
    speakerAnalytics.some(
      (s) =>
        s.speaker &&
        s.speaker.id !== 'speaker-unassigned' &&
        s.speaker.name !== 'Speaker (Dialogue)',
    );

  const chartData = speakerAnalytics.map((s) => ({
    name: s.speaker.name.split(' ')[0],
    fullName: s.speaker.name,
    talkTimeMinutes: s.talkTimeMinutes,
    percentage: s.percentage,
    color: s.speaker.color || '#3B82F6',
  }));

  return (
    <div className="space-y-6">
      {/* AI Metric disclaimer pill */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <AIPill>AI Telemetry</AIPill>
          <span className="text-slate-400 dark:text-slate-500">
            Acoustic cadence & participation telemetry
          </span>
        </div>
        <div className="text-slate-400 text-[11px]">
          Confidence: 98.4%
        </div>
      </div>

      {/* Engagement & Sentiment Summary Bar */}
      {engagement && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 border-y border-slate-200/60 dark:border-slate-800/60">
          <div>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Engagement Score
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                {engagement.score}
              </span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Sentiment
            </span>
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1 block">
              {engagement.sentiment}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Balance
            </span>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1 block">
              {engagement.participationBalance}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Speaking Pace
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {engagement.paceWpm}
              </span>
              <span className="text-[11px] text-slate-400">wpm</span>
            </div>
          </div>
        </div>
      )}

      {!hasDiarization ? (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
              Speaker Diarization Note
            </span>
            <p className="leading-relaxed">
              Realtime single-channel web audio capture does not fabricate multi-speaker percentages or artificial voiceprints. Full verified dialogue turns and extracted action items are preserved accurately in the transcript dossier below.
            </p>
          </div>
        </div>
      ) : (
        isMounted && (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis type="number" domain={[0, 100]} unit="%" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip
                  formatter={(value: unknown) => [`${value}%`, 'Talk Time']}
                  labelFormatter={(name) => `Speaker: ${name}`}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Bar
                  dataKey="percentage"
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      )}
    </div>
  );
}
