'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import HistoryIcon from '@mui/icons-material/History';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

interface HamburgerMenuProps {
  sessionId: string | null;
  variant?: 'light' | 'dark';
  onShowHistory?: () => void;
  showDeleteSession?: boolean;
}

export function HamburgerMenu({ sessionId, variant = 'light', onShowHistory, showDeleteSession = false }: HamburgerMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteSession = async () => {
    if (!sessionId) return;

    // パスワード確認
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin';
    if (password !== adminPassword) {
      setDeleteError('パスワードが正しくありません');
      return;
    }

    setDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/');
      } else {
        setDeleteError('削除に失敗しました');
      }
    } catch {
      setDeleteError('削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

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
                className={`w-full px-4 py-3 flex items-center gap-3 ${itemClass} ${showDeleteSession ? '' : 'rounded-b-lg'}`}
              >
                <HistoryIcon fontSize="small" />
                過去の結果
              </button>
            )}
            {showDeleteSession && sessionId && (
              <button
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 flex items-center gap-3 rounded-b-lg text-red-600 ${isDark ? 'hover:bg-red-900/30' : 'hover:bg-red-50'}`}
              >
                <DeleteForeverIcon fontSize="small" />
                セッション削除
              </button>
            )}
          </div>
        </>
      )}

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
              <DeleteForeverIcon />
              セッションを削除
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              問題、回答、チームデータがすべて削除されます。この操作は取り消せません。
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                管理者パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                className="w-full px-3 py-2 border rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {deleteError && (
                <p className="text-red-600 text-sm mt-1">{deleteError}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setPassword('');
                  setDeleteError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteSession}
                disabled={deleting || !password}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
