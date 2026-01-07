'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Question } from '@/lib/types';

export function useRealtimeQuestion(questionId: string | null) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!questionId) {
      setQuestion(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // 初回取得
    const fetchQuestion = async () => {
      const { data } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single();

      if (data) {
        setQuestion(data as Question);
      }
      setLoading(false);
    };

    fetchQuestion();

    // リアルタイム購読
    const channel = supabase
      .channel(`question-${questionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'questions',
          filter: `id=eq.${questionId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setQuestion(payload.new as Question);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [questionId]);

  return { question, loading };
}
