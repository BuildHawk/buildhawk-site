"use client";

import {
  createElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { prefersReducedMotion } from "@/lib/motion";

type Props = {
  children: ReactNode;
  /** Vertical translate distance in px when hidden. Default 24. */
  y?: number;
  /** Animation duration in ms. Default 700. */
  duration?: number;
  /** Delay in ms before this element starts. Default 0. */
  delay?: number;
  /** When true, only reveal once and never re-hide. Default true. */
  once?: boolean;
  /** Threshold for IntersectionObserver. Default 0.15. */
  threshold?: number;
  /** Optional className passthrough. */
  className?: string;
  /** Tag to render. Default div. */
  as?: keyof React.JSX.IntrinsicElements;
};

export default function Reveal({
  children,
  y = 24,
  duration = 700,
  delay = 0,
  once = true,
  threshold = 0.15,
  className = "",
  as = "div",
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read prefers-reduced-motion on mount; matchMedia is unavailable during SSR
    setReduce(prefersReducedMotion());
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reveal immediately when reduced motion is preferred
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            if (once) obs.unobserve(el);
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [once, threshold, reduce]);

  const style: React.CSSProperties = reduce
    ? {}
    : {
        opacity: visible ? 1 : 0,
        transform: visible ? "translate3d(0,0,0)" : `translate3d(0,${y}px,0)`,
        transition: `opacity ${duration}ms cubic-bezier(0.2,0.7,0.2,1) ${delay}ms, transform ${duration}ms cubic-bezier(0.2,0.7,0.2,1) ${delay}ms`,
        willChange: "opacity, transform",
      };

  // eslint-disable-next-line react-hooks/refs -- passing the ref object (not reading .current) to createElement
  return createElement(as, { ref, className, style }, children);
}
