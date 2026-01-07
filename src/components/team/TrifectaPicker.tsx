'use client';

import { useState, useEffect } from 'react';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import Looks3Icon from '@mui/icons-material/Looks3';
import SendIcon from '@mui/icons-material/Send';

interface TrifectaPickerProps {
  choices: string[];
  initialValues?: {
    first: string;
    second: string;
    third: string;
  };
  disabled?: boolean;
  onSubmit: (first: string, second: string, third: string) => void;
}

export function TrifectaPicker({
  choices,
  initialValues,
  disabled = false,
  onSubmit,
}: TrifectaPickerProps) {
  const [first, setFirst] = useState(initialValues?.first || '');
  const [second, setSecond] = useState(initialValues?.second || '');
  const [third, setThird] = useState(initialValues?.third || '');

  useEffect(() => {
    if (initialValues) {
      setFirst(initialValues.first);
      setSecond(initialValues.second);
      setThird(initialValues.third);
    }
  }, [initialValues]);

  const getAvailableChoices = (exclude: string[]) => {
    return choices.filter((c) => !exclude.includes(c));
  };

  const handleSubmit = () => {
    if (first && second && third) {
      onSubmit(first, second, third);
    }
  };

  const isValid = first && second && third && first !== second && second !== third && first !== third;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">あなたの予想（三連単）</h3>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <LooksOneIcon className="text-yellow-500" style={{ fontSize: 32 }} />
          <label className="w-16 font-medium text-gray-700">1着</label>
          <select
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            disabled={disabled}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 text-gray-800"
          >
            <option value="">選択してください</option>
            {getAvailableChoices([second, third]).map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4">
          <LooksTwoIcon className="text-gray-400" style={{ fontSize: 32 }} />
          <label className="w-16 font-medium text-gray-700">2着</label>
          <select
            value={second}
            onChange={(e) => setSecond(e.target.value)}
            disabled={disabled}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 text-gray-800"
          >
            <option value="">選択してください</option>
            {getAvailableChoices([first, third]).map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4">
          <Looks3Icon className="text-orange-400" style={{ fontSize: 32 }} />
          <label className="w-16 font-medium text-gray-700">3着</label>
          <select
            value={third}
            onChange={(e) => setThird(e.target.value)}
            disabled={disabled}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 text-gray-800"
          >
            <option value="">選択してください</option>
            {getAvailableChoices([first, second]).map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled || !isValid}
        className="mt-6 w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        <SendIcon className="mr-2" /> 予想を確定する
      </button>
    </div>
  );
}
