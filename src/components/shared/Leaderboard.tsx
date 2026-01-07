'use client';

import { Team } from '@/lib/types';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import Looks3Icon from '@mui/icons-material/Looks3';

interface LeaderboardProps {
  teams: Team[];
}

export function Leaderboard({ teams }: LeaderboardProps) {
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <EmojiEventsIcon className="text-yellow-500" />
        現在の順位
      </h3>
      <div className="space-y-3">
        {sortedTeams.map((team, index) => {
          const rank = index + 1;

          return (
            <div key={team.id} className="flex items-center gap-3">
              <span className="w-8 flex justify-center">{getRankIcon(rank)}</span>
              <span className="w-20 font-medium text-gray-900">チーム{team.name}</span>
              <span className="w-16 text-right font-bold text-indigo-600">{team.total_score}pt</span>
              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${(team.total_score / maxScore) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
