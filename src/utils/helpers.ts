import { format, differenceInYears, differenceInMinutes, parseISO } from 'date-fns';
import type { TriagePriority, Patient } from '../types';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11).toUpperCase();
}

export function generateMRN(): string {
  return 'MRN' + Date.now().toString().slice(-8);
}

export function calculateAge(dateOfBirth: string): number {
  return differenceInYears(new Date(), parseISO(dateOfBirth));
}

export function formatDate(date: string): string {
  try {
    return format(parseISO(date), 'MMM dd, yyyy');
  } catch {
    return date;
  }
}

export function formatDateTime(date: string): string {
  try {
    return format(parseISO(date), 'MMM dd, yyyy HH:mm');
  } catch {
    return date;
  }
}

export function formatTime(date: string): string {
  try {
    return format(parseISO(date), 'HH:mm');
  } catch {
    return date;
  }
}

export function getWaitTime(arrivalTime: string): number {
  return differenceInMinutes(new Date(), parseISO(arrivalTime));
}

export function formatWaitTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

export const ESI_LABELS: Record<TriagePriority, string> = {
  1: 'Resuscitation',
  2: 'Emergent',
  3: 'Urgent',
  4: 'Less Urgent',
  5: 'Non-Urgent',
};

export const ESI_COLORS: Record<TriagePriority, string> = {
  1: 'bg-red-600 text-white',
  2: 'bg-orange-500 text-white',
  3: 'bg-yellow-400 text-gray-900',
  4: 'bg-green-500 text-white',
  5: 'bg-blue-500 text-white',
};

export const ESI_BADGE_COLORS: Record<TriagePriority, string> = {
  1: 'badge-red',
  2: 'badge-orange',
  3: 'badge-yellow',
  4: 'badge-green',
  5: 'badge-blue',
};

export const STATUS_COLORS: Record<string, string> = {
  'waiting': 'badge-yellow',
  'in-triage': 'badge-orange',
  'in-treatment': 'badge-blue',
  'admitted': 'badge-blue',
  'discharged': 'badge-green',
  'transferred': 'badge-gray',
};

export const STATUS_LABELS: Record<string, string> = {
  'waiting': 'Waiting',
  'in-triage': 'In Triage',
  'in-treatment': 'In Treatment',
  'admitted': 'Admitted',
  'discharged': 'Discharged',
  'transferred': 'Transferred',
};

export function getPatientFullName(patient: Patient): string {
  return [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ');
}

export function calculateBMI(weight: number, height: number, weightUnit: 'kg' | 'lbs', heightUnit: 'cm' | 'in'): number {
  let weightKg = weightUnit === 'lbs' ? weight * 0.453592 : weight;
  let heightM = heightUnit === 'in' ? height * 0.0254 : height / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}
