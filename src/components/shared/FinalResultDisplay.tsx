'use client';

import { Team } from '@/lib/types';
import CelebrationIcon from '@mui/icons-material/Celebration';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import Looks3Icon from '@mui/icons-material/Looks3';
import { useEffect, useState } from 'react';

interface FinalResultDisplayProps {
  teams: Team[];
  currentTeamId?: string;
  variant?: 'light' | 'dark';
}

export function FinalResultDisplay({ teams, currentTeamId, variant = 'light' }: FinalResultDisplayProps) {
  const [showHeader, setShowHeader] = useState(false);
  const [showPodium, setShowPodium] = useState(false);
  const [showRankings, setShowRankings] = useState(false);
  const [showCurrentTeam, setShowCurrentTeam] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number; duration: number; color: string }>>([]);

  useEffect(() => {
    // 紙吹雪を生成
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const newConfetti = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setConfetti(newConfetti);

    // 順番にアニメーション表示
    setTimeout(() => setShowHeader(true), 100);
    setTimeout(() => setShowPodium(true), 600);
    setTimeout(() => setShowConfetti(true), 1000); // 1秒後に紙吹雪開始
    setTimeout(() => setShowRankings(true), 1200);
    setTimeout(() => setShowCurrentTeam(true), 1800);
  }, []);

  const sortedTeams = [...teams].sort((a, b) => b.total_score - a.total_score);

  // 順位を計算（同点の場合は同じ順位）
  const getRank = (index: number): number => {
    if (index === 0) return 1;
    if (sortedTeams[index].total_score === sortedTeams[index - 1].total_score) {
      return getRank(index - 1);
    }
    return index + 1;
  };

  // 表彰台用の上位3チーム（常に3枠）
  const podiumTeams = sortedTeams.slice(0, 3);

  const currentTeam = currentTeamId ? teams.find(t => t.name === currentTeamId) : null;
  const currentTeamRank = currentTeam
    ? sortedTeams.findIndex(t => t.id === currentTeam.id)
    : -1;

  const isDark = variant === 'dark';

  // 順位に応じたアイコンを取得（スマホ用にサイズ調整）
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <LooksOneIcon className="text-yellow-500 text-4xl sm:text-5xl" />;
      case 2:
        return <LooksTwoIcon className="text-gray-400 text-3xl sm:text-4xl" />;
      case 3:
        return <Looks3Icon className="text-orange-400 text-3xl sm:text-4xl" />;
      default:
        return null;
    }
  };

  // 順位に応じたスタイルを取得
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          height: 'h-20 sm:h-28',
          bgGradient: 'bg-gradient-to-t from-yellow-400 to-yellow-300',
          textSize: 'text-base sm:text-xl',
          scoreSize: 'text-lg sm:text-2xl',
          scoreColor: isDark ? 'text-yellow-300' : 'text-yellow-600',
          badgeColor: 'bg-yellow-200 text-yellow-800',
        };
      case 2:
        return {
          height: 'h-14 sm:h-20',
          bgGradient: 'bg-gradient-to-t from-gray-300 to-gray-200',
          textSize: 'text-sm sm:text-lg',
          scoreSize: 'text-base sm:text-xl',
          scoreColor: isDark ? 'text-indigo-300' : 'text-indigo-600',
          badgeColor: 'bg-gray-200 text-gray-700',
        };
      case 3:
        return {
          height: 'h-12 sm:h-16',
          bgGradient: 'bg-gradient-to-t from-orange-400 to-orange-300',
          textSize: 'text-sm sm:text-lg',
          scoreSize: 'text-base sm:text-xl',
          scoreColor: isDark ? 'text-orange-300' : 'text-orange-600',
          badgeColor: 'bg-orange-200 text-orange-800',
        };
      default:
        return {
          height: 'h-10 sm:h-12',
          bgGradient: 'bg-gradient-to-t from-gray-200 to-gray-100',
          textSize: 'text-sm sm:text-base',
          scoreSize: 'text-base sm:text-lg',
          scoreColor: isDark ? 'text-gray-300' : 'text-gray-600',
          badgeColor: 'bg-gray-200 text-gray-600',
        };
    }
  };

  // 表彰台の1つのスロットをレンダリング
  const renderPodiumSlot = (team: Team, index: number) => {
    const rank = getRank(index);
    const style = getRankStyle(rank);
    const isTie = sortedTeams.filter((_, i) => i < 3 && getRank(i) === rank).length > 1;

    return (
      <div key={team.id} className="flex flex-col items-center flex-1 min-w-0">
        {getRankIcon(rank)}
        {isTie && (
          <span className={`text-[10px] sm:text-xs font-semibold mb-1 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap ${style.badgeColor}`}>
            {rank}位タイ
          </span>
        )}
        <div className={`${style.textSize} font-bold ${isDark ? 'text-white' : 'text-gray-900'} text-center truncate w-full`}>
          チーム{team.name}
        </div>
        <div className={`${style.scoreSize} font-bold ${style.scoreColor}`}>
          {team.total_score}pt
        </div>
        <div className={`w-16 sm:w-24 ${style.height} ${style.bgGradient} rounded-t-lg mt-2 sm:mt-3`} />
      </div>
    );
  };

  // 表彰台の順序を調整（2位、1位、3位の順）
  const getPodiumOrder = () => {
    if (podiumTeams.length < 3) return podiumTeams;
    return [podiumTeams[1], podiumTeams[0], podiumTeams[2]];
  };

  return (
    <div className={`${isDark ? 'bg-white/10 backdrop-blur' : 'bg-white'} rounded-xl shadow-lg overflow-hidden relative`}>
      {/* 紙吹雪アニメーション */}
      {showConfetti && (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((c) => (
          <div
            key={c.id}
            className="absolute w-2 h-2 sm:w-3 sm:h-3 animate-confetti"
            style={{
              left: `${c.left}%`,
              backgroundColor: c.color,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              borderRadius: Math.random() > 0.5 ? '50%' : '0',
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>
      )}

      {/* ヘッダー */}
      <div
        className={`bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 p-4 sm:p-6 text-center transition-all duration-700 ${
          showHeader ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1 sm:mb-2">
          <CelebrationIcon className={`text-white text-3xl sm:text-5xl ${showHeader ? 'animate-bounce' : ''}`} />
          <h2 className="text-xl sm:text-3xl font-bold text-white animate-pulse">Congratulations!</h2>
          <CelebrationIcon className={`text-white text-3xl sm:text-5xl ${showHeader ? 'animate-bounce' : ''}`} />
        </div>
        <p className="text-white/90 text-sm sm:text-lg">最終結果発表</p>
      </div>

      {/* 表彰台 */}
      <div className="p-4 sm:p-6">
        <div
          className={`flex items-end justify-center gap-2 sm:gap-4 mb-6 sm:mb-8 transition-all duration-700 ${
            showPodium ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
        >
          {getPodiumOrder().map((team, displayIndex) => {
            const originalIndex = podiumTeams.findIndex(t => t.id === team.id);
            return (
              <div
                key={team.id}
                className="transition-all duration-500"
                style={{
                  transitionDelay: `${displayIndex * 200}ms`,
                  opacity: showPodium ? 1 : 0,
                  transform: showPodium ? 'translateY(0)' : 'translateY(20px)'
                }}
              >
                {renderPodiumSlot(team, originalIndex)}
              </div>
            );
          })}
        </div>

        {/* 全順位一覧 */}
        <div
          className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-lg p-3 sm:p-4 transition-all duration-700 ${
            showRankings ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h3 className={`font-semibold mb-2 sm:mb-3 text-sm sm:text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
            全チーム順位
          </h3>
          <div className="space-y-1.5 sm:space-y-2">
            {sortedTeams.map((team, index) => {
              const rank = getRank(index);
              const isCurrentTeam = currentTeamId && team.name === currentTeamId;
              const isTie = sortedTeams.filter((_, i) => getRank(i) === rank).length > 1;

              return (
                <div
                  key={team.id}
                  className={`flex items-center justify-between p-2 sm:p-3 rounded-lg transition-all duration-500 hover:scale-[1.02] ${
                    isCurrentTeam
                      ? 'bg-indigo-100 border-2 border-indigo-500 animate-pulse-slow'
                      : isDark
                      ? 'bg-white/10'
                      : 'bg-white'
                  }`}
                  style={{
                    transitionDelay: showRankings ? `${index * 100}ms` : '0ms',
                    opacity: showRankings ? 1 : 0,
                    transform: showRankings ? 'translateX(0)' : 'translateX(-20px)'
                  }}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <span className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full font-bold text-xs sm:text-sm flex-shrink-0 ${
                      rank === 1 ? 'bg-yellow-400 text-yellow-900 animate-pulse' :
                      rank === 2 ? 'bg-gray-300 text-gray-700' :
                      rank === 3 ? 'bg-orange-400 text-orange-900' :
                      isDark ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {rank}
                    </span>
                    <span className={`font-medium text-sm sm:text-base truncate ${
                      isCurrentTeam ? 'text-indigo-800' :
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>
                      チーム{team.name}
                      {isTie && (
                        <span className={`ml-1 text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded ${
                          rank === 1 ? 'bg-yellow-200 text-yellow-800' :
                          rank === 2 ? 'bg-gray-200 text-gray-700' :
                          rank === 3 ? 'bg-orange-200 text-orange-800' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          タイ
                        </span>
                      )}
                      {isCurrentTeam && <span className="ml-1 sm:ml-2 text-indigo-600 text-xs sm:text-sm">(あなた)</span>}
                    </span>
                  </div>
                  <span className={`font-bold text-sm sm:text-base flex-shrink-0 ${
                    isCurrentTeam ? 'text-indigo-600' :
                    isDark ? 'text-indigo-300' : 'text-indigo-600'
                  }`}>
                    {team.total_score}pt
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 自分のチームの順位（チーム画面の場合） */}
        {currentTeam && currentTeamRank >= 0 && (
          <div
            className={`mt-4 sm:mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 sm:p-6 text-center text-white transition-all duration-700 ${
              showCurrentTeam ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <p className="text-sm sm:text-lg mb-1">チーム{currentTeam.name}の最終順位</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-4xl sm:text-5xl font-bold animate-bounce">{getRank(currentTeamRank)}位</p>
              {sortedTeams.filter((_, i) => getRank(i) === getRank(currentTeamRank)).length > 1 && (
                <span className="text-base sm:text-xl bg-white/20 px-2 py-1 rounded">タイ</span>
              )}
            </div>
            <p className="text-xl sm:text-2xl mt-2">{currentTeam.total_score}pt</p>
          </div>
        )}
      </div>

      {/* カスタムアニメーション用スタイル */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(400px) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear infinite;
        }
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
