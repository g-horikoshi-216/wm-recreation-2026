'use client';

import { ResultType } from '@/lib/types';
import { RESULT_LABELS } from '@/lib/constants';

interface ResultBadgeProps {
  resultType: ResultType;
  points?: number;
}

export function ResultBadge({ resultType, points }: ResultBadgeProps) {
  const colorClasses = {
    trifecta: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    trio: 'bg-purple-100 text-purple-800 border-purple-300',
    two: 'bg-blue-100 text-blue-800 border-blue-300',
    one: 'bg-green-100 text-green-800 border-green-300',
    none: 'bg-gray-100 text-gray-600 border-gray-300',
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${colorClasses[resultType]}`}
    >
      <span className="font-medium">{RESULT_LABELS[resultType]}</span>
      {points !== undefined && (
        <span className="font-bold">+{points}pt</span>
      )}
    </div>
  );
}
