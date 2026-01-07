'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Question, Answer, Team } from '@/lib/types';
import { ResultBadge } from './ResultBadge';
import CloseIcon from '@mui/icons-material/Close';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import Looks3Icon from '@mui/icons-material/Looks3';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

interface HistoryModalProps {
  sessionId: string;
  teamId?: string;
  onClose: () => void;
}

interface QuestionWithAnswers extends Question {
  answers: (Answer & { team?: Team })[];
}

export function HistoryModal({ sessionId, teamId, onClose }: HistoryModalProps) {
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const supabase = createClient();

      // チーム情報を取得
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*')
        .eq('session_id', sessionId);

      if (teamsData) {
        setTeams(teamsData as Team[]);
      }

      // 結果発表済みの問題を取得
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('status', 'revealed')
        .order('question_number', { ascending: true });

      if (questionsData) {
        const questionsWithAnswers: QuestionWithAnswers[] = [];

        for (const q of questionsData) {
          let answersQuery = supabase
            .from('answers')
            .select('*')
            .eq('question_id', q.id);

          if (teamId) {
            const team = teamsData?.find(t => t.name === teamId);
            if (team) {
              answersQuery = answersQuery.eq('team_id', team.id);
            }
          }

          const { data: answersData } = await answersQuery;

          const answersWithTeams = (answersData || []).map(a => ({
            ...a,
            team: teamsData?.find(t => t.id === a.team_id)
          }));

          questionsWithAnswers.push({
            ...q,
            answers: answersWithTeams
          } as QuestionWithAnswers);
        }

        setQuestions(questionsWithAnswers);
      }

      setLoading(false);
    };

    fetchHistory();
  }, [sessionId, teamId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <EmojiEventsIcon className="text-yellow-500" />
            過去の結果
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <CloseIcon className="text-gray-600" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          {loading ? (
            <div className="text-center py-8 text-gray-500">読み込み中...</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              まだ結果が発表された問題がありません
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((q) => (
                <div key={q.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-medium text-indigo-600">
                      第{q.question_number}問
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 mb-3">{q.question_text}</p>

                  {/* 正解 */}
                  <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">正解</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="flex flex-col items-center">
                        <LooksOneIcon className="text-yellow-500 text-lg" />
                        <span className="font-medium text-gray-800 text-sm">{q.correct_first}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <LooksTwoIcon className="text-gray-400 text-lg" />
                        <span className="font-medium text-gray-800 text-sm">{q.correct_second}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Looks3Icon className="text-orange-400 text-lg" />
                        <span className="font-medium text-gray-800 text-sm">{q.correct_third}</span>
                      </div>
                    </div>
                  </div>

                  {/* 回答一覧 */}
                  <div className="space-y-2">
                    {q.answers.map((a) => (
                      <div
                        key={a.id}
                        className="bg-white rounded-lg p-3 border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-gray-600">
                            {teamId ? '回答' : `チーム${a.team?.name}`}
                          </p>
                          {a.result_type && (
                            <div className="flex items-center gap-2">
                              <ResultBadge resultType={a.result_type} size="sm" />
                              {a.points_earned != null && a.points_earned > 0 && (
                                <span className="text-sm font-bold text-indigo-600">+{a.points_earned}pt</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="flex flex-col items-center">
                            <LooksOneIcon className="text-yellow-500 text-lg" />
                            <span className="font-medium text-gray-800 text-sm">{a.predict_first}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <LooksTwoIcon className="text-gray-400 text-lg" />
                            <span className="font-medium text-gray-800 text-sm">{a.predict_second}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <Looks3Icon className="text-orange-400 text-lg" />
                            <span className="font-medium text-gray-800 text-sm">{a.predict_third}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* チーム別合計スコア（チーム指定がない場合） */}
              {!teamId && teams.length > 0 && (
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <h3 className="font-semibold text-indigo-900 mb-3 text-sm sm:text-base">現在のスコア</h3>
                  <div className="space-y-2">
                    {teams
                      .sort((a, b) => b.total_score - a.total_score)
                      .map((team, index) => (
                        <div
                          key={team.id}
                          className={`flex justify-between items-center p-2 rounded ${
                            index === 0 ? 'bg-yellow-100' : 'bg-white'
                          }`}
                        >
                          <span className="font-medium text-gray-800 text-sm">チーム{team.name}</span>
                          <span className="font-bold text-indigo-600 text-sm">{team.total_score}pt</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
