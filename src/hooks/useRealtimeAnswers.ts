'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AnswerWithTeam } from '@/lib/types';

export function useRealtimeAnswers(questionId: string | null) {
  const [answers, setAnswers] = useState<AnswerWithTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!questionId) {
      setAnswers([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // 初回取得
    const fetchAnswers = async () => {
      const { data } = await supabase
        .from('answers')
        .select('*, team:teams(*)')
        .eq('question_id', questionId);

      if (data) {
        setAnswers(data as AnswerWithTeam[]);
      }
      setLoading(false);
    };

    fetchAnswers();

    // リアルタイム購読
    const channel = supabase
      .channel(`answers-${questionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'answers',
          filter: `question_id=eq.${questionId}`,
        },
        async () => {
          // 変更があったら再取得（team情報も含めるため）
          const { data } = await supabase
            .from('answers')
            .select('*, team:teams(*)')
            .eq('question_id', questionId);

          if (data) {
            setAnswers(data as AnswerWithTeam[]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [questionId]);

  return { answers, loading };
}
