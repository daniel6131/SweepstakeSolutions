'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

type RevealOptions = {
  y?: number;
  x?: number;
  rotation?: number;
  scale?: number;
  duration?: number;
  delay?: number;
  stagger?: number;
  ease?: string;
};

/**
 * Hook that reveals child elements as they scroll into view.
 * Apply `data-reveal` to elements inside the container ref.
 */
export function useScrollReveal(opts: RevealOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const els = ref.current.querySelectorAll('[data-reveal]');
    if (!els.length) return;

    gsap.set(els, {
      y: opts.y ?? 50,
      x: opts.x ?? 0,
      opacity: 0,
      rotation: opts.rotation ?? 0,
      scale: opts.scale ?? 1,
    });

    const tl = gsap.to(els, {
      y: 0,
      x: 0,
      opacity: 1,
      rotation: 0,
      scale: 1,
      duration: opts.duration ?? 0.9,
      delay: opts.delay ?? 0,
      stagger: opts.stagger ?? 0.08,
      ease: opts.ease ?? 'expo.out',
      scrollTrigger: {
        trigger: ref.current,
        start: 'top 85%',
        once: true,
      },
    });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [
    opts.y,
    opts.x,
    opts.rotation,
    opts.scale,
    opts.duration,
    opts.delay,
    opts.stagger,
    opts.ease,
  ]);

  return ref;
}
