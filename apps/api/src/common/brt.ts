// Calendário oficial da plataforma: horário de Brasília (America/Sao_Paulo,
// UTC-3, sem horário de verão desde 2019). O servidor roda em UTC — sem este
// ajuste, o "dia" do devocional/missões viraria às 21h no Brasil.

export const BRT_OFFSET_MS = 3 * 3_600_000;

/** Meia-noite de hoje no calendário de Brasília, representada em UTC. */
export function todayBrt(now: Date = new Date()): Date {
  const shifted = new Date(now.getTime() - BRT_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return shifted;
}

/** Duas datas caem no mesmo dia do calendário de Brasília? */
export function sameBrtDay(a: Date, b: Date): boolean {
  return todayBrt(a).getTime() === todayBrt(b).getTime();
}

/** Dia do ano (1..366) no calendário de Brasília. */
export function dayOfYearBrt(now: Date = new Date()): number {
  const day = todayBrt(now);
  const startOfYear = Date.UTC(day.getUTCFullYear(), 0, 1);
  return Math.floor((day.getTime() - startOfYear) / 86_400_000) + 1;
}
