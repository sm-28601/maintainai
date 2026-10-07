import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { IssuePriority, IssueStatus, WorkOrderStatus, ThresholdSeverity, EquipmentStatus, EquipmentType, DocumentType } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...opts,
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Priority colors
export function priorityColor(priority: IssuePriority): string {
  return {
    CRITICAL: 'text-red-600',
    HIGH: 'text-orange-500',
    MEDIUM: 'text-yellow-600',
    LOW: 'text-blue-500',
  }[priority] ?? 'text-gray-500';
}

export function priorityBg(priority: IssuePriority): string {
  return {
    CRITICAL: 'bg-red-100 text-red-700 border-red-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    LOW: 'bg-blue-100 text-blue-700 border-blue-200',
  }[priority] ?? 'bg-gray-100 text-gray-700 border-gray-200';
}

// Status colors
export function statusBg(status: IssueStatus | WorkOrderStatus | EquipmentStatus): string {
  const map: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-700 border-blue-200',
    UNDER_INVESTIGATION: 'bg-purple-100 text-purple-700 border-purple-200',
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    RESOLVED: 'bg-green-100 text-green-700 border-green-200',
    CLOSED: 'bg-gray-100 text-gray-700 border-gray-200',
    DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
    EDITED: 'bg-blue-100 text-blue-700 border-blue-200',
    APPROVED: 'bg-green-100 text-green-700 border-green-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
    COMPLETED: 'bg-green-100 text-green-700 border-green-200',
    OPERATIONAL: 'bg-green-100 text-green-700 border-green-200',
    ACTION_REQUIRED: 'bg-orange-100 text-orange-700 border-orange-200',
    MAINTENANCE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    OFFLINE: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return map[status] ?? 'bg-gray-100 text-gray-700 border-gray-200';
}

export function severityBg(severity: ThresholdSeverity): string {
  return {
    CRITICAL: 'bg-red-100 text-red-700 border-red-200',
    WARNING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    NORMAL: 'bg-green-100 text-green-700 border-green-200',
  }[severity];
}

export function severityDot(severity: ThresholdSeverity): string {
  return {
    CRITICAL: 'bg-red-500',
    WARNING: 'bg-yellow-500',
    NORMAL: 'bg-green-500',
  }[severity];
}

export function formatEquipmentType(type: EquipmentType): string {
  const map: Record<EquipmentType, string> = {
    PUMP: 'Pump',
    COMPRESSOR: 'Compressor',
    CNC_MACHINE: 'CNC Machine',
    GENERATOR: 'Generator',
    CONVEYOR: 'Conveyor',
    MOTOR: 'Motor',
    BOILER: 'Boiler',
    TURBINE: 'Turbine',
    VALVE: 'Valve',
    OTHER: 'Other',
  };
  return map[type] ?? type;
}

export function formatDocType(type: DocumentType): string {
  const map: Record<DocumentType, string> = {
    MANUAL: 'Manual',
    FAULT_GUIDE: 'Fault Guide',
    MAINTENANCE_GUIDE: 'Maintenance Guide',
    SAFETY: 'Safety',
    SPECIFICATION: 'Specification',
    OTHER: 'Other',
  };
  return map[type] ?? type;
}

export function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function generateWoId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `WO-${num}`;
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
