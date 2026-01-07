'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { QuizSession } from '@/lib/types';

export function useRealtimeSession(sessionId: string | null) {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // 初回取得
    const fetchSession = async () => {
      const { data } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (data) {
        setSession(data as QuizSession);
      }
      setLoading(false);
    };

    fetchSession();

    // リアルタイム購読
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quiz_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setSession(payload.new as QuizSession);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { session, loading };
}
