'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Team } from '@/lib/types';

export function useRealtimeTeams(sessionId: string | null) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setTeams([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // 初回取得
    const fetchTeams = async () => {
      const { data } = await supabase
        .from('teams')
        .select('*')
        .eq('session_id', sessionId)
        .order('total_score', { ascending: false });

      if (data) {
        setTeams(data as Team[]);
      }
      setLoading(false);
    };

    fetchTeams();

    // リアルタイム購読
    const channel = supabase
      .channel(`teams-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'teams',
          filter: `session_id=eq.${sessionId}`,
        },
        async () => {
          // 変更があったら再取得（ソート順を維持するため）
          const { data } = await supabase
            .from('teams')
            .select('*')
            .eq('session_id', sessionId)
            .order('total_score', { ascending: false });

          if (data) {
            setTeams(data as Team[]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { teams, loading };
}
