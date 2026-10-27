'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { SpeakerMetric, EngagementMetric } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Activity, Clock, HelpCircle, Gauge } from 'lucide-react';
import { AIPill } from '@/components/ui/Badge';

interface SpeakerAnalyticsProps {
  speakerAnalytics: SpeakerMetric[];
  engagement: EngagementMetric;
}

export function SpeakerAnalytics({
  speakerAnalytics,
  engagement,
}: SpeakerAnalyticsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = speakerAnalytics.map((s) => ({
    name: s.speaker.name.split(' ')[0],
    fullName: s.speaker.name,
    talkTimeMinutes: s.talkTimeMinutes,
    percentage: s.percentage,
    color: s.speaker.color,
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

      {/* Engagement qualitative explanation */}
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
        &ldquo;{engagement.explanation}&rdquo;
      </p>

      {/* Talk Time Distribution Visualization */}
      <div className="pt-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
          Talk-Time Breakdown
        </h4>

        {isMounted ? (
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  unit="%"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip
                  formatter={(value: any) => [`${value}%`, 'Talk Time']}
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
                  barSize={14}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-44 flex items-center justify-center text-xs text-slate-400">
            Loading chart telemetry...
          </div>
        )}
      </div>

      {/* Speaker Breakdown Table */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 pt-2">
        {speakerAnalytics.map((item) => (
          <div
            key={item.speaker.id}
            className="py-2.5 flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2.5">
              <Avatar participant={item.speaker} size="sm" />
              <div>
                <span className="font-medium text-slate-900 dark:text-slate-100 block">
                  {item.speaker.name}
                </span>
                <span className="text-[11px] text-slate-400">
                  {item.speaker.role}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {item.talkTimeMinutes.toFixed(1)}m
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {item.percentage}%
                </span>
              </div>

              {item.wordsPerMinute && (
                <div className="text-right hidden sm:block">
                  <span className="text-slate-600 dark:text-slate-400">
                    {item.wordsPerMinute} wpm
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {item.questionsAsked} questions
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
