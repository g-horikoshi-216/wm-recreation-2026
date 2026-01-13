import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 問題作成
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { session_id, question_text, question_type = 'trifecta', choices, free_answer_points = 10 } = body;

    if (!session_id || !question_text) {
      return NextResponse.json(
        { error: 'session_id, question_text は必須です' },
        { status: 400 }
      );
    }

    // 三連単の場合は選択肢が必須
    if (question_type === 'trifecta' && !choices) {
      return NextResponse.json(
        { error: '三連単問題では choices は必須です' },
        { status: 400 }
      );
    }

    // 現在の問題数を取得
    const { count } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session_id);

    const question_number = (count || 0) + 1;

    // 自由回答の場合は選択肢を空配列に
    const insertData = {
      session_id,
      question_number,
      question_text,
      question_type,
      choices: question_type === 'free_answer' ? [] : choices,
      free_answer_points: question_type === 'free_answer' ? free_answer_points : 10,
      ...body,
    };

    const { data, error } = await supabase
      .from('questions')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Question creation error:', error);
    return NextResponse.json({ error: '問題の作成に失敗しました' }, { status: 500 });
  }
}

// 問題一覧取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    let query = supabase.from('questions').select('*').order('question_number', { ascending: true });

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Question fetch error:', error);
    return NextResponse.json({ error: '問題の取得に失敗しました' }, { status: 500 });
  }
}
