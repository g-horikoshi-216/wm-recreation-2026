'use client';

import { useState, useEffect } from 'react';
import SendIcon from '@mui/icons-material/Send';
import EditNoteIcon from '@mui/icons-material/EditNote';

interface FreeAnswerInputProps {
  initialValue?: string;
  disabled?: boolean;
  onSubmit: (text: string) => void;
}

export function FreeAnswerInput({ initialValue, disabled, onSubmit }: FreeAnswerInputProps) {
  const [text, setText] = useState(initialValue || '');
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (initialValue) {
      setText(initialValue);
      setCharCount(initialValue.length);
    }
  }, [initialValue]);

  const handleTextChange = (value: string) => {
    if (value.length <= 100) {
      setText(value);
      setCharCount(value.length);
    }
  };

  const handleSubmit = () => {
    if (text.trim() && !disabled) {
      onSubmit(text.trim());
    }
  };

  const isValid = text.trim().length > 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <EditNoteIcon className="text-green-600" />
        回答を入力
      </h3>

      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="回答を入力してください（100文字以内）"
          disabled={disabled}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-800 text-lg focus:outline-none focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
        />
        <div className="flex justify-between items-center">
          <span className={`text-sm ${charCount > 90 ? 'text-orange-500' : 'text-gray-500'}`}>
            {charCount}/100文字
          </span>
          {charCount >= 100 && (
            <span className="text-sm text-red-500">文字数上限に達しました</span>
          )}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled || !isValid}
        className="w-full py-4 bg-green-600 text-white font-semibold text-lg rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
      >
        <SendIcon />
        {initialValue ? '回答を変更する' : '回答を送信する'}
      </button>
    </div>
  );
}
