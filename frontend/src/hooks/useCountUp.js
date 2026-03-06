import { useState, useEffect, useRef } from 'react';

/**
 * Anima um número de 'from' para 'to' em 'duration' ms.
 * Quando o valor muda para cima, o número "conta" suavemente.
 */
export function useCountUp(value, duration = 800) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const frameRef = useRef(null);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev === value) return;
    prevRef.current = value;

    // Só animar se for incremento (subida de saldo/lucro)
    if (value < prev) {
      setDisplay(value);
      return;
    }

    const start = Date.now();
    const diff = value - prev;

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Easing out — desacelera no final
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(prev + diff * ease);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };

    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(tick);

    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [value, duration]);

  return display;
}
