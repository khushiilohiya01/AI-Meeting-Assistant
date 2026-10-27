'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { PriorityBadge, AIPill } from '@/components/ui/Badge';
import {
  Plus,
  Search,
  LayoutList,
  Kanban,
  Check,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRight,
  Video,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatFriendlyDate } from '@/lib/dates';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { cn } from '@/lib/utils';

export default function TasksPage() {
  const { tasks, toggleTaskStatus, updateTask, deleteTask } = useApp();

  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const isFilterActive =
    searchQuery.trim() !== '' ||
    selectedPriority !== 'all' ||
    selectedAssignee !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedPriority('all');
    setSelectedAssignee('all');
  };

  const filteredTasks = tasks.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      (t.meetingTitle && t.meetingTitle.toLowerCase().includes(q)) ||
      t.assignee.name.toLowerCase().includes(q);

    const matchesPriority =
      selectedPriority === 'all' || t.priority === selectedPriority;

    const matchesAssignee =
      selectedAssignee === 'all' || t.assignee.id === selectedAssignee;

    return matchesSearch && matchesPriority && matchesAssignee;
  });

  const handleOpenAdd = () => {
    setTaskToEdit(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setTaskToEdit(task);
    setIsDialogOpen(true);
  };

  const handleMoveStatus = (task: Task, newStatus: TaskStatus) => {
    updateTask({
      ...task,
      status: newStatus,
      completedAt: newStatus === 'done' ? new Date().toISOString().split('T')[0] : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Tasks & Action Items
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
              {tasks.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Actionable commitments derived directly from meeting dialogues and executive decisions.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-500/20 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </div>

      {/* View Switcher & Shared Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          {/* List vs Board Segmented Control */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
          </div>
        </div>

        {/* Filter inputs */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {isFilterActive && (
            <button
              onClick={clearFilters}
              className="px-2 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Content Rendering: List or Board */}
      {viewMode === 'list' ? (
        /* List View */
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredTasks.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No tasks match your active filters.
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isDone = task.status === 'done';

              return (
                <div
                  key={task.id}
                  className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 group hover:bg-white dark:hover:bg-slate-900/60 p-2 -mx-2 rounded-xl transition-all"
                >
                  {/* Left: Checkbox & Title */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleTaskStatus(task.id)}
                      className={cn(
                        'mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all',
                        isDone
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 hover:border-blue-500'
                      )}
                    >
                      {isDone && <Check className="w-3 h-3 stroke-[2.5]" />}
                    </button>

                    <div className="min-w-0">
                      <span
                        className={cn(
                          'text-xs sm:text-sm font-medium transition-all block',
                          isDone
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-slate-100'
                        )}
                      >
                        {task.title}
                      </span>

                      {task.meetingTitle && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Video className="w-3 h-3 text-slate-400" />
                          <Link
                            href={
                              task.reportId
                                ? `/reports/${task.reportId}`
                                : `/meetings/${task.meetingId}`
                            }
                            className="hover:underline hover:text-blue-500 truncate"
                          >
                            {task.meetingTitle}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Assignee, Due Date, Priority, Status Dropdown, Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 text-xs pl-7 md:pl-0 shrink-0">
                    <div className="flex items-center gap-1.5" title={`Assignee: ${task.assignee.name}`}>
                      <Avatar participant={task.assignee} size="xs" />
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">
                        {task.assignee.name.split(' ')[0]}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span>{formatFriendlyDate(task.dueDate)}</span>
                    </div>

                    <PriorityBadge priority={task.priority} />

                    {/* Status Pill Switcher */}
                    <select
                      value={task.status}
                      onChange={(e) =>
                        handleMoveStatus(task, e.target.value as TaskStatus)
                      }
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[11px] font-medium border appearance-none focus:outline-none cursor-pointer',
                        task.status === 'done'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : task.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      )}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(task)}
                        title="Edit task"
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        title="Delete task"
                        className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Board / Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {(['todo', 'in_progress', 'done'] as TaskStatus[]).map((columnStatus) => {
            const columnTitle = {
              todo: 'To Do',
              in_progress: 'In Progress',
              done: 'Completed',
            }[columnStatus];

            const columnTasks = filteredTasks.filter(
              (t) => t.status === columnStatus
            );

            return (
              <div key={columnStatus} className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {columnTitle}
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5 min-h-[300px]">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-2.5 group hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={cn(
                            'text-xs font-medium text-slate-900 dark:text-slate-100 leading-snug',
                            task.status === 'done' && 'line-through text-slate-400 dark:text-slate-500'
                          )}
                        >
                          {task.title}
                        </span>

                        <PriorityBadge priority={task.priority} />
                      </div>

                      {task.meetingTitle && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                          <Video className="w-3 h-3 shrink-0" />
                          <span className="truncate">{task.meetingTitle}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Avatar participant={task.assignee} size="xs" />
                          <span className="text-slate-500 dark:text-slate-400">
                            {task.assignee.name.split(' ')[0]}
                          </span>
                        </div>

                        <span className="text-slate-400">
                          {formatFriendlyDate(task.dueDate)}
                        </span>
                      </div>

                      {/* Quick status transition dropdown in board */}
                      <div className="pt-1 flex items-center justify-between text-[11px]">
                        <button
                          onClick={() => handleOpenEdit(task)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>

                        <select
                          value={task.status}
                          onChange={(e) =>
                            handleMoveStatus(task, e.target.value as TaskStatus)
                          }
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700 focus:outline-none"
                        >
                          <option value="todo">Move to To Do</option>
                          <option value="in_progress">Move to In Progress</option>
                          <option value="done">Move to Done</option>
                        </select>
                      </div>
                    </div>
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                      No items in this column
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Modal Dialog */}
      <TaskDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        taskToEdit={taskToEdit}
      />
    </div>
  );
}
