'use client';

import { Question } from '@/lib/types';
import { STATUS_LABELS } from '@/lib/constants';

interface QuestionCardProps {
  question: Question;
  showStatus?: boolean;
}

export function QuestionCard({ question, showStatus = true }: QuestionCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-2 border-indigo-100">
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm font-medium text-indigo-600">第{question.question_number}問</span>
        {showStatus && (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              question.status === 'open'
                ? 'bg-green-100 text-green-800'
                : question.status === 'closed'
                ? 'bg-yellow-100 text-yellow-800'
                : question.status === 'revealed'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {STATUS_LABELS[question.status]}
          </span>
        )}
      </div>
      <p className="text-lg font-semibold text-gray-900 mb-4">{question.question_text}</p>
      <div className="flex flex-wrap gap-2">
        {question.choices.map((choice, index) => (
          <span
            key={index}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
          >
            {choice}
          </span>
        ))}
      </div>
    </div>
  );
}
