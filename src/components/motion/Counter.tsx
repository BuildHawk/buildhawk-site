"use client";

import { useEffect, useRef, useState } from "react";
import { easeOutCubic, formatNumber, prefersReducedMotion } from "@/lib/motion";

type Props = {
  /** Target value to count to. */
  to: number;
  /** Optional starting value. Default 0. */
  from?: number;
  /** Animation duration in ms. Default 1400. */
  duration?: number;
  /** Optional prefix (e.g. "$"). */
  prefix?: string;
  /** Optional suffix (e.g. "%", "+", "/yr"). */
  suffix?: string;
  /** className passthrough. */
  className?: string;
  /** When true, count is restartable. Default false. */
  repeatOnView?: boolean;
};

export default function Counter({
  to,
  from = 0,
  duration = 1400,
  prefix = "",
  suffix = "",
  className = "",
  repeatOnView = false,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(from);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = prefersReducedMotion();
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time set on mount when reduced-motion is preferred (matchMedia is client-only)
      setValue(to);
      return;
    }

    let raf = 0;

    const start = () => {
      startedRef.current = true;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = easeOutCubic(p);
        setValue(from + (to - from) * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            if (!startedRef.current || repeatOnView) {
              cancelAnimationFrame(raf);
              setValue(from);
              start();
            }
            if (!repeatOnView) obs.unobserve(el);
          }
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, [from, to, duration, repeatOnView]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatNumber(value)}
      {suffix}
    </span>
  );
}
