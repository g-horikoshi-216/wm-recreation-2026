'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TEAM_NAMES } from '@/lib/constants';
import { QuizSession } from '@/lib/types';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import GroupsIcon from '@mui/icons-material/Groups';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SettingsIcon from '@mui/icons-material/Settings';

export default function Home() {
  const router = useRouter();
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      setSessions(data);
      if (data.length > 0) {
        setSelectedSession(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamSelect = (teamName: string) => {
    if (!selectedSession) return;
    router.push(`/team/${teamName}?session=${selectedSession}`);
  };

  const handleViewerSelect = () => {
    if (!selectedSession) return;
    router.push(`/viewer?session=${selectedSession}`);
  };

  const handleAdminSelect = () => {
    setShowAdminDialog(true);
    setAdminError('');
    setAdminPassword('');
  };

  const handleAdminLogin = () => {
    if (adminPassword === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      router.push(`/admin?session=${selectedSession}`);
    } else {
      setAdminError('パスワードが正しくありません');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            WM事業部旅行2026
          </h1>
          <p className="text-gray-600">チーム対抗三連単クイズ</p>
        </div>

        {sessions.length > 0 && (
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              セッションを選択
            </label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
            >
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {sessions.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 text-center">
            <p className="text-yellow-800">
              セッションがありません。管理者画面からセッションを作成してください。
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <GroupsIcon className="text-indigo-600" />
            チーム代表者
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {TEAM_NAMES.map((teamName) => (
              <button
                key={teamName}
                onClick={() => handleTeamSelect(teamName)}
                disabled={!selectedSession}
                className="py-4 px-6 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold text-xl rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {teamName}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleViewerSelect}
            disabled={!selectedSession}
            className="py-4 px-6 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl shadow-lg border border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <VisibilityIcon />
            閲覧用
          </button>
          <button
            onClick={handleAdminSelect}
            className="py-4 px-6 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl shadow-lg border border-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <SettingsIcon />
            管理者
          </button>
        </div>

        {/* 管理者パスワードダイアログ */}
        {showAdminDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <SettingsIcon className="text-indigo-600" />
                管理者ログイン
              </h3>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                placeholder="パスワードを入力"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
              />
              {adminError && (
                <p className="text-red-600 text-sm mb-4">{adminError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAdminDialog(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAdminLogin}
                  className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  ログイン
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
