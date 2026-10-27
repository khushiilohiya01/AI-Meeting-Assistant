'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic,
  Monitor,
  Layers,
  Radio,
  Square,
  AlertCircle,
  Sparkles,
  Clock,
  Shield,
  Volume2,
  CheckCircle2,
  X,
  Activity,
  MessageSquare,
} from 'lucide-react';
import { captureController, CaptureState, AudioSourceMode } from '@/lib/capture';
import { useApp } from '@/context/AppContext';
import { AIPill } from '@/components/ui/Badge';

interface LiveAssistantModalProps {
  isOpen: boolean;
  meetingId: string | null;
  meetingTitle?: string;
  onClose: () => void;
}

export function LiveAssistantModal({
  isOpen,
  meetingId,
  meetingTitle = 'Live Meeting Session',
  onClose,
}: LiveAssistantModalProps) {
  const router = useRouter();
  const { showToast, refreshData } = useApp();

  const [selectedSource, setSelectedSource] = useState<AudioSourceMode>('mic');
  const [captureState, setCaptureState] = useState<CaptureState>({
    isCapturing: false,
    isFinalizing: false,
    meetingId: null,
    sessionId: null,
    elapsedSeconds: 0,
    audioSource: 'mic',
    hasTabAudio: false,
    hasMicAudio: false,
    packetsSent: 0,
    volumeLevel: 0,
    liveSegments: [],
    lastInsight: null,
    error: null,
  });

  const [insightsHistory, setInsightsHistory] = useState<{
    topics: string[];
    draftDecisions: string[];
    candidateActionItems: any[];
  }>({
    topics: [],
    draftDecisions: [],
    candidateActionItems: [],
  });

  if (!isOpen) return null;

  const handleStartCapture = async () => {
    if (!meetingId) return;

    setCaptureState((prev) => ({ ...prev, error: null, liveSegments: [] }));
    setInsightsHistory({ topics: [], draftDecisions: [], candidateActionItems: [] });

    const started = await captureController.start({
      meetingId,
      audioSource: selectedSource,
      onStateChange: (state) => {
        setCaptureState((prev) => ({ ...prev, ...state }));
        if (state.lastInsight) {
          setInsightsHistory((prev) => ({
            topics: Array.from(
              new Set([...prev.topics, ...(state.lastInsight?.topics || [])]),
            ),
            draftDecisions: Array.from(
              new Set([
                ...prev.draftDecisions,
                ...(state.lastInsight?.draftDecisions || []),
              ]),
            ),
            candidateActionItems: [
              ...prev.candidateActionItems,
              ...(state.lastInsight?.candidateActionItems || []),
            ],
          }));
        }
      },
      onReady: async (reportId) => {
        showToast('Meeting intelligence generated', 'Redirecting to report dossier', 'success');
        await refreshData();
        onClose();
        router.push(`/reports/${reportId}`);
      },
      onError: (err) => {
        showToast('Capture notice', err, 'error');
      },
    });

    if (started) {
      showToast('Assistant active', 'Listening and streaming to OpenAI Whisper...', 'info');
    }
  };

  const handleStopCapture = async () => {
    showToast('Finalizing dossier...', 'Transcribing audio and synthesizing report', 'info');
    await captureController.stop();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md"
        onClick={() => !captureState.isCapturing && !captureState.isFinalizing && onClose()}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl flex items-center justify-center ${
                captureState.isCapturing
                  ? 'bg-rose-500/10 text-rose-500 animate-pulse'
                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
              }`}
            >
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {meetingTitle}
                </h2>
                {captureState.isCapturing && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-500 text-white animate-pulse">
                    Live Recording
                  </span>
                )}
                {captureState.isFinalizing && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500 text-white animate-spin">
                    Finalizing
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                AI Note-Taker & Action Item Extractor (Powered by OpenAI)
              </p>
            </div>
          </div>

          {!captureState.isCapturing && !captureState.isFinalizing && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Status Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 my-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs">
          <div className="px-3">
            <span className="text-[11px] font-medium text-slate-400 block uppercase">
              Capture Status
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
              {captureState.isFinalizing
                ? 'Synthesizing...'
                : captureState.isCapturing
                ? 'Streaming Audio'
                : 'Standby'}
            </span>
          </div>

          <div className="px-3 sm:border-l border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] font-medium text-slate-400 block uppercase">
              Elapsed Time
            </span>
            <div className="flex items-center gap-1 font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>{formatTimer(captureState.elapsedSeconds)}</span>
            </div>
          </div>

          <div className="px-3 sm:border-l border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] font-medium text-slate-400 block uppercase">
              Audio Source
            </span>
            <span className="text-slate-700 dark:text-slate-300 font-medium mt-0.5 block truncate">
              {captureState.isCapturing
                ? captureState.audioSource === 'mic'
                  ? 'Microphone'
                  : captureState.audioSource === 'tab'
                  ? 'Meeting Tab'
                  : 'Tab + Microphone'
                : selectedSource === 'mic'
                ? 'Microphone'
                : selectedSource === 'tab'
                ? 'Meeting Tab'
                : 'Tab + Microphone'}
            </span>
          </div>

          <div className="px-3 sm:border-l border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] font-medium text-slate-400 block uppercase">
              AI Models
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Whisper + GPT-4o
            </span>
          </div>
        </div>

        {/* Live Audio Level Meter (Active during capture) */}
        {captureState.isCapturing && (
          <div className="p-3 my-3 rounded-xl bg-slate-900 text-white border border-slate-800 text-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="font-semibold text-slate-200">
                  Audio Input Monitor
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">
                {captureState.volumeLevel > 5
                  ? `Active Signal: ${captureState.volumeLevel}%`
                  : 'Silence / Speak into mic'}
              </span>
            </div>

            {/* Bouncing Level Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-75 rounded-full ${
                  captureState.volumeLevel > 15
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400'
                    : 'bg-slate-700'
                }`}
                style={{ width: `${Math.max(4, Math.min(100, captureState.volumeLevel))}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Notice */}
        {captureState.error && (
          <div className="p-3 my-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div>
              <p className="font-semibold">Capture Configuration Warning</p>
              <p className="mt-0.5 leading-relaxed">{captureState.error}</p>
            </div>
          </div>
        )}

        {/* Pre-flight Controls / Options (When not capturing) */}
        {!captureState.isCapturing && !captureState.isFinalizing && (
          <div className="py-2 space-y-4 text-xs">
            {/* Audio Source Selector */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] block">
                Select Audio Input Source
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Option 1: Microphone */}
                <button
                  type="button"
                  onClick={() => setSelectedSource('mic')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedSource === 'mic'
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                      : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    <Mic className="w-4 h-4 text-blue-500" />
                    <span>Microphone</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Recommended. Speak into your mic or capture room audio. No screen share required.
                  </p>
                </button>

                {/* Option 2: Meeting Tab */}
                <button
                  type="button"
                  onClick={() => setSelectedSource('tab')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedSource === 'tab'
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                      : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    <Monitor className="w-4 h-4 text-purple-500" />
                    <span>Meeting Tab</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Share audio from a Google Meet, Zoom, or Teams browser tab. (Check &quot;Share tab audio&quot;).
                  </p>
                </button>

                {/* Option 3: Both */}
                <button
                  type="button"
                  onClick={() => setSelectedSource('both')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedSource === 'both'
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                      : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    <Layers className="w-4 h-4 text-emerald-500" />
                    <span>Both (Mixed)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Simultaneously captures meeting attendees and your local mic speech.
                  </p>
                </button>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  How Audio Capture Works
                </span>
                <span>
                  Audio is streamed in 24kHz PCM chunks to your local backend, transcribed with OpenAI Whisper, and analyzed by GPT-4o for structured action items and decision memory.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartCapture}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all font-semibold shadow-lg shadow-blue-500/25"
              >
                <Radio className="w-4 h-4" />
                <span>Start Meeting Assistant</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Telemetry View (During Capture) */}
        {captureState.isCapturing && (
          <div className="py-2 space-y-4 text-xs">
            {/* Live Transcript Stream Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                    Live Transcribed Turns ({captureState.liveSegments.length})
                  </span>
                </div>
                <AIPill>OpenAI Whisper</AIPill>
              </div>

              {captureState.liveSegments.length > 0 ? (
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {captureState.liveSegments.map((seg, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs leading-relaxed flex items-start gap-2"
                    >
                      <span className="text-[10px] font-mono text-blue-500 font-bold shrink-0 mt-0.5">
                        #{seg.sequenceNumber}
                      </span>
                      <span>{seg.text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-xs italic py-2">
                  Acoustic stream active. Transcribed speech turns will populate here as you speak (interim Whisper updates every 12 seconds).
                </p>
              )}
            </div>

            {/* Live Insights Section */}
            {(insightsHistory.topics.length > 0 || insightsHistory.draftDecisions.length > 0) && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                    Proactive Telemetry
                  </span>
                </div>

                {insightsHistory.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {insightsHistory.topics.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-blue-100/70 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium text-[11px]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Packets sent: {captureState.packetsSent}</span>
              </div>

              <button
                type="button"
                onClick={handleStopCapture}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all font-semibold shadow-lg shadow-rose-500/25"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop Assistant & Generate Dossier</span>
              </button>
            </div>
          </div>
        )}

        {/* Finalizing State */}
        {captureState.isFinalizing && (
          <div className="py-8 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Synthesizing Executive Dossier
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              OpenAI is processing the finalized transcript, resolving cross-meeting memory, and extracting structured action items...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
