import { Participant } from '@/types';

export const participants: Participant[] = [
  {
    id: 'user-self',
    name: 'Alex Vance',
    email: 'alex.vance@vesper.ai',
    role: 'Staff Product Lead',
    initials: 'AV',
    color: '#3B82F6', // Blue
  },
  {
    id: 'p-sarah',
    name: 'Sarah Chen',
    email: 'sarah.chen@vesper.ai',
    role: 'Principal AI Engineer',
    initials: 'SC',
    color: '#06B6D4', // Cyan
  },
  {
    id: 'p-marcus',
    name: 'Marcus Brody',
    email: 'marcus.b@vesper.ai',
    role: 'VP of Product Strategy',
    initials: 'MB',
    color: '#8B5CF6', // Purple
  },
  {
    id: 'p-elena',
    name: 'Elena Rostova',
    email: 'elena.r@vesper.ai',
    role: 'Head of Brand & Design',
    initials: 'ER',
    color: '#EC4899', // Pink
  },
  {
    id: 'p-devon',
    name: 'Devon Patel',
    email: 'devon.p@vesper.ai',
    role: 'Infrastructure Architect',
    initials: 'DP',
    color: '#10B981', // Emerald
  },
  {
    id: 'p-claire',
    name: 'Claire Moreau',
    email: 'claire.m@vesper.ai',
    role: 'Customer Success Director',
    initials: 'CM',
    color: '#F59E0B', // Amber
  },
  {
    id: 'p-tariq',
    name: 'Tariq Al-Mansoor',
    email: 'tariq.m@enterprise-cloud.io',
    role: 'Enterprise Client Sponsor',
    initials: 'TA',
    color: '#6366F1', // Indigo
  },
  {
    id: 'p-hannah',
    name: 'Hannah Zimmer',
    email: 'hannah.z@vesper.ai',
    role: 'Lead Security Auditor',
    initials: 'HZ',
    color: '#14B8A6', // Teal
  },
];

export const currentLoggedInUser = participants[0]; // Alex Vance
