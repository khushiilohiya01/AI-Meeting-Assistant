'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Meeting, MeetingReport, Task, CalendarEvent } from '@/types';
import * as mockApi from '@/lib/mock-api';

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
  // Mutations
  addTask: (taskData: Omit<Task, 'id' | 'createdAt'>) => Task;
  updateTask: (task: Task) => Task;
  deleteTask: (taskId: string) => void;
  toggleTaskStatus: (taskId: string) => void;
  createMeeting: (meetingData: Omit<Meeting, 'id'>) => Meeting;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [reports, setReports] = useState<MeetingReport[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Initialize data and settings from localStorage / mockApi
  useEffect(() => {
    setMeetings(mockApi.getMeetings());
    setReports(mockApi.getReports());
    setTasks(mockApi.getTasks());

    // Theme initialization
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

    // Sidebar state initialization
    const savedSidebar = localStorage.getItem('vesper_sidebar_collapsed');
    if (savedSidebar === 'true') {
      setIsSidebarCollapsed(true);
    }
  }, []);

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

  const showToast = useCallback(
    (title: string, description?: string, type: ToastItem['type'] = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      setToasts((prev) => [...prev, { id, title, description, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleAddTask = useCallback(
    (taskData: Omit<Task, 'id' | 'createdAt'>) => {
      const created = mockApi.addTask(taskData);
      setTasks(mockApi.getTasks());
      showToast('Task created', created.title, 'success');
      return created;
    },
    [showToast]
  );

  const handleUpdateTask = useCallback(
    (task: Task) => {
      const updated = mockApi.updateTask(task);
      setTasks(mockApi.getTasks());
      showToast('Task updated', updated.title, 'info');
      return updated;
    },
    [showToast]
  );

  const handleDeleteTask = useCallback(
    (taskId: string) => {
      mockApi.deleteTask(taskId);
      setTasks(mockApi.getTasks());
      showToast('Task deleted', undefined, 'info');
    },
    [showToast]
  );

  const handleToggleTaskStatus = useCallback(
    (taskId: string) => {
      const updated = mockApi.toggleTaskStatus(taskId);
      setTasks(mockApi.getTasks());
      if (updated) {
        showToast(
          updated.status === 'done' ? 'Task completed' : 'Task reopened',
          updated.title,
          updated.status === 'done' ? 'success' : 'info'
        );
      }
    },
    [showToast]
  );

  const handleCreateMeeting = useCallback(
    (meetingData: Omit<Meeting, 'id'>) => {
      const created = mockApi.createMeeting(meetingData);
      setMeetings([...mockApi.getMeetings()]);
      showToast('Meeting scheduled', created.title, 'success');
      return created;
    },
    [showToast]
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
        addTask: handleAddTask,
        updateTask: handleUpdateTask,
        deleteTask: handleDeleteTask,
        toggleTaskStatus: handleToggleTaskStatus,
        createMeeting: handleCreateMeeting,
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
