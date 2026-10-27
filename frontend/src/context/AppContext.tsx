'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Meeting, MeetingReport, Task } from '@/types';
import * as api from '@/lib/api';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  meetings: Meeting[];
  reports: MeetingReport[];
  tasks: Task[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  toasts: ToastItem[];
  showToast: (title: string, description?: string, type?: ToastItem['type']) => void;
  removeToast: (id: string) => void;

  // Live Assistant State
  isAssistantOpen: boolean;
  assistantMeetingId: string | null;
  assistantMeetingTitle: string;
  openAssistant: (meetingId?: string, meetingTitle?: string) => void;
  closeAssistant: () => void;

  // Asynchronous Mutations
  addTask: (taskData: Partial<Task>) => Promise<Task>;
  updateTask: (task: Task) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskStatus: (taskId: string) => Promise<void>;
  createMeeting: (meetingData: Partial<Meeting>) => Promise<Meeting>;
  deleteMeeting: (meetingId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [reports, setReports] = useState<MeetingReport[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Live Assistant Modal State
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantMeetingId, setAssistantMeetingId] = useState<string | null>(null);
  const [assistantMeetingTitle, setAssistantMeetingTitle] = useState('Meeting Session');

  const showToast = useCallback(
    (title: string, description?: string, type: ToastItem['type'] = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      setToasts((prev) => [...prev, { id, title, description, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch real backend data
  const refreshData = useCallback(async () => {
    try {
      const [fetchedMeetings, fetchedReports, fetchedTasks] = await Promise.allSettled([
        api.getMeetings(),
        api.getReports(),
        api.getTasks(),
      ]);

      if (fetchedMeetings.status === 'fulfilled') {
        setMeetings(fetchedMeetings.value);
      }
      if (fetchedReports.status === 'fulfilled') {
        setReports(fetchedReports.value);
      }
      if (fetchedTasks.status === 'fulfilled') {
        setTasks(fetchedTasks.value);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      console.warn('Backend connection warning:', msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize user preferences on client mount and load backend data
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('vesper_theme') as 'light' | 'dark' | null;
      if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setThemeState('dark');
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        setThemeState('light');
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }

      const savedSidebar = localStorage.getItem('vesper_sidebar_collapsed');
      if (savedSidebar === 'true') {
        setIsSidebarCollapsed(true);
      }
    } catch {}

    // Trigger async data fetch
    void refreshData();
  }, [refreshData]);

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('vesper_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('vesper_sidebar_collapsed', String(next));
      return next;
    });
  }, []);

  // Assistant modal triggers
  const openAssistant = useCallback((meetingId?: string, meetingTitle?: string) => {
    if (meetingId) {
      setAssistantMeetingId(meetingId);
      setAssistantMeetingTitle(meetingTitle || 'Meeting Session');
      setIsAssistantOpen(true);
    } else {
      // Auto create an ad-hoc session if none provided
      api
        .createMeeting({
          title: `Ad-Hoc Session (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
          platform: 'Google Meet',
          date: new Date().toISOString().split('T')[0],
          startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
        .then((created) => {
          setMeetings((prev) => [created, ...prev]);
          setAssistantMeetingId(created.id);
          setAssistantMeetingTitle(created.title);
          setIsAssistantOpen(true);
        })
        .catch((err) => {
          showToast('Could not initialize meeting session', err.message, 'error');
        });
    }
  }, [showToast]);

  const closeAssistant = useCallback(() => {
    setIsAssistantOpen(false);
  }, []);

  // Async task mutations
  const handleAddTask = useCallback(
    async (taskData: Partial<Task>) => {
      try {
        const created = await api.createTask(taskData);
        setTasks((prev) => [created, ...prev]);
        showToast('Task created', created.title, 'success');
        return created;
      } catch (err: any) {
        showToast('Failed to create task', err.message, 'error');
        throw err;
      }
    },
    [showToast],
  );

  const handleUpdateTask = useCallback(
    async (task: Task) => {
      try {
        const updated = await api.updateTask(task.id, task);
        setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
        showToast('Task updated', updated.title, 'info');
        return updated;
      } catch (err: any) {
        showToast('Failed to update task', err.message, 'error');
        throw err;
      }
    },
    [showToast],
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      try {
        await api.deleteTask(taskId);
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        showToast('Task deleted', undefined, 'info');
      } catch (err: any) {
        showToast('Failed to delete task', err.message, 'error');
      }
    },
    [showToast],
  );

  const handleToggleTaskStatus = useCallback(
    async (taskId: string) => {
      const current = tasks.find((t) => t.id === taskId);
      if (!current) return;

      const newStatus = current.status === 'done' ? 'todo' : 'done';
      try {
        const updated = await api.updateTask(taskId, { ...current, status: newStatus });
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
        showToast(
          newStatus === 'done' ? 'Task completed' : 'Task reopened',
          updated.title,
          newStatus === 'done' ? 'success' : 'info',
        );
      } catch (err: any) {
        showToast('Failed to update task status', err.message, 'error');
      }
    },
    [tasks, showToast],
  );

  // Async meeting mutations
  const handleCreateMeeting = useCallback(
    async (meetingData: Partial<Meeting>) => {
      try {
        const created = await api.createMeeting(meetingData);
        setMeetings((prev) => [created, ...prev]);
        showToast('Meeting scheduled', created.title, 'success');
        return created;
      } catch (err: any) {
        showToast('Failed to schedule meeting', err.message, 'error');
        throw err;
      }
    },
    [showToast],
  );

  const handleDeleteMeeting = useCallback(
    async (meetingId: string) => {
      try {
        await api.deleteMeeting(meetingId);
        setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
        showToast('Meeting deleted', undefined, 'info');
      } catch (err: any) {
        showToast('Failed to delete meeting', err.message, 'error');
      }
    },
    [showToast],
  );

  // Global keyboard shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AppContext.Provider
      value={{
        meetings,
        reports,
        tasks,
        isLoading,
        refreshData,
        theme,
        setTheme,
        toggleTheme,
        isSidebarCollapsed,
        toggleSidebar,
        isMobileNavOpen,
        setIsMobileNavOpen,
        isSearchOpen,
        setIsSearchOpen,
        toasts,
        showToast,
        removeToast,
        isAssistantOpen,
        assistantMeetingId,
        assistantMeetingTitle,
        openAssistant,
        closeAssistant,
        addTask: handleAddTask,
        updateTask: handleUpdateTask,
        deleteTask: handleDeleteTask,
        toggleTaskStatus: handleToggleTaskStatus,
        createMeeting: handleCreateMeeting,
        deleteMeeting: handleDeleteMeeting,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
