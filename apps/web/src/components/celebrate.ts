'use client';

import confetti from 'canvas-confetti';

/** Confetes dourados ao concluir missões / subir de nível. */
export function celebrate(big = false) {
  const colors = ['#D6BCFA', '#9F7AEA', '#805AD5', '#ffffff'];
  confetti({
    particleCount: big ? 160 : 70,
    spread: big ? 110 : 70,
    origin: { y: 0.7 },
    colors,
    disableForReducedMotion: true,
  });
  if (big) {
    setTimeout(
      () =>
        confetti({
          particleCount: 90,
          angle: 120,
          spread: 70,
          origin: { x: 1, y: 0.6 },
          colors,
          disableForReducedMotion: true,
        }),
      250,
    );
  }
}
