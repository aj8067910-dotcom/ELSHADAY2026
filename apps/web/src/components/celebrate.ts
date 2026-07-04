'use client';

import confetti from 'canvas-confetti';

/** Confetes dourados ao concluir missões / subir de nível. */
export function celebrate(big = false) {
  const colors = ['#F2D98D', '#D4AF37', '#B3922B', '#ffffff'];
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
