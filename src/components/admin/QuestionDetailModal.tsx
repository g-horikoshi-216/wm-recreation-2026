'use client';

import { useState, useEffect } from 'react';
import { Question, Answer } from '@/lib/types';
import { STATUS_LABELS, TEAM_NAMES } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import Looks3Icon from '@mui/icons-material/Looks3';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BoltIcon from '@mui/icons-material/Bolt';
import QuizIcon from '@mui/icons-material/Quiz';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface QuestionDetailModalProps {
  question: Question;
  onClose: () => void;
  onUpdate: (updatedQuestion: Question) => void;
  onDelete: (questionId: string) => void;
}

export function QuestionDetailModal({
  question,
  onClose,
  onUpdate,
  onDelete,
}: QuestionDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editQuestionText, setEditQuestionText] = useState(question.question_text);
  const [editChoices, setEditChoices] = useState(question.choices.join('\n'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 正解入力用のステート（三連単）
  const [correctFirst, setCorrectFirst] = useState('');
  const [correctSecond, setCorrectSecond] = useState('');
  const [correctThird, setCorrectThird] = useState('');
  const [tieFirstSecond, setTieFirstSecond] = useState(false);
  const [tieSecondThird, setTieSecondThird] = useState(false);

  // 自由回答用のステート
  const [freeAnswers, setFreeAnswers] = useState<(Answer & { team_name: string })[]>([]);
  const [scoringStatus, setScoringStatus] = useState<Record<string, boolean | null>>({});
  const [scoringInProgress, setScoringInProgress] = useState(false);

  // 自由回答の回答データを取得
  useEffect(() => {
    if (question.question_type !== 'free_answer' || !question.id) return;

    const fetchFreeAnswers = async () => {
      const supabase = createClient();
      const { data: answers } = await supabase
        .from('answers')
        .select('*, teams!inner(name)')
        .eq('question_id', question.id);

      if (answers) {
        const answersWithTeamName = answers.map((a) => ({
          ...a,
          team_name: (a.teams as { name: string }).name,
        }));
        setFreeAnswers(answersWithTeamName);
        // 現在の採点状態を初期化
        const initialStatus: Record<string, boolean | null> = {};
        answersWithTeamName.forEach((a) => {
          initialStatus[a.id] = a.is_correct;
        });
        setScoringStatus(initialStatus);
      }
    };

    fetchFreeAnswers();
  }, [question.id, question.question_type]);

  // 自由回答の採点を実行
  const handleScoreFreeAnswer = async (answerId: string, isCorrect: boolean) => {
    const currentStatus = scoringStatus[answerId];
    // 同じボタンを押したら未設定に戻す
    const newStatus = currentStatus === isCorrect ? null : isCorrect;
    setScoringStatus((prev) => ({ ...prev, [answerId]: newStatus }));
  };

  // 自由回答の結果確定
  const handleRevealFreeAnswer = async () => {
    // 全回答の採点状態を確認
    const hasUnscored = freeAnswers.some((a) => scoringStatus[a.id] === null || scoringStatus[a.id] === undefined);
    if (hasUnscored) {
      if (!confirm('未採点の回答があります。続行しますか？（未採点は不正解扱いになります）')) {
        return;
      }
    }

    setScoringInProgress(true);
    setError('');

    try {
      // 各回答を採点
      for (const answer of freeAnswers) {
        const isCorrect = scoringStatus[answer.id] === true;
        await fetch(`/api/questions/${question.id}/score-free-answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answer_id: answer.id,
            is_correct: isCorrect,
          }),
        });
      }

      const updatedQuestion = {
        ...question,
        status: 'revealed' as const,
      };
      onUpdate(updatedQuestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : '採点に失敗しました');
    } finally {
      setScoringInProgress(false);
    }
  };

  const canEdit = question.status === 'pending';
  const isOpen = question.status === 'open';
  const isClosed = question.status === 'closed';
  const isRevealed = question.status === 'revealed';

  const handleSave = async () => {
    if (!editQuestionText) {
      setError('問題文は必須です');
      return;
    }
    // 三連単の場合のみ選択肢が必須
    if (question.question_type === 'trifecta' && !editChoices.trim()) {
      setError('選択肢は必須です');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const choices = question.question_type === 'trifecta'
        ? editChoices.split(/[\n,、]/).map((c) => c.trim()).filter(Boolean)
        : [];

      const res = await fetch(`/api/questions/${question.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: editQuestionText,
          choices,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '更新に失敗しました');
      }

      const updatedQuestion = await res.json();
      onUpdate(updatedQuestion);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('この問題を削除しますか？')) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/questions/${question.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '削除に失敗しました');
      }

      onDelete(question.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 回答締め切り
  const handleClose = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/questions/${question.id}/close`, { method: 'POST' });
      if (!res.ok) throw new Error('締め切りに失敗しました');
      const updatedQuestion = { ...question, status: 'closed' as const };
      onUpdate(updatedQuestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : '締め切りに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 締め切り解除
  const handleReopen = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/questions/${question.id}/reopen`, { method: 'POST' });
      if (!res.ok) throw new Error('締め切り解除に失敗しました');
      const updatedQuestion = { ...question, status: 'open' as const };
      onUpdate(updatedQuestion);
      setCorrectFirst('');
      setCorrectSecond('');
      setCorrectThird('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '締め切り解除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 結果発表・採点
  const handleReveal = async () => {
    if (!correctFirst || !correctSecond || !correctThird) {
      setError('1着・2着・3着をすべて選択してください');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/questions/${question.id}/reveal`, {
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
      if (!res.ok) throw new Error('結果発表に失敗しました');
      const updatedQuestion = {
        ...question,
        status: 'revealed' as const,
        correct_first: correctFirst,
        correct_second: correctSecond,
        correct_third: correctThird,
        tie_first_second: tieFirstSecond,
        tie_second_third: tieSecondThird,
      };
      onUpdate(updatedQuestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : '結果発表に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-800">
              第{question.question_number}問
            </h2>
            <span
              className={`px-2 py-1 text-xs rounded ${
                question.status === 'revealed'
                  ? 'bg-blue-100 text-blue-800'
                  : question.status === 'pending'
                  ? 'bg-gray-100 text-gray-600'
                  : question.status === 'closed'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {STATUS_LABELS[question.status]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <CloseIcon className="text-gray-500" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {isEditing ? (
            /* 編集モード */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  問題文
                </label>
                <input
                  type="text"
                  value={editQuestionText}
                  onChange={(e) => setEditQuestionText(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-gray-800"
                />
              </div>
              {question.question_type === 'trifecta' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    選択肢（改行またはカンマ区切り）
                  </label>
                  <textarea
                    value={editChoices}
                    onChange={(e) => setEditChoices(e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 border rounded-lg text-gray-800"
                  />
                </div>
              )}
            </div>
          ) : (
            /* 表示モード */
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {question.question_type === 'free_answer' ? (
                  <EditNoteIcon className="text-green-600" />
                ) : (
                  <QuizIcon className="text-indigo-600" />
                )}
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  question.question_type === 'free_answer'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {question.question_type === 'free_answer' ? '自由回答' : '三連単'}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">問題文</h3>
                <p className="text-gray-800 text-lg">{question.question_text}</p>
              </div>
              {question.question_type === 'trifecta' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">選択肢</h3>
                  <div className="flex flex-wrap gap-2">
                    {question.choices.map((choice, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {choice}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 結果発表済みの場合は正解を表示（三連単） */}
              {isRevealed && question.question_type === 'trifecta' && (
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">正解</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <LooksOneIcon className="text-yellow-500" />
                      <span className="text-gray-800 font-medium">
                        {question.correct_first}
                        {question.tie_first_second && ' (同着)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <LooksTwoIcon className="text-gray-400" />
                      <span className="text-gray-800 font-medium">
                        {question.correct_second}
                        {(question.tie_first_second || question.tie_second_third) && ' (同着)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Looks3Icon className="text-orange-400" />
                      <span className="text-gray-800 font-medium">
                        {question.correct_third}
                        {question.tie_second_third && ' (同着)'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 結果発表済みの場合は採点結果を表示（自由回答） */}
              {isRevealed && question.question_type === 'free_answer' && freeAnswers.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">採点結果</h3>
                  <div className="space-y-2">
                    {TEAM_NAMES.map((teamName) => {
                      const answer = freeAnswers.find((a) => a.team_name === teamName);
                      if (!answer) return null;
                      return (
                        <div key={teamName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-gray-800">チーム{teamName}: </span>
                            <span className="text-gray-600">{answer.free_answer_text}</span>
                          </div>
                          <span className={`ml-2 text-xl font-bold ${
                            answer.is_correct ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {answer.is_correct ? '⚪︎' : '×'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 配点情報 */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-500 mb-2">配点</h3>
                {question.question_type === 'free_answer' ? (
                  <div className="bg-green-50 p-3 rounded text-center">
                    <div className="text-green-600 font-medium">正解</div>
                    <div className="text-gray-800 text-lg font-bold">{question.free_answer_points}pt</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-sm">
                    <div className="bg-yellow-50 p-2 rounded text-center">
                      <div className="text-yellow-600 font-medium">3連単</div>
                      <div className="text-gray-800">{question.points_trifecta}pt</div>
                    </div>
                    <div className="bg-orange-50 p-2 rounded text-center">
                      <div className="text-orange-600 font-medium">2連単</div>
                      <div className="text-gray-800">{question.points_exacta}pt</div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded text-center">
                      <div className="text-purple-600 font-medium">3連複</div>
                      <div className="text-gray-800">{question.points_trio}pt</div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded text-center">
                      <div className="text-blue-600 font-medium">2連複</div>
                      <div className="text-gray-800">{question.points_quinella}pt</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded text-center">
                      <div className="text-green-600 font-medium">単勝</div>
                      <div className="text-gray-800">{question.points_win}pt</div>
                    </div>
                  </div>
                )}
              </div>

              {/* 回答受付中: 締め切りボタン */}
              {isOpen && (
                <div className="pt-4 border-t">
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className="w-full py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <StopCircleIcon />
                    回答締切
                  </button>
                </div>
              )}

              {/* 締め切り後: 採点 */}
              {isClosed && question.question_type === 'free_answer' && (
                <div className="pt-4 border-t space-y-4">
                  <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                    <BoltIcon className="text-yellow-500" />
                    回答の採点
                  </h3>

                  {freeAnswers.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">回答がありません</p>
                  ) : (
                    <div className="space-y-3">
                      {TEAM_NAMES.map((teamName) => {
                        const answer = freeAnswers.find((a) => a.team_name === teamName);
                        if (!answer) {
                          return (
                            <div key={teamName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <span className="font-medium text-gray-800">チーム{teamName}</span>
                                <span className="text-gray-400 ml-2">未回答</span>
                              </div>
                            </div>
                          );
                        }
                        const currentStatus = scoringStatus[answer.id];
                        return (
                          <div key={teamName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-gray-800">チーム{teamName}</span>
                              <p className="text-gray-600 break-words whitespace-pre-wrap">{answer.free_answer_text}</p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleScoreFreeAnswer(answer.id, true)}
                                className={`p-2 rounded-full transition-colors ${
                                  currentStatus === true
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-600 hover:bg-green-100'
                                }`}
                              >
                                <CheckCircleIcon />
                              </button>
                              <button
                                onClick={() => handleScoreFreeAnswer(answer.id, false)}
                                className={`p-2 rounded-full transition-colors ${
                                  currentStatus === false
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-200 text-gray-600 hover:bg-red-100'
                                }`}
                              >
                                <CancelIcon />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleReopen}
                      disabled={loading || scoringInProgress}
                      className="flex-1 py-3 border-2 border-green-600 text-green-600 font-semibold rounded-lg hover:bg-green-50 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <PlayArrowIcon />
                      締め切り解除
                    </button>
                    <button
                      onClick={handleRevealFreeAnswer}
                      disabled={loading || scoringInProgress}
                      className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <GpsFixedIcon />
                      {scoringInProgress ? '採点中...' : '結果を確定して採点'}
                    </button>
                  </div>
                </div>
              )}

              {/* 締め切り後: 正解入力（三連単） */}
              {isClosed && question.question_type === 'trifecta' && (
                <div className="pt-4 border-t space-y-4">
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
                        {question.choices
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
                        {question.choices
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
                        {question.choices
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
                      onClick={handleReopen}
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
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex justify-between items-center p-4 border-t bg-gray-50">
          {canEdit ? (
            isEditing ? (
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditQuestionText(question.question_text);
                    setEditChoices(question.choices.join('\n'));
                    setError('');
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <SaveIcon fontSize="small" />
                  保存
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 flex items-center gap-1"
                >
                  <DeleteIcon fontSize="small" />
                  削除
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <EditIcon fontSize="small" />
                  編集
                </button>
              </>
            )
          ) : isRevealed ? (
            <div className="w-full text-center text-sm text-gray-500">
              結果発表済みの問題は編集できません
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
