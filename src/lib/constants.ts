// チーム対抗クイズアプリ 定数

import { TeamName } from './types';

export const TEAM_NAMES: TeamName[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

export const DEFAULT_POINTS = {
  trifecta: 30,
  trio: 15,
  two: 5,
  one: 1,
  none: 0,
} as const;

export const RESULT_LABELS = {
  trifecta: '三連単',
  trio: '三連複',
  two: '2的中',
  one: '1的中',
  none: 'ハズレ',
} as const;

export const STATUS_LABELS = {
  pending: '待機中',
  open: '回答受付中',
  closed: '回答締切',
  revealed: '結果発表済',
} as const;
