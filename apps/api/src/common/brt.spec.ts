import { dayOfYearBrt, sameBrtDay, todayBrt } from './brt';

describe('calendário de Brasília', () => {
  it('antes das 21h UTC-0 (18h BRT), o dia é o mesmo do UTC', () => {
    const now = new Date('2026-07-05T19:40:00Z'); // 16h40 em Brasília
    expect(todayBrt(now).toISOString()).toBe('2026-07-05T00:00:00.000Z');
  });

  it('depois das 21h de Brasília o dia AINDA é o mesmo (não vira antes da meia-noite BRT)', () => {
    // 23h30 de 5 de julho em Brasília = 02h30 de 6 de julho em UTC
    const lateEvening = new Date('2026-07-06T02:30:00Z');
    expect(todayBrt(lateEvening).toISOString()).toBe(
      '2026-07-05T00:00:00.000Z',
    );
  });

  it('vira o dia exatamente à meia-noite de Brasília (03h UTC)', () => {
    const justBefore = new Date('2026-07-06T02:59:59Z');
    const justAfter = new Date('2026-07-06T03:00:01Z');
    expect(todayBrt(justBefore).getUTCDate()).toBe(5);
    expect(todayBrt(justAfter).getUTCDate()).toBe(6);
  });

  it('sameBrtDay agrupa noite e manhã do mesmo dia brasileiro', () => {
    const morning = new Date('2026-07-05T12:00:00Z'); // 9h BRT do dia 5
    const night = new Date('2026-07-06T01:00:00Z'); // 22h BRT do dia 5
    const nextDay = new Date('2026-07-06T12:00:00Z'); // 9h BRT do dia 6
    expect(sameBrtDay(morning, night)).toBe(true);
    expect(sameBrtDay(night, nextDay)).toBe(false);
  });

  it('dia do ano segue o calendário brasileiro', () => {
    // 5 de julho de 2026 = dia 186 do ano
    expect(dayOfYearBrt(new Date('2026-07-05T19:00:00Z'))).toBe(186);
    // às 22h BRT do dia 5 continua 186 (no UTC já seria dia 6/187)
    expect(dayOfYearBrt(new Date('2026-07-06T01:00:00Z'))).toBe(186);
  });
});
