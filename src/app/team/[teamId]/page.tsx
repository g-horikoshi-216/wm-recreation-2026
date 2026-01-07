'use client';

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { QuestionCard } from '@/components/shared/QuestionCard';
import { TrifectaPicker } from '@/components/team/TrifectaPicker';
import { ResultBadge } from '@/components/shared/ResultBadge';
import { PodiumDisplay } from '@/components/shared/PodiumDisplay';
import { useRealtimeSession } from '@/hooks/useRealtimeSession';
import { useRealtimeQuestion } from '@/hooks/useRealtimeQuestion';
import { Team, Answer } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import Looks3Icon from '@mui/icons-material/Looks3';

export default function TeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  const { session } = useRealtimeSession(sessionId);
  const { question, loading: questionLoading } = useRealtimeQuestion(
    session?.current_question_id || null
  );

  const [team, setTeam] = useState<Team | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // チーム情報を取得
  useEffect(() => {
    if (!sessionId || !teamId) return;

    const fetchTeam = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('teams')
        .select('*')
        .eq('session_id', sessionId)
        .eq('name', teamId)
        .single();

      if (data) {
        setTeam(data as Team);
      }
    };

    fetchTeam();

    // リアルタイム購読
    const supabase = createClient();
    const channel = supabase
      .channel(`team-${sessionId}-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'teams',
        },
        (payload) => {
          const updatedTeam = payload.new as Team;
          if (updatedTeam.name === teamId && updatedTeam.session_id === sessionId) {
            setTeam(updatedTeam);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, teamId]);

  // 現在の問題への回答を取得
  useEffect(() => {
    if (!question?.id || !team?.id) {
      setAnswer(null);
      return;
    }

    const fetchAnswer = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('answers')
        .select('*')
        .eq('question_id', question.id)
        .eq('team_id', team.id)
        .single();

      if (data) {
        setAnswer(data as Answer);
      } else {
        setAnswer(null);
      }
    };

    fetchAnswer();

    // リアルタイム購読
    const supabase = createClient();
    const channel = supabase
      .channel(`answer-${question.id}-${team.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'answers',
          filter: `question_id=eq.${question.id}`,
        },
        async () => {
          const { data } = await supabase
            .from('answers')
            .select('*')
            .eq('question_id', question.id)
            .eq('team_id', team.id)
            .single();

          setAnswer(data as Answer || null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [question?.id, team?.id]);

  const handleSubmit = async (first: string, second: string, third: string) => {
    if (!question?.id || !team?.id) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: question.id,
          team_id: team.id,
          predict_first: first,
          predict_second: second,
          predict_third: third,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '送信に失敗しました');
      }

      setMessage({ type: 'success', text: '予想を送信しました' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '送信に失敗しました',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <p className="text-red-600">セッションが指定されていません</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <EmojiEventsIcon className="text-yellow-500" />
            チーム {teamId}
          </h1>
          <div className="text-right">
            <span className="text-sm text-gray-500">現在のスコア</span>
            <p className="text-2xl font-bold text-indigo-600">{team?.total_score || 0}pt</p>
          </div>
        </div>

        {/* 問題表示 */}
        {questionLoading ? (
          <div className="text-center py-12 text-gray-500">読み込み中...</div>
        ) : question ? (
          <div className="space-y-6">
            <QuestionCard question={question} />

            {/* 回答フォームまたは結果表示 */}
            {question.status === 'open' && (
              <>
                <TrifectaPicker
                  choices={question.choices}
                  initialValues={
                    answer
                      ? {
                          first: answer.predict_first,
                          second: answer.predict_second,
                          third: answer.predict_third,
                        }
                      : undefined
                  }
                  disabled={submitting}
                  onSubmit={handleSubmit}
                />

                {message && (
                  <div
                    className={`p-4 rounded-lg ${
                      message.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                {answer && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 flex items-center gap-2">
                      <CheckCircleIcon className="text-green-600" fontSize="small" />
                      予想済み:
                      <span className="inline-flex items-center gap-1">
                        <LooksOneIcon className="text-yellow-500" fontSize="small" />{answer.predict_first}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <LooksTwoIcon className="text-gray-400" fontSize="small" />{answer.predict_second}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Looks3Icon className="text-orange-400" fontSize="small" />{answer.predict_third}
                      </span>
                    </p>
                    <p className="text-sm text-green-600 mt-1">（締切前なら変更可能）</p>
                  </div>
                )}
              </>
            )}

            {question.status === 'closed' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center gap-2">
                  <AccessTimeIcon />
                  回答締切
                </h3>
                {answer ? (
                  <p className="text-yellow-800 flex items-center gap-2">
                    あなたの予想:
                    <span className="inline-flex items-center gap-1">
                      <LooksOneIcon className="text-yellow-500" fontSize="small" />{answer.predict_first}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <LooksTwoIcon className="text-gray-400" fontSize="small" />{answer.predict_second}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Looks3Icon className="text-orange-400" fontSize="small" />{answer.predict_third}
                    </span>
                  </p>
                ) : (
                  <p className="text-yellow-800">未回答</p>
                )}
                <p className="text-sm text-yellow-600 mt-2">結果発表をお待ちください...</p>
              </div>
            )}

            {question.status === 'revealed' && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <EmojiEventsIcon className="text-yellow-500" />
                    結果
                  </h3>
                  <PodiumDisplay
                    first={question.correct_first || ''}
                    second={question.correct_second || ''}
                    third={question.correct_third || ''}
                    isResult
                  />
                </div>

                {answer && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">あなたの結果</h3>
                    <p className="mb-3 flex items-center gap-2">
                      予想:
                      <span className="inline-flex items-center gap-1">
                        <LooksOneIcon className="text-yellow-500" fontSize="small" />{answer.predict_first}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <LooksTwoIcon className="text-gray-400" fontSize="small" />{answer.predict_second}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Looks3Icon className="text-orange-400" fontSize="small" />{answer.predict_third}
                      </span>
                    </p>
                    {answer.result_type && (
                      <ResultBadge resultType={answer.result_type} points={answer.points_earned || 0} />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">問題が出題されるのをお待ちください...</p>
          </div>
        )}
      </div>
    </div>
  );
}
