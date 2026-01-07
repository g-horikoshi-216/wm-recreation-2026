'use client';

import { ResultType } from '@/lib/types';
import { RESULT_LABELS } from '@/lib/constants';

interface ResultBadgeProps {
  resultType: ResultType;
  points?: number;
  size?: 'sm' | 'md';
}

export function ResultBadge({ resultType, points, size = 'md' }: ResultBadgeProps) {
  const colorClasses = {
    trifecta: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    trio: 'bg-purple-100 text-purple-800 border-purple-300',
    two: 'bg-blue-100 text-blue-800 border-blue-300',
    one: 'bg-green-100 text-green-800 border-green-300',
    none: 'bg-gray-100 text-gray-600 border-gray-300',
  };

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${colorClasses[resultType]} ${sizeClasses}`}
    >
      {RESULT_LABELS[resultType]}
      {points !== undefined && points > 0 && (
        <span className="font-bold">+{points}</span>
      )}
    </span>
  );
}
