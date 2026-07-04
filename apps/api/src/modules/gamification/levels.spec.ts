import { levelFromXp, xpRequiredForLevel, XP_REWARDS } from './levels';

describe('levels', () => {
  it('começa no nível 1 — Discípulo', () => {
    const info = levelFromXp(0);
    expect(info.level).toBe(1);
    expect(info.title).toBe('Discípulo');
    expect(info.progress).toBe(0);
  });

  it('sobe de nível conforme o XP acumula', () => {
    expect(levelFromXp(xpRequiredForLevel(2)).level).toBe(2);
    expect(levelFromXp(xpRequiredForLevel(5)).level).toBe(5);
    expect(levelFromXp(xpRequiredForLevel(5)).title).toBe('Servo');
    expect(levelFromXp(xpRequiredForLevel(10)).title).toBe('Obreiro');
    expect(levelFromXp(xpRequiredForLevel(50)).title).toBe('Embaixador');
  });

  it('progresso fica sempre entre 0 e 1', () => {
    for (const xp of [0, 50, 500, 5_000, 50_000, 500_000]) {
      const { progress } = levelFromXp(xp);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    }
  });

  it('a curva é crescente e monotônica', () => {
    let prev = 0;
    for (let lv = 2; lv <= 60; lv++) {
      const cost = xpRequiredForLevel(lv);
      expect(cost).toBeGreaterThan(prev);
      prev = cost;
    }
  });

  it('recompensas seguem a tabela do produto', () => {
    expect(XP_REWARDS.DEVOCIONAL).toBe(20);
    expect(XP_REWARDS.CULTO).toBe(50);
    expect(XP_REWARDS.EVENTO).toBe(80);
    expect(XP_REWARDS.RETIRO).toBe(150);
    expect(XP_REWARDS.EVANGELISMO).toBe(120);
    expect(XP_REWARDS.SERVICO).toBe(70);
  });
});
