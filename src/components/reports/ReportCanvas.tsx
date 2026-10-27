'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MeetingReport } from '@/types';
import { Avatar, AvatarGroup } from '@/components/ui/Avatar';
import { PlatformBadge, AIPill } from '@/components/ui/Badge';
import {
  Download,
  Share2,
  Copy,
  Check,
  Calendar,
  Clock,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  BookmarkCheck,
  ChevronRight,
} from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { downloadReportPDF } from '@/lib/pdf';
import { SpeakerAnalytics } from './SpeakerAnalytics';
import { ActionItemsTable } from './ActionItemsTable';
import { TranscriptViewer } from './TranscriptViewer';
import { ShareModal } from './ShareModal';

interface ReportCanvasProps {
  report: MeetingReport;
}

const reportSections = [
  { id: 'summary', label: 'Executive Summary' },
  { id: 'topics', label: 'Discussion Topics' },
  { id: 'decisions', label: 'Key Decisions' },
  { id: 'actions', label: 'Action Items' },
  { id: 'analytics', label: 'Speaker Analytics' },
  { id: 'transcript', label: 'Full Transcript' },
];

export function ReportCanvas({ report }: ReportCanvasProps) {
  const { showToast } = useApp();
  const [activeSection, setActiveSection] = useState('summary');
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (const section of reportSections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopySummary = () => {
    const textToCopy = `Executive Summary — ${report.title} (${report.date})\n\n${report.summary}\n\nKey Takeaways:\n${report.keyTakeaways.map((k) => `• ${k}`).join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedSummary(true);
    showToast('Executive summary copied', 'Formatted with key takeaways', 'success');
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true);
    showToast('Preparing PDF export...', 'Rendering printable report view', 'info');
    try {
      await downloadReportPDF(report.title, report.date);
      showToast('PDF export launched', undefined, 'success');
    } catch {
      showToast('Failed to generate PDF', 'Please check browser print settings', 'error');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  return (
    <div className="relative">
      {/* Back button & Breadcrumb */}
      <div className="no-print flex items-center justify-between pb-4 mb-4 border-b border-slate-200/60 dark:border-slate-800/60">
        <Link
          href="/reports"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Reports</span>
        </Link>
        <span className="text-xs text-slate-400">
          Report ID: <span className="font-mono">{report.id}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sticky Local Section Navigator (Desktop left/rail) */}
        <div className="no-print hidden lg:block lg:col-span-3 sticky top-24 space-y-4">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block px-2 mb-2">
              Report Sections
            </span>
            {reportSections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollTo(sec.id)}
                className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-all flex items-center justify-between ${
                  activeSection === sec.id
                    ? 'font-medium text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>{sec.label}</span>
                {activeSection === sec.id && (
                  <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
                )}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 px-2 space-y-2 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Meeting Metadata
            </span>
            <div className="text-slate-600 dark:text-slate-400 space-y-1 text-[11px]">
              <p>Platform: {report.platform}</p>
              <p>Duration: {formatDuration(report.durationMinutes)}</p>
              <p>Attendees: {report.participants.length} members</p>
            </div>
          </div>
        </div>

        {/* Main Readable Report Canvas */}
        <div className="lg:col-span-9 max-w-3xl space-y-10">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <PlatformBadge platform={report.platform} />
              <AIPill>Verified Intelligence</AIPill>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {report.date} at {report.startTime}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {formatDuration(report.durationMinutes)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {report.title}
            </h1>

            {/* Attendees Avatar Group & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-3">
                <AvatarGroup participants={report.participants} max={5} size="sm" />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {report.participants.map((p) => p.name.split(' ')[0]).join(', ')}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="no-print flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {copiedSummary ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedSummary ? 'Copied' : 'Copy Summary'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsShareOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={isDownloadingPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-500/20 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloadingPDF ? 'Generating...' : 'Download PDF'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 1: Executive AI Summary */}
          <section id="summary" className="space-y-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Executive Summary</span>
              </h2>
              <AIPill>AI Synthesized</AIPill>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
              {report.summary}
            </p>

            {/* Key Takeaways list */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Key Strategic Takeaways
              </span>
              <ul className="space-y-2">
                {report.keyTakeaways.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Section 2: Discussion Topics */}
          <section id="topics" className="space-y-4 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Key Discussion Points
              </h2>
              <span className="text-xs text-slate-400">
                {report.topics.length} core agenda tracks
              </span>
            </div>

            <div className="space-y-6">
              {report.topics.map((topic, index) => (
                <div key={topic.id} className="space-y-2 print-avoid-break">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      0{index + 1}.
                    </span>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {topic.title}
                    </h3>
                    {topic.timestamp && (
                      <span className="text-[11px] font-mono text-slate-400 ml-auto">
                        @{topic.timestamp}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {topic.summary}
                  </p>

                  <ul className="space-y-1.5 pl-4 border-l-2 border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    {topic.bullets.map((b, i) => (
                      <li key={i} className="leading-relaxed">
                        • {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Decisions */}
          <section id="decisions" className="space-y-4 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Decisions Locked
              </h2>
              <span className="text-xs text-slate-400">
                {report.decisions.length} recorded
              </span>
            </div>

            <div className="space-y-3">
              {report.decisions.map((dec) => (
                <div
                  key={dec.id}
                  className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 flex items-start gap-3 print-avoid-break"
                >
                  <BookmarkCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                      {dec.decision}
                    </p>
                    {dec.context && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Rationale: {dec.context}
                      </p>
                    )}
                    {dec.owner && (
                      <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                        <span>Lead:</span>
                        <Avatar participant={dec.owner} size="xs" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {dec.owner.name}
                        </span>
                        {dec.timestamp && <span>· @{dec.timestamp}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Action Items */}
          <section id="actions" className="space-y-4 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Action Items
              </h2>
            </div>
            <ActionItemsTable actionItemIds={report.actionItemIds} />
          </section>

          {/* Section 5: Speaker Analytics & Sentiment */}
          <section id="analytics" className="space-y-4 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Speaker & Engagement Telemetry
              </h2>
            </div>
            <SpeakerAnalytics
              speakerAnalytics={report.speakerAnalytics}
              engagement={report.engagement}
            />
          </section>

          {/* Section 6: Searchable Transcript */}
          <section id="transcript" className="space-y-4 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Meeting Transcript
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Searchable turn-by-turn dialogue with speaker attribution
                </p>
              </div>
            </div>
            <TranscriptViewer
              transcript={report.transcript}
              participants={report.participants}
            />
          </section>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        reportTitle={report.title}
      />
    </div>
  );
}
