// Progressão de níveis. XP necessário cresce de forma suave para que
// o início seja recompensador e a constância seja o que sustenta o avanço.
export interface LevelInfo {
  level: number;
  title: string;
  xpForNext: number;
  xpIntoLevel: number;
  progress: number; // 0..1
}

const TITLES: Array<[number, string]> = [
  [1, 'Discípulo'],
  [5, 'Servo'],
  [10, 'Obreiro'],
  [20, 'Cooperador'],
  [30, 'Líder'],
  [40, 'Influenciador'],
  [50, 'Embaixador'],
];

export function xpRequiredForLevel(level: number): number {
  // custo cumulativo: 100 * nível^1.6
  return Math.round(100 * Math.pow(level, 1.6));
}

export function levelFromXp(xpTotal: number): LevelInfo {
  let level = 1;
  while (xpTotal >= xpRequiredForLevel(level + 1)) level++;

  const currentFloor = level === 1 ? 0 : xpRequiredForLevel(level);
  const nextFloor = xpRequiredForLevel(level + 1);
  const xpIntoLevel = xpTotal - currentFloor;
  const xpForNext = nextFloor - currentFloor;

  const title = [...TITLES].reverse().find(([lv]) => level >= lv)?.[1] ??
    'Discípulo';

  return {
    level,
    title,
    xpForNext,
    xpIntoLevel,
    progress: Math.min(1, xpIntoLevel / xpForNext),
  };
}

// Recompensas padrão por ação
export const XP_REWARDS = {
  DEVOCIONAL: 20,
  ORACAO: 15,
  CULTO: 50,
  EVENTO: 80,
  RETIRO: 150,
  EVANGELISMO: 120,
  SERVICO: 70,
  CIRCULO_ORACAO: 40,
  INTERCESSAO: 5,
  TESTEMUNHO: 25,
} as const;
