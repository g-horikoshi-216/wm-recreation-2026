'use client';

import { useState } from 'react';
import { Team } from '@/lib/types';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import Looks3Icon from '@mui/icons-material/Looks3';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

interface LeaderboardProps {
  teams: Team[];
  editable?: boolean;
  onScoreUpdate?: (teamId: string, newScore: number) => void;
}

export function Leaderboard({ teams, editable = false, onScoreUpdate }: LeaderboardProps) {
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const sortedTeams = [...teams].sort((a, b) => b.total_score - a.total_score);
  const maxScore = sortedTeams[0]?.total_score || 1;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <LooksOneIcon className="text-yellow-500" />;
      case 2:
        return <LooksTwoIcon className="text-gray-400" />;
      case 3:
        return <Looks3Icon className="text-orange-400" />;
      default:
        return <span className="w-6 text-center text-gray-500">{rank}.</span>;
    }
  };

  const handleEditStart = (team: Team) => {
    setEditingTeamId(team.id);
    setEditValue(team.total_score.toString());
  };

  const handleEditCancel = () => {
    setEditingTeamId(null);
    setEditValue('');
  };

  const handleEditSave = async (teamId: string) => {
    const newScore = parseInt(editValue, 10);
    if (isNaN(newScore) || newScore < 0) {
      alert('有効なスコアを入力してください');
      return;
    }

    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total_score: newScore }),
      });

      if (!res.ok) {
        throw new Error('更新に失敗しました');
      }

      if (onScoreUpdate) {
        onScoreUpdate(teamId, newScore);
      }

      setEditingTeamId(null);
      setEditValue('');
    } catch (error) {
      console.error('Score update error:', error);
      alert('スコアの更新に失敗しました');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
        <EmojiEventsIcon className="text-yellow-500 text-xl sm:text-2xl" />
        現在の順位
        {editable && (
          <span className="text-[10px] sm:text-xs font-normal text-gray-500 ml-1 sm:ml-2">
            (タップで編集)
          </span>
        )}
      </h3>
      <div className="space-y-2 sm:space-y-3">
        {sortedTeams.map((team, index) => {
          const rank = index + 1;
          const isEditing = editingTeamId === team.id;

          return (
            <div key={team.id} className="flex items-center gap-2 sm:gap-3">
              <span className="w-6 sm:w-8 flex justify-center text-sm sm:text-base">{getRankIcon(rank)}</span>
              <span className="w-16 sm:w-20 font-medium text-gray-900 text-sm sm:text-base truncate">チーム{team.name}</span>

              {isEditing ? (
                <div className="flex items-center gap-1 sm:gap-2 flex-1">
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-16 sm:w-20 px-2 py-1 border border-indigo-500 rounded text-right text-gray-800 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditSave(team.id);
                      if (e.key === 'Escape') handleEditCancel();
                    }}
                  />
                  <span className="text-gray-600 text-sm">pt</span>
                  <button
                    onClick={() => handleEditSave(team.id)}
                    className="p-1 text-green-600 hover:bg-green-100 rounded"
                  >
                    <CheckIcon fontSize="small" />
                  </button>
                  <button
                    onClick={handleEditCancel}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <CloseIcon fontSize="small" />
                  </button>
                </div>
              ) : (
                <>
                  <span
                    className={`w-14 sm:w-16 text-right font-bold text-indigo-600 text-sm sm:text-base ${
                      editable ? 'cursor-pointer hover:bg-indigo-50 rounded px-1' : ''
                    }`}
                    onClick={() => editable && handleEditStart(team)}
                  >
                    {team.total_score}pt
                  </span>
                  {editable && (
                    <button
                      onClick={() => handleEditStart(team)}
                      className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded flex-shrink-0"
                    >
                      <EditIcon fontSize="small" />
                    </button>
                  )}
                </>
              )}

              {!isEditing && (
                <div className="flex-1 h-3 sm:h-4 bg-gray-100 rounded-full overflow-hidden min-w-0">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${(team.total_score / maxScore) * 100}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
