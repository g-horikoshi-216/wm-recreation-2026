// チーム対抗クイズアプリ 定数

import { TeamName } from './types';

export const TEAM_NAMES: TeamName[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

export const DEFAULT_POINTS = {
  trifecta: 50,   // 3連単
  exacta: 20,     // 2連単
  trio: 15,       // 3連複
  quinella: 10,   // 2連複
  win: 5,         // 単勝
  none: 0,
} as const;

export const RESULT_LABELS = {
  trifecta: '3連単',
  exacta: '2連単',
  trio: '3連複',
  quinella: '2連複',
  win: '単勝',
  none: 'ハズレ',
} as const;

export const STATUS_LABELS = {
  pending: '待機中',
  open: '回答受付中',
  closed: '回答締切',
  revealed: '結果発表済',
} as const;
