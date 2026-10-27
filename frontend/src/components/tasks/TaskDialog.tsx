'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '@/types';
import { participants } from '@/data/participants';
import { useApp } from '@/context/AppContext';

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
}

function TaskDialogForm({
  taskToEdit,
  onClose,
}: {
  taskToEdit?: Task | null;
  onClose: () => void;
}) {
  const { addTask, updateTask, meetings } = useApp();

  const [title, setTitle] = useState(taskToEdit ? taskToEdit.title : '');
  const [meetingId, setMeetingId] = useState(
    taskToEdit ? taskToEdit.meetingId : meetings[0]?.id || '',
  );
  const [assigneeId, setAssigneeId] = useState(
    taskToEdit ? taskToEdit.assignee?.id || participants[0].id : participants[0].id,
  );
  const [dueDate, setDueDate] = useState(
    taskToEdit ? taskToEdit.dueDate : new Date().toISOString().split('T')[0],
  );
  const [priority, setPriority] = useState<TaskPriority>(
    taskToEdit ? taskToEdit.priority : 'medium',
  );
  const [status, setStatus] = useState<TaskStatus>(
    taskToEdit ? taskToEdit.status : 'todo',
  );
  const [notes, setNotes] = useState(taskToEdit?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    const chosenAssignee =
      participants.find((p) => p.id === assigneeId) || participants[0];
    const sourceMeeting = meetings.find((m) => m.id === meetingId);

    setIsSubmitting(true);
    try {
      if (taskToEdit) {
        await updateTask({
          ...taskToEdit,
          title: title.trim(),
          meetingId,
          meetingTitle: sourceMeeting?.title || taskToEdit.meetingTitle,
          reportId: sourceMeeting?.reportId || taskToEdit.reportId,
          assignee: chosenAssignee,
          dueDate,
          priority,
          status,
          notes: notes.trim() || undefined,
        });
      } else {
        await addTask({
          title: title.trim(),
          meetingId,
          meetingTitle: sourceMeeting?.title,
          reportId: sourceMeeting?.reportId,
          assignee: chosenAssignee,
          dueDate,
          priority,
          status,
          notes: notes.trim() || undefined,
        });
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {taskToEdit ? 'Edit Action Item' : 'Create New Action Item'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Task Description
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Implement automated PII masking pipeline"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Source Meeting */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Source Meeting
            </label>
            <select
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
            >
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.date})
                </option>
              ))}
            </select>
          </div>

          {/* Assignee & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Context Notes
            </label>
            <textarea
              rows={2}
              placeholder="Add extra guidance, link to pull request, or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {taskToEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TaskDialog({ isOpen, onClose, taskToEdit }: TaskDialogProps) {
  if (!isOpen) return null;
  return (
    <TaskDialogForm
      key={taskToEdit?.id || 'new-task'}
      taskToEdit={taskToEdit}
      onClose={onClose}
    />
  );
}
