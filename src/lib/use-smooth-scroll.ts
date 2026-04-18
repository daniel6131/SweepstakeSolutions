'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { useEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

export function useSmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
      });

      lenisRef.current = lenis;

      // Bridge Lenis to GSAP ticker — let the GSAP ticker drive Lenis RAF.
      // This keeps Lenis and ScrollTrigger in sync on the same frame.
      gsap.ticker.lagSmoothing(0);
      const tickerCallback = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tickerCallback);
      lenis.on('scroll', ScrollTrigger.update);

      return () => {
        gsap.ticker.remove(tickerCallback);
        lenis.off('scroll', ScrollTrigger.update);
        lenis.destroy();
        lenisRef.current = null;
      };
    });

    mm.add('(prefers-reduced-motion: reduce)', () => {
      // No smooth scroll — native scroll. Ensure ScrollTrigger uses native scroll.
      ScrollTrigger.normalizeScroll(false);
    });

    return () => mm.revert();
  }, []);

  return lenisRef;
}
