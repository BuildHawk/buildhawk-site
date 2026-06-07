"use client";

import { useEffect, useRef } from "react";

/**
 * Apple-style aurora background with cursor-parallax 3D depth.
 *
 * Three blurred colour orbs (orange / sky/violet / emerald) sit behind every
 * Command Centre surface. They drift on a gentle keyframe loop and gently
 * follow the cursor in 3D space so the page feels alive without being noisy.
 */
export default function GlassBackground({
  tone = "light",
}: {
  tone?: "light" | "dark";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const orbsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (window.matchMedia?.("(hover: none)").matches) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        // Each orb moves at a different speed/depth — parallax illusion
        const factors = [22, 14, 30];
        orbsRef.current.forEach((o, i) => {
          if (!o) return;
          const f = factors[i] ?? 18;
          o.style.transform = `translate3d(${(x * f).toFixed(1)}px, ${(y * f).toFixed(1)}px, 0)`;
        });
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const baseClass =
    tone === "dark"
      ? "fixed inset-0 -z-10 overflow-hidden bg-[#0A0E1A]"
      : "fixed inset-0 -z-10 overflow-hidden bg-[#F5F6FA]";

  const setRef = (i: number) => (el: HTMLDivElement | null) => {
    // eslint-disable-next-line react-hooks/refs -- ref-callback factory assigns to orbsRef.current during commit, not render
    orbsRef.current[i] = el;
  };

  return (
    <div ref={containerRef} className={baseClass} aria-hidden="true">
      <div
        ref={setRef(0)}
        className="absolute -top-40 -left-32 w-[44rem] h-[44rem] rounded-full opacity-50 blur-[120px] orb-float-a"
        style={{
          background:
            tone === "dark"
              ? "radial-gradient(circle, rgba(222,81,35,0.45) 0%, rgba(222,81,35,0) 60%)"
              : "radial-gradient(circle, rgba(222,81,35,0.35) 0%, rgba(222,81,35,0) 60%)",
          transition: "transform 180ms cubic-bezier(0.18,1.4,0.4,1)",
          willChange: "transform",
        }}
      />
      <div
        ref={setRef(1)}
        className="absolute top-1/3 -right-40 w-[40rem] h-[40rem] rounded-full opacity-40 blur-[120px] orb-float-b"
        style={{
          background:
            tone === "dark"
              ? "radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(99,102,241,0) 60%)"
              : "radial-gradient(circle, rgba(56,189,248,0.3) 0%, rgba(56,189,248,0) 60%)",
          transition: "transform 220ms cubic-bezier(0.18,1.4,0.4,1)",
          willChange: "transform",
        }}
      />
      <div
        ref={setRef(2)}
        className="absolute -bottom-40 left-1/3 w-[36rem] h-[36rem] rounded-full opacity-40 blur-[120px] orb-float-c"
        style={{
          background:
            tone === "dark"
              ? "radial-gradient(circle, rgba(16,185,129,0.35) 0%, rgba(16,185,129,0) 60%)"
              : "radial-gradient(circle, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0) 60%)",
          transition: "transform 260ms cubic-bezier(0.18,1.4,0.4,1)",
          willChange: "transform",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            tone === "dark"
              ? "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)"
              : "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.035) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
      <style jsx>{`
        @keyframes orbDriftA {
          0%,
          100% {
            margin-top: 0;
            margin-left: 0;
          }
          50% {
            margin-top: 22px;
            margin-left: 18px;
          }
        }
        @keyframes orbDriftB {
          0%,
          100% {
            margin-top: 0;
            margin-right: 0;
          }
          50% {
            margin-top: -24px;
            margin-right: 18px;
          }
        }
        @keyframes orbDriftC {
          0%,
          100% {
            margin-bottom: 0;
            margin-left: 0;
          }
          50% {
            margin-bottom: 22px;
            margin-left: -16px;
          }
        }
        :global(.orb-float-a) {
          animation: orbDriftA 14s ease-in-out infinite;
        }
        :global(.orb-float-b) {
          animation: orbDriftB 18s ease-in-out infinite;
        }
        :global(.orb-float-c) {
          animation: orbDriftC 22s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
