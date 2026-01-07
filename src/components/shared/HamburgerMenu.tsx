'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import HistoryIcon from '@mui/icons-material/History';

interface HamburgerMenuProps {
  sessionId: string | null;
  variant?: 'light' | 'dark';
  onShowHistory?: () => void;
}

export function HamburgerMenu({ sessionId, variant = 'light', onShowHistory }: HamburgerMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const isDark = variant === 'dark';
  const buttonClass = isDark
    ? 'bg-white/10 text-white hover:bg-white/20'
    : 'bg-gray-200 text-gray-700 hover:bg-gray-300';
  const menuClass = isDark
    ? 'bg-gray-800 text-white border-gray-700'
    : 'bg-white text-gray-800 border-gray-200';
  const itemClass = isDark
    ? 'hover:bg-gray-700'
    : 'hover:bg-gray-100';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-2 rounded-lg flex items-center gap-1 ${buttonClass}`}
      >
        {isOpen ? <CloseIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg border z-50 ${menuClass}`}>
            <button
              onClick={() => {
                router.push('/');
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 rounded-t-lg ${itemClass}`}
            >
              <HomeIcon fontSize="small" />
              トップへ戻る
            </button>
            {sessionId && onShowHistory && (
              <button
                onClick={() => {
                  onShowHistory();
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 flex items-center gap-3 rounded-b-lg ${itemClass}`}
              >
                <HistoryIcon fontSize="small" />
                過去の結果
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
