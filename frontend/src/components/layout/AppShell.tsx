'use client';

import React, { useState, Suspense } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CommandPalette } from './CommandPalette';
import { ToastContainer } from './ToastContainer';
import { CreateMeetingModal } from '@/components/meetings/CreateMeetingModal';
import { LiveAssistantModal } from '@/components/meetings/LiveAssistantModal';
import { useApp } from '@/context/AppContext';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isCreateMeetingOpen, setIsCreateMeetingOpen] = useState(false);
  const { isAssistantOpen, assistantMeetingId, assistantMeetingTitle, closeAssistant } = useApp();

  return (
    <div className="min-h-screen flex bg-slate-50/70 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-500/20 selection:text-blue-900 dark:selection:text-blue-200">
      {/* Sidebar navigation */}
      <Suspense fallback={<aside className="hidden md:flex w-60 border-r border-slate-200/60 dark:border-slate-800/60" />}>
        <Sidebar />
      </Suspense>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <Suspense fallback={<header className="h-16 border-b border-slate-200/60 dark:border-slate-800/60" />}>
          <TopBar onOpenNewMeeting={() => setIsCreateMeetingOpen(true)} />
        </Suspense>

        <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 md:py-8 max-w-7xl w-full mx-auto">
          <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Loading view...</div>}>
            {children}
          </Suspense>
        </main>
      </div>

      {/* Floating Utilities & Modals */}
      <Suspense fallback={null}>
        <CommandPalette />
      </Suspense>
      <ToastContainer />
      <CreateMeetingModal
        isOpen={isCreateMeetingOpen}
        onClose={() => setIsCreateMeetingOpen(false)}
      />
      <LiveAssistantModal
        isOpen={isAssistantOpen}
        meetingId={assistantMeetingId}
        meetingTitle={assistantMeetingTitle}
        onClose={closeAssistant}
      />
    </div>
  );
}
