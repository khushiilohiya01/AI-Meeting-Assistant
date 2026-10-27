'use client';

import React, { useState } from 'react';
import { TranscriptTurn, Participant } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Search, Play, HelpCircle, AlertCircle, Copy, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface TranscriptViewerProps {
  transcript: TranscriptTurn[];
  participants: Participant[];
}

export function TranscriptViewer({
  transcript,
  participants,
}: TranscriptViewerProps) {
  const { showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>('all');
  const [activeTurnId, setActiveTurnId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredTurns = transcript.filter((turn) => {
    const matchesSpeaker =
      selectedSpeakerId === 'all' || turn.speaker.id === selectedSpeakerId;
    const matchesText =
      !searchQuery.trim() ||
      turn.text.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      turn.speaker.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchesSpeaker && matchesText;
  });

  const handleCopyQuote = (turn: TranscriptTurn) => {
    navigator.clipboard.writeText(`"${turn.text}" — ${turn.speaker.name} (${turn.timestamp})`);
    setCopiedId(turn.id);
    showToast('Quote copied to clipboard', undefined, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleJumpToTime = (turn: TranscriptTurn) => {
    setActiveTurnId(turn.id);
    showToast(`Jumped to ${turn.timestamp}`, `${turn.speaker.name}'s turn`, 'info');
  };

  return (
    <div className="space-y-4">
      {/* Search & Speaker Filter Bar (Hidden in print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
        {/* Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search within spoken dialogue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Speaker Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setSelectedSpeakerId('all')}
            className={cn(
              'px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors shrink-0',
              selectedSpeakerId === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            All Speakers ({transcript.length})
          </button>
          {participants.map((p) => {
            const count = transcript.filter((t) => t.speaker.id === p.id).length;
            if (count === 0) return null;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedSpeakerId(p.id)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors shrink-0 flex items-center gap-1',
                  selectedSpeakerId === p.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <span>{p.initials}</span>
                <span className="hidden sm:inline">{p.name.split(' ')[0]}</span>
                <span className="opacity-60 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Transcript Turns List */}
      <div className="space-y-4">
        {filteredTurns.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No dialogue matches your search query.
          </div>
        ) : (
          filteredTurns.map((turn) => {
            const isActive = activeTurnId === turn.id;

            return (
              <div
                key={turn.id}
                id={`turn-${turn.id}`}
                className={cn(
                  'group flex items-start gap-3.5 p-2 -mx-2 rounded-xl transition-all duration-200 print-avoid-break',
                  isActive
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 ring-1 ring-blue-500/30'
                    : 'hover:bg-slate-50/60 dark:hover:bg-slate-900/30'
                )}
              >
                {/* Speaker Avatar */}
                <Avatar participant={turn.speaker} size="sm" className="mt-0.5" />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                      {turn.speaker.name}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleJumpToTime(turn)}
                      title="Jump to audio position"
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <Play className="w-2.5 h-2.5 opacity-60" />
                      {turn.timestamp}
                    </button>

                    {turn.sentiment === 'question' && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                        <HelpCircle className="w-3 h-3" /> Question
                      </span>
                    )}

                    {turn.sentiment === 'concern' && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-600 dark:text-rose-400">
                        <AlertCircle className="w-3 h-3" /> Objection
                      </span>
                    )}

                    {/* Copy Quote Button (hover) */}
                    <button
                      type="button"
                      onClick={() => handleCopyQuote(turn)}
                      title="Copy verbatim quote"
                      className="no-print opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded transition-opacity ml-auto"
                    >
                      {copiedId === turn.id ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {turn.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
