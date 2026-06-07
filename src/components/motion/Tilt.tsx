"use client";

import {
  createElement,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { clamp, prefersReducedMotion } from "@/lib/motion";

type Props = {
  children: ReactNode;
  /** Max rotation in degrees on each axis. Default 5. Apple-grade subtle. */
  max?: number;
  /** Z-axis lift in px on hover. Default 6. */
  lift?: number;
  /** Optional className passthrough. */
  className?: string;
  /** Render as a different element. Default div. */
  as?: keyof React.JSX.IntrinsicElements;
  /** Optional inline style. */
  style?: React.CSSProperties;
};

export default function Tilt({
  children,
  max = 5,
  lift = 6,
  className = "",
  as = "div",
  style,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;

    let raf = 0;
    let targetRx = 0;
    let targetRy = 0;
    let targetZ = 0;
    let curRx = 0;
    let curRy = 0;
    let curZ = 0;

    const apply = () => {
      curRx += (targetRx - curRx) * 0.18;
      curRy += (targetRy - curRy) * 0.18;
      curZ += (targetZ - curZ) * 0.18;
      el.style.transform = `perspective(1000px) rotateX(${curRx.toFixed(
        3
      )}deg) rotateY(${curRy.toFixed(3)}deg) translateZ(${curZ.toFixed(2)}px)`;
      if (
        Math.abs(targetRx - curRx) > 0.01 ||
        Math.abs(targetRy - curRy) > 0.01 ||
        Math.abs(targetZ - curZ) > 0.01
      ) {
        raf = requestAnimationFrame(apply);
      }
    };

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      targetRy = clamp((px - 0.5) * 2 * max, -max, max);
      targetRx = clamp(-(py - 0.5) * 2 * max, -max, max);
      targetZ = lift;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      targetRx = 0;
      targetRy = 0;
      targetZ = 0;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };

    el.style.transformStyle = "preserve-3d";
    el.style.willChange = "transform";
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [max, lift]);

  // eslint-disable-next-line react-hooks/refs -- passing the ref object (not reading .current) to createElement
  return createElement(as, { ref, className, style }, children);
}
