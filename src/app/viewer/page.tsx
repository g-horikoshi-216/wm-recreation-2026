'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Leaderboard } from '@/components/shared/Leaderboard';
import { ResultBadge } from '@/components/shared/ResultBadge';
import { HamburgerMenu } from '@/components/shared/HamburgerMenu';
import { HistoryModal } from '@/components/shared/HistoryModal';
import { FinalResultDisplay } from '@/components/shared/FinalResultDisplay';
import { useRealtimeSession } from '@/hooks/useRealtimeSession';
import { useRealtimeQuestion } from '@/hooks/useRealtimeQuestion';
import { useRealtimeAnswers } from '@/hooks/useRealtimeAnswers';
import { useRealtimeTeams } from '@/hooks/useRealtimeTeams';
import { TEAM_NAMES } from '@/lib/constants';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BarChartIcon from '@mui/icons-material/BarChart';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import Looks3Icon from '@mui/icons-material/Looks3';

function ViewerContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const [showHistory, setShowHistory] = useState(false);

  const { session } = useRealtimeSession(sessionId);
  const { question, loading: questionLoading } = useRealtimeQuestion(
    session?.current_question_id || null
  );
  const { answers } = useRealtimeAnswers(question?.id || null);
  const { teams } = useRealtimeTeams(sessionId);

  // チームの回答を取得
  const getTeamAnswer = (teamName: string) => {
    const team = teams.find((t) => t.name === teamName);
    if (!team) return null;
    return answers.find((a) => a.team_id === team.id);
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
        <p className="text-white text-xl">セッションが指定されていません</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ヘッダー */}
        <div className="flex justify-between items-start mb-8">
          <div className="w-10" />
          <div className="text-center flex-1">
            <h1 className="text-2xl sm:text-4xl font-bold mb-2 flex items-center justify-center gap-3">
              WM事業部旅行2026
            </h1>
            <p className="text-indigo-200 text-sm sm:text-base">{session?.name}</p>
          </div>
          <HamburgerMenu
            sessionId={sessionId}
            variant="dark"
            onShowHistory={() => setShowHistory(true)}
          />
        </div>

        {/* 最終結果発表 */}
        {session?.status === 'finished' && teams.length > 0 ? (
          <FinalResultDisplay teams={teams} variant="dark" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側: 問題と結果 */}
          <div className="lg:col-span-2 space-y-6">
            {questionLoading ? (
              <div className="text-center py-20 text-indigo-200">読み込み中...</div>
            ) : question ? (
              <>
                {/* 問題表示 */}
                <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-indigo-300 font-medium">第{question.question_number}問</span>
                    {question.status === 'revealed' && (
                      <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm">
                        結果発表
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold mb-6">{question.question_text}</p>
                  <div className="flex flex-wrap gap-2">
                    {question.choices.map((choice, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-white/20 rounded-full text-sm"
                      >
                        {choice}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 結果発表時: 正解表示 */}
                {question.status === 'revealed' && question.correct_first && (
                  <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur rounded-xl p-6">
                    <h2 className="text-xl font-bold text-center mb-4 flex items-center justify-center gap-2">
                      <EmojiEventsIcon className="text-yellow-400" />
                      結果
                    </h2>
                    <div className="flex items-end justify-center gap-6 py-4">
                      <div className="flex flex-col items-center">
                        <LooksTwoIcon style={{ fontSize: 48 }} className="text-gray-300 mb-2" />
                        <span className="text-xl font-semibold">{question.correct_second}</span>
                        <div className="w-20 h-16 bg-gray-300/50 rounded-t-lg mt-3" />
                      </div>
                      <div className="flex flex-col items-center">
                        <LooksOneIcon style={{ fontSize: 56 }} className="text-yellow-400 mb-2" />
                        <span className="text-2xl font-bold">{question.correct_first}</span>
                        <div className="w-20 h-24 bg-yellow-400/50 rounded-t-lg mt-3" />
                      </div>
                      <div className="flex flex-col items-center">
                        <Looks3Icon style={{ fontSize: 48 }} className="text-orange-400 mb-2" />
                        <span className="text-xl font-semibold">{question.correct_third}</span>
                        <div className="w-20 h-12 bg-orange-400/50 rounded-t-lg mt-3" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 回答締切後または結果発表時: 全チームの予想 */}
                {(question.status === 'closed' || question.status === 'revealed') && (
                  <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <BarChartIcon />
                      採点結果
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/20">
                            <th className="py-2 text-left">チーム</th>
                            <th className="py-2 text-left">予想</th>
                            {question.status === 'revealed' && (
                              <>
                                <th className="py-2 text-center">判定</th>
                                <th className="py-2 text-right">獲得点</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {TEAM_NAMES.map((teamName) => {
                            const answer = getTeamAnswer(teamName);
                            return (
                              <tr key={teamName} className="border-b border-white/10">
                                <td className="py-3 font-medium">チーム{teamName}</td>
                                <td className="py-3">
                                  {answer ? (
                                    <span>
                                      {answer.predict_first} → {answer.predict_second} →{' '}
                                      {answer.predict_third}
                                    </span>
                                  ) : (
                                    <span className="text-white/40">未回答</span>
                                  )}
                                </td>
                                {question.status === 'revealed' && (
                                  <>
                                    <td className="py-3 text-center">
                                      {answer?.result_type && (
                                        <ResultBadge resultType={answer.result_type} />
                                      )}
                                    </td>
                                    <td className="py-3 text-right font-bold">
                                      {answer?.points_earned !== null && answer?.points_earned !== undefined
                                        ? `+${answer.points_earned}`
                                        : '-'}
                                    </td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 回答受付中の表示 */}
                {question.status === 'open' && (
                  <div className="bg-green-500/20 backdrop-blur rounded-xl p-8 text-center">
                    <p className="text-2xl font-bold text-green-300 flex items-center justify-center gap-2">
                      <EditNoteIcon style={{ fontSize: 32 }} />
                      回答受付中
                    </p>
                    <p className="text-green-200 mt-2">
                      回答済み: {answers.length} / {TEAM_NAMES.length} チーム
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-2xl text-indigo-200">問題が出題されるのをお待ちください...</p>
              </div>
            )}
          </div>

          {/* 右側: リーダーボード */}
          <div className="bg-white rounded-xl shadow-lg text-gray-900">
            <Leaderboard teams={teams} />
          </div>
        </div>
        )}
      </div>

      {/* 過去の結果モーダル */}
      {showHistory && sessionId && (
        <HistoryModal
          sessionId={sessionId}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}

export default function ViewerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center text-white text-xl">読み込み中...</div>}>
      <ViewerContent />
    </Suspense>
  );
}
