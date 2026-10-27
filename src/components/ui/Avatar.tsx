import React from 'react';
import { Participant } from '@/types';
import { cn } from '@/lib/utils';

interface AvatarProps {
  participant: Participant;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

export function Avatar({
  participant,
  size = 'md',
  showTooltip = false,
  className,
}: AvatarProps) {
  return (
    <div
      title={showTooltip ? `${participant.name} (${participant.role})` : undefined}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full select-none shrink-0 font-semibold uppercase tracking-tight shadow-xs transition-transform hover:scale-105',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: participant.color,
        color: '#ffffff',
      }}
    >
      <span className="leading-none select-none">{participant.initials}</span>
    </div>
  );
}

interface AvatarGroupProps {
  participants: Participant[];
  max?: number;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function AvatarGroup({
  participants,
  max = 4,
  size = 'sm',
  className,
}: AvatarGroupProps) {
  const visible = participants.slice(0, max);
  const overflow = participants.length - max;

  return (
    <div className={cn('flex items-center -space-x-1.5', className)}>
      {visible.map((p) => (
        <Avatar
          key={p.id}
          participant={p}
          size={size}
          showTooltip
          className="ring-2 ring-white dark:ring-[#0B1120]"
        />
      ))}
      {overflow > 0 && (
        <span
          title={`${overflow} more attendees`}
          className={cn(
            'inline-flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold ring-2 ring-white dark:ring-[#0B1120]',
            sizeClasses[size]
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
