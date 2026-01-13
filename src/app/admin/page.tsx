'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { QuestionCard } from '@/components/shared/QuestionCard';
import { Leaderboard } from '@/components/shared/Leaderboard';
import { HamburgerMenu } from '@/components/shared/HamburgerMenu';
import { HistoryModal } from '@/components/shared/HistoryModal';
import { useRealtimeSession } from '@/hooks/useRealtimeSession';
import { useRealtimeQuestion } from '@/hooks/useRealtimeQuestion';
import { useRealtimeAnswers } from '@/hooks/useRealtimeAnswers';
import { useRealtimeTeams } from '@/hooks/useRealtimeTeams';
import { QuestionDetailModal } from '@/components/admin/QuestionDetailModal';
import { Question, QuestionType } from '@/lib/types';
import { TEAM_NAMES, STATUS_LABELS } from '@/lib/constants';
import QuizIcon from '@mui/icons-material/Quiz';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SettingsIcon from '@mui/icons-material/Settings';
import BarChartIcon from '@mui/icons-material/BarChart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import BoltIcon from '@mui/icons-material/Bolt';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import Looks3Icon from '@mui/icons-material/Looks3';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HomeIcon from '@mui/icons-material/Home';
import CelebrationIcon from '@mui/icons-material/Celebration';

function AdminContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session');

  const { session } = useRealtimeSession(sessionId);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const { question: currentQuestion } = useRealtimeQuestion(activeQuestionId);
  const { answers } = useRealtimeAnswers(currentQuestion?.id || null);
  const { teams } = useRealtimeTeams(sessionId);

  // セッションのcurrent_question_idが変更されたときのみactiveQuestionIdを更新
  useEffect(() => {
    if (session?.current_question_id) {
      setActiveQuestionId(session.current_question_id);
    }
  }, [session?.current_question_id]);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>('trifecta');
  const [newChoices, setNewChoices] = useState('');
  const [newFreeAnswerPoints, setNewFreeAnswerPoints] = useState(10);
  const [correctFirst, setCorrectFirst] = useState('');
  const [correctSecond, setCorrectSecond] = useState('');
  const [correctThird, setCorrectThird] = useState('');
  const [tieFirstSecond, setTieFirstSecond] = useState(false);
  const [tieSecondThird, setTieSecondThird] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [freeAnswerScores, setFreeAnswerScores] = useState<Record<string, boolean>>({});

  // 問題一覧を取得
  useEffect(() => {
    if (!sessionId) return;

    const fetchQuestions = async () => {
      const res = await fetch(`/api/questions?session_id=${sessionId}`);
      const data = await res.json();
      setQuestions(data);
    };

    fetchQuestions();
  }, [sessionId, currentQuestion?.status]);

  // セッション作成
  const handleCreateSession = async () => {
    if (!newSessionName) return;
    setLoading(true);

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSessionName }),
      });

      if (res.ok) {
        const session = await res.json();
        router.push(`/admin?session=${session.id}`);
        setShowCreateSession(false);
        setNewSessionName('');
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setLoading(false);
    }
  };

  // 問題作成
  const handleCreateQuestion = async () => {
    if (!sessionId || !newQuestionText) return;
    // 三連単の場合は選択肢が必須
    if (newQuestionType === 'trifecta' && !newChoices) return;
    setLoading(true);

    try {
      const choices = newQuestionType === 'trifecta'
        ? newChoices.split(/[,、\n]/).map((c) => c.trim()).filter(Boolean)
        : [];

      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question_text: newQuestionText,
          question_type: newQuestionType,
          choices,
          free_answer_points: newFreeAnswerPoints,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setQuestions([...questions, data]);
        setShowCreateQuestion(false);
        setNewQuestionText('');
        setNewQuestionType('trifecta');
        setNewChoices('');
        setNewFreeAnswerPoints(10);
      }
    } catch (error) {
      console.error('Failed to create question:', error);
    } finally {
      setLoading(false);
    }
  };

  // 出題開始
  const handleOpen = async (questionId: string) => {
    setLoading(true);
    try {
      await fetch(`/api/questions/${questionId}/open`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to open question:', error);
    } finally {
      setLoading(false);
    }
  };

  // 回答締切
  const handleClose = async (questionId: string) => {
    setLoading(true);
    try {
      await fetch(`/api/questions/${questionId}/close`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to close question:', error);
    } finally {
      setLoading(false);
    }
  };

  // 締め切り解除（再度回答受付）
  const handleReopen = async (questionId: string) => {
    setLoading(true);
    try {
      await fetch(`/api/questions/${questionId}/reopen`, { method: 'POST' });
      // 正解入力をリセット
      setCorrectFirst('');
      setCorrectSecond('');
      setCorrectThird('');
    } catch (error) {
      console.error('Failed to reopen question:', error);
    } finally {
      setLoading(false);
    }
  };

  // 結果発表（三連単）
  const handleReveal = async () => {
    if (!currentQuestion?.id || !correctFirst || !correctSecond || !correctThird) return;
    setLoading(true);

    try {
      await fetch(`/api/questions/${currentQuestion.id}/reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correct_first: correctFirst,
          correct_second: correctSecond,
          correct_third: correctThird,
          tie_first_second: tieFirstSecond,
          tie_second_third: tieSecondThird,
        }),
      });

      // リセット
      setCorrectFirst('');
      setCorrectSecond('');
      setCorrectThird('');
      setTieFirstSecond(false);
      setTieSecondThird(false);
    } catch (error) {
      console.error('Failed to reveal:', error);
    } finally {
      setLoading(false);
    }
  };

  // 自由回答の採点
  const handleScoreFreeAnswer = async () => {
    if (!currentQuestion?.id) return;
    setLoading(true);

    try {
      await fetch(`/api/questions/${currentQuestion.id}/score-free-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores: freeAnswerScores }),
      });

      // リセット
      setFreeAnswerScores({});
    } catch (error) {
      console.error('Failed to score free answer:', error);
    } finally {
      setLoading(false);
    }
  };

  // 採点のトグル
  const toggleFreeAnswerScore = (answerId: string) => {
    setFreeAnswerScores((prev) => {
      const current = prev[answerId];
      if (current === undefined) {
        return { ...prev, [answerId]: true }; // 未設定 → 正解
      } else if (current === true) {
        return { ...prev, [answerId]: false }; // 正解 → 不正解
      } else {
        const newScores = { ...prev };
        delete newScores[answerId]; // 不正解 → 未設定
        return newScores;
      }
    });
  };

  // チームの回答状況を取得
  const getTeamAnswer = (teamName: string) => {
    const team = teams.find((t) => t.name === teamName);
    if (!team) return null;
    return answers.find((a) => a.team_id === team.id);
  };

  // 最終結果発表
  const handleFinalResult = async () => {
    if (!sessionId) return;
    setLoading(true);

    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'finished' }),
      });
    } catch (error) {
      console.error('Failed to announce final result:', error);
    } finally {
      setLoading(false);
    }
  };

  // 全問題が終了したか判定
  const allQuestionsRevealed = questions.length > 0 && questions.every((q) => q.status === 'revealed');
  const isFinished = session?.status === 'finished';

  // 問題が出題可能かどうかを判定（順番通りの出題を強制）
  const canOpenQuestion = (q: Question): boolean => {
    // 第1問は常に出題可能（pending状態の場合）
    if (q.question_number === 1) return true;
    // 前の問題が revealed 状態でないと出題不可
    const prevQuestion = questions.find((pq) => pq.question_number === q.question_number - 1);
    return prevQuestion?.status === 'revealed';
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <SettingsIcon className="text-indigo-600" />
              管理者画面
            </h1>
            <HamburgerMenu sessionId={null} />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">セッションを作成</h2>
            {showCreateSession ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="セッション名（例: 2024年新年会）"
                  className="w-full px-4 py-2 border rounded-lg text-gray-800"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreateSession(false)}
                    className="px-4 py-2 border rounded-lg text-gray-800"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleCreateSession}
                    disabled={loading || !newSessionName}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                  >
                    作成
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCreateSession(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
              >
                新規セッション作成
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="text-indigo-600" />
            管理者画面
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{session?.name}</span>
            <HamburgerMenu
              sessionId={sessionId}
              onShowHistory={() => setShowHistory(true)}
              showDeleteSession
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左カラム: 現在の問題 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 現在の問題 */}
            {currentQuestion && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">現在の問題</h2>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentQuestion.status === 'open'
                        ? 'bg-green-100 text-green-800'
                        : currentQuestion.status === 'closed'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {STATUS_LABELS[currentQuestion.status]}
                  </span>
                </div>

                <QuestionCard question={currentQuestion} showStatus={false} />

                {/* 各チームの予想 */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <BarChartIcon className="text-indigo-600" />
                    各チームの{currentQuestion.question_type === 'free_answer' ? '回答' : '予想'}
                  </h3>
                  <div className="space-y-2">
                    {TEAM_NAMES.map((teamName) => {
                      const answer = getTeamAnswer(teamName);
                      return (
                        <div
                          key={teamName}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <span className="font-medium text-gray-800 w-16">チーム{teamName}</span>
                          {answer ? (
                            currentQuestion.question_type === 'free_answer' ? (
                              <>
                                <span className="flex-1 text-gray-700 px-2 break-words whitespace-pre-wrap">
                                  {answer.free_answer_text || '（空の回答）'}
                                </span>
                                <CheckCircleIcon className="text-green-600" fontSize="small" />
                              </>
                            ) : (
                              <>
                                <span className="flex-1 text-gray-700 flex items-center gap-1">
                                  <LooksOneIcon className="text-yellow-500" fontSize="small" />{answer.predict_first}
                                  <LooksTwoIcon className="text-gray-400" fontSize="small" />{answer.predict_second}
                                  <Looks3Icon className="text-orange-400" fontSize="small" />{answer.predict_third}
                                </span>
                                <CheckCircleIcon className="text-green-600" fontSize="small" />
                              </>
                            )
                          ) : (
                            <>
                              <span className="flex-1 text-gray-400">−未回答−</span>
                              <HourglassEmptyIcon className="text-yellow-500" fontSize="small" />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 操作パネル */}
                {currentQuestion.status === 'open' && (
                  <button
                    onClick={() => handleClose(currentQuestion.id)}
                    disabled={loading}
                    className="w-full py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <StopCircleIcon />
                    回答締切
                  </button>
                )}

                {currentQuestion.status === 'closed' && currentQuestion.question_type === 'trifecta' && (
                  <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                    <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                      <BoltIcon className="text-yellow-500" />
                      正解を入力（実際の結果）
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <LooksOneIcon className="text-yellow-500" />
                        <select
                          value={correctFirst}
                          onChange={(e) => setCorrectFirst(e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-lg text-gray-800"
                        >
                          <option value="">1着を選択</option>
                          {currentQuestion.choices
                            .filter((c) => c === correctFirst || (c !== correctSecond && c !== correctThird))
                            .map((c, idx) => (
                              <option key={`first-${idx}-${c}`} value={c}>
                                {c}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-3">
                        <LooksTwoIcon className="text-gray-400" />
                        <select
                          value={correctSecond}
                          onChange={(e) => setCorrectSecond(e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-lg text-gray-800"
                        >
                          <option value="">2着を選択</option>
                          {currentQuestion.choices
                            .filter((c) => c === correctSecond || (c !== correctFirst && c !== correctThird))
                            .map((c, idx) => (
                              <option key={`second-${idx}-${c}`} value={c}>
                                {c}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-3">
                        <Looks3Icon className="text-orange-400" />
                        <select
                          value={correctThird}
                          onChange={(e) => setCorrectThird(e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-lg text-gray-800"
                        >
                          <option value="">3着を選択</option>
                          {currentQuestion.choices
                            .filter((c) => c === correctThird || (c !== correctFirst && c !== correctSecond))
                            .map((c, idx) => (
                              <option key={`third-${idx}-${c}`} value={c}>
                                {c}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={tieFirstSecond}
                          onChange={(e) => setTieFirstSecond(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-800">1位と2位が同着</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={tieSecondThird}
                          onChange={(e) => setTieSecondThird(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-800">2位と3位が同着</span>
                      </label>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleReopen(currentQuestion.id)}
                        disabled={loading}
                        className="flex-1 py-3 border-2 border-green-600 text-green-600 font-semibold rounded-lg hover:bg-green-50 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <PlayArrowIcon />
                        締め切り解除
                      </button>
                      <button
                        onClick={handleReveal}
                        disabled={loading || !correctFirst || !correctSecond || !correctThird}
                        className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <GpsFixedIcon />
                        結果を確定して採点
                      </button>
                    </div>
                  </div>
                )}

                {/* 自由回答の採点パネル */}
                {currentQuestion.status === 'closed' && currentQuestion.question_type === 'free_answer' && (
                  <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                    <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                      <BoltIcon className="text-yellow-500" />
                      採点（タップで ⚪︎/× を切り替え）
                    </h3>
                    <p className="text-sm text-gray-500">
                      正解: {currentQuestion.free_answer_points}pt
                    </p>

                    <div className="space-y-2">
                      {TEAM_NAMES.map((teamName) => {
                        const answer = getTeamAnswer(teamName);
                        if (!answer) return null;

                        const score = freeAnswerScores[answer.id];
                        const isCorrect = score === true;
                        const isIncorrect = score === false;

                        return (
                          <div
                            key={teamName}
                            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                          >
                            <span className="font-medium text-gray-800 w-16">チーム{teamName}</span>
                            <span className="flex-1 text-gray-700 truncate px-2">
                              {answer.free_answer_text || '（空の回答）'}
                            </span>
                            <button
                              onClick={() => toggleFreeAnswerScore(answer.id)}
                              className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold transition-colors ${
                                isCorrect
                                  ? 'bg-green-500 text-white'
                                  : isIncorrect
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                              }`}
                            >
                              {isCorrect ? '⚪︎' : isIncorrect ? '×' : '−'}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleReopen(currentQuestion.id)}
                        disabled={loading}
                        className="flex-1 py-3 border-2 border-green-600 text-green-600 font-semibold rounded-lg hover:bg-green-50 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <PlayArrowIcon />
                        締め切り解除
                      </button>
                      <button
                        onClick={handleScoreFreeAnswer}
                        disabled={loading || Object.keys(freeAnswerScores).length === 0}
                        className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <GpsFixedIcon />
                        採点を確定
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 問題一覧 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">問題一覧</h2>
                <button
                  onClick={() => setShowCreateQuestion(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm flex items-center gap-1"
                >
                  <AddIcon fontSize="small" />
                  問題追加
                </button>
              </div>

              {showCreateQuestion && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                  {/* 問題タイプ選択 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNewQuestionType('trifecta')}
                      className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                        newQuestionType === 'trifecta'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <QuizIcon fontSize="small" />
                      三連単
                    </button>
                    <button
                      onClick={() => setNewQuestionType('free_answer')}
                      className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                        newQuestionType === 'free_answer'
                          ? 'bg-green-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <EditNoteIcon fontSize="small" />
                      自由回答
                    </button>
                  </div>

                  <input
                    type="text"
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder="問題文"
                    className="w-full px-3 py-2 border rounded-lg text-gray-800"
                  />

                  {newQuestionType === 'trifecta' ? (
                    <textarea
                      value={newChoices}
                      onChange={(e) => setNewChoices(e.target.value)}
                      placeholder="選択肢（カンマ区切りまたは改行）&#10;例: 田中, 佐藤, 鈴木"
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg text-gray-800"
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-700 whitespace-nowrap">正解ポイント:</label>
                      <input
                        type="number"
                        value={newFreeAnswerPoints}
                        onChange={(e) => setNewFreeAnswerPoints(parseInt(e.target.value) || 10)}
                        min={1}
                        className="w-20 px-3 py-2 border rounded-lg text-gray-800 text-center"
                      />
                      <span className="text-sm text-gray-500">pt</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowCreateQuestion(false);
                        setNewQuestionType('trifecta');
                        setNewChoices('');
                        setNewFreeAnswerPoints(10);
                      }}
                      className="px-4 py-2 border rounded-lg text-gray-800"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleCreateQuestion}
                      disabled={loading || !newQuestionText || (newQuestionType === 'trifecta' && !newChoices)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                    >
                      作成
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {questions.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => setSelectedQuestion(q)}
                  >
                    <div className="flex items-center gap-2">
                      {q.question_type === 'free_answer' ? (
                        <EditNoteIcon className="text-green-600" fontSize="small" />
                      ) : (
                        <QuizIcon className="text-indigo-600" fontSize="small" />
                      )}
                      <span className="font-medium text-gray-800">第{q.question_number}問:</span>{' '}
                      <span className="text-gray-700">{q.question_text}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          q.status === 'revealed'
                            ? 'bg-blue-100 text-blue-800'
                            : q.status === 'pending'
                            ? 'bg-gray-100 text-gray-600'
                            : q.status === 'closed'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {STATUS_LABELS[q.status]}
                      </span>
                      {q.status === 'pending' && (
                        currentQuestion?.status === 'closed' ? (
                          <span className="text-xs text-orange-600 font-medium">
                            ※先に採点を完了してください
                          </span>
                        ) : !canOpenQuestion(q) ? (
                          <span className="text-xs text-gray-500 font-medium">
                            ※前の問題を完了してください
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpen(q.id);
                            }}
                            disabled={loading || currentQuestion?.status === 'open'}
                            className="p-1.5 bg-green-600 text-white rounded-lg disabled:opacity-50"
                          >
                            <PlayArrowIcon fontSize="small" />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}

                {questions.length === 0 && (
                  <p className="text-gray-500 text-center py-4">問題がありません</p>
                )}
              </div>
            </div>

            {/* 最終結果発表ボタン */}
            {allQuestionsRevealed && !isFinished && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <CelebrationIcon />
                  全問題の結果発表が完了しました
                </h2>
                <p className="text-white/90 mb-4">
                  「最終結果発表」ボタンを押すと、各チームと閲覧者の画面に最終順位が表示されます。
                </p>
                <button
                  onClick={handleFinalResult}
                  disabled={loading}
                  className="w-full py-4 bg-white text-orange-600 font-bold text-lg rounded-lg hover:bg-orange-50 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CelebrationIcon />
                  最終結果発表
                </button>
              </div>
            )}

            {isFinished && (
              <div className="bg-green-100 border border-green-300 rounded-lg p-4 text-center">
                <p className="text-green-800 font-semibold flex items-center justify-center gap-2">
                  <CelebrationIcon className="text-green-600" />
                  最終結果発表済み
                </p>
              </div>
            )}
          </div>

          {/* 右カラム: リーダーボード */}
          <div>
            <Leaderboard teams={teams} editable />
          </div>
        </div>
      </div>

      {/* 過去の結果モーダル */}
      {showHistory && sessionId && (
        <HistoryModal
          sessionId={sessionId}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* 問題詳細モーダル */}
      {selectedQuestion && (
        <QuestionDetailModal
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
          onUpdate={(updatedQuestion) => {
            setQuestions(questions.map((q) =>
              q.id === updatedQuestion.id ? updatedQuestion : q
            ));
            setSelectedQuestion(updatedQuestion);
          }}
          onDelete={(questionId) => {
            setQuestions(questions.filter((q) => q.id !== questionId));
          }}
        />
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center">読み込み中...</div>}>
      <AdminContent />
    </Suspense>
  );
}
