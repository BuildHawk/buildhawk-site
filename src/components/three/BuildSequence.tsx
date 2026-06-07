"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Scroll-driven sequence: foundation slab → frame → cladding panels → roof.
 * Camera does a slow lateral pan across the build as scrollProgress goes 0→1.
 */
function BuildScene({ p }: { p: number }) {

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    state.camera.position.x = -2 + p * 4;
    state.camera.position.y = 4 + Math.sin(t * 0.1) * 0.05;
    state.camera.position.z = 12 - p * 1.5;
    state.camera.lookAt(0, 1.5, 0);
  });

  // Stage thresholds
  const slabOn = p > 0.0;
  const frameOn = p > 0.18;
  const claddingOn = p > 0.42;
  const roofOn = p > 0.65;
  const detailOn = p > 0.85;

  const W = 8;
  const D = 5;
  const wallH = 3;
  const ridgeH = 4.6;

  // Build frame line points
  const framePos: number[] = [];
  const push = (a: [number, number, number], b: [number, number, number]) => framePos.push(...a, ...b);
  const halfW = W / 2;
  const halfD = D / 2;
  // top plates
  push([-halfW, wallH, -halfD], [halfW, wallH, -halfD]);
  push([halfW, wallH, -halfD], [halfW, wallH, halfD]);
  push([halfW, wallH, halfD], [-halfW, wallH, halfD]);
  push([-halfW, wallH, halfD], [-halfW, wallH, -halfD]);
  // studs
  for (let x = -halfW; x <= halfW + 0.001; x += 1) {
    push([x, 0.2, -halfD], [x, wallH, -halfD]);
    push([x, 0.2, halfD], [x, wallH, halfD]);
  }
  for (let z = -halfD + 1; z <= halfD - 1 + 0.001; z += 1) {
    push([-halfW, 0.2, z], [-halfW, wallH, z]);
    push([halfW, 0.2, z], [halfW, wallH, z]);
  }
  // ridge & rafters
  push([-halfW, ridgeH, 0], [halfW, ridgeH, 0]);
  for (let x = -halfW; x <= halfW + 0.001; x += 1) {
    push([x, ridgeH, 0], [x, wallH, -halfD]);
    push([x, ridgeH, 0], [x, wallH, halfD]);
  }

  return (
    <>
      {/* Slab */}
      {slabOn && (
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[W + 0.6, 0.2, D + 0.6]} />
          <meshBasicMaterial color="#bcbfcc" />
        </mesh>
      )}
      {slabOn && (
        <lineSegments position={[0, 0.05, 0]}>
          <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(W + 0.6, 0.2, D + 0.6)]} />
          <lineBasicMaterial color="#6e7180" />
        </lineSegments>
      )}

      {/* Frame */}
      {frameOn && (
        <lineSegments>
          <bufferGeometry attach="geometry">
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(framePos), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#6e7180"
            transparent
            opacity={Math.min(1, (p - 0.18) * 4)}
          />
        </lineSegments>
      )}

      {/* Cladding panels (translucent steel) */}
      {claddingOn && (
        <group>
          {[
            { p: [0, wallH / 2 + 0.1, halfD], r: [0, 0, 0], s: [W, wallH, 0.05] },
            { p: [0, wallH / 2 + 0.1, -halfD], r: [0, 0, 0], s: [W, wallH, 0.05] },
            { p: [halfW, wallH / 2 + 0.1, 0], r: [0, Math.PI / 2, 0], s: [D, wallH, 0.05] },
            { p: [-halfW, wallH / 2 + 0.1, 0], r: [0, Math.PI / 2, 0], s: [D, wallH, 0.05] },
          ].map((c, i) => (
            <mesh
              key={i}
              position={c.p as [number, number, number]}
              rotation={c.r as [number, number, number]}
            >
              <boxGeometry args={c.s as [number, number, number]} />
              <meshBasicMaterial
                color="#d3d6e0"
                transparent
                opacity={Math.min(0.85, (p - 0.42) * 3)}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* Roof planes */}
      {roofOn && (
        <group>
          {[
            { side: 1 },
            { side: -1 },
          ].map((r, i) => {
            const slope = Math.atan2(ridgeH - wallH, halfD);
            const length = Math.hypot(ridgeH - wallH, halfD);
            return (
              <mesh
                key={i}
                position={[0, (wallH + ridgeH) / 2, (halfD / 2) * r.side]}
                rotation={[r.side * slope, 0, 0]}
              >
                <boxGeometry args={[W + 0.4, 0.05, length]} />
                <meshBasicMaterial
                  color="#9da2b3"
                  transparent
                  opacity={Math.min(0.95, (p - 0.65) * 4)}
                />
              </mesh>
            );
          })}
        </group>
      )}

      {/* Detail accent: orange line traces under eave */}
      {detailOn && (
        <lineSegments>
          <bufferGeometry attach="geometry">
            <bufferAttribute
              attach="attributes-position"
              args={[
                new Float32Array([
                  -halfW, wallH + 0.1, halfD,
                  halfW, wallH + 0.1, halfD,
                  halfW, wallH + 0.1, halfD,
                  halfW, wallH + 0.1, -halfD,
                  halfW, wallH + 0.1, -halfD,
                  -halfW, wallH + 0.1, -halfD,
                  -halfW, wallH + 0.1, -halfD,
                  -halfW, wallH + 0.1, halfD,
                ]),
                3,
              ]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#de5123" />
        </lineSegments>
      )}
    </>
  );
}

export default function BuildSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Map progress to the range where the sticky inner panel is actually
      // pinned to the viewport: from when the section top hits the viewport
      // top (rect.top = 0) to when the section bottom hits the viewport top
      // (rect.top = -(rect.height - vh)). Earlier versions used the full
      // viewport traversal which meant p only ever covered 0.25 to 0.75
      // while the canvas was on screen, so the roof and detail stages
      // (thresholds 0.65 and 0.85) never reached full opacity before the
      // section scrolled away.
      const stickyTravel = Math.max(1, rect.height - vh);
      const passed = -rect.top;
      const np = Math.max(0, Math.min(1, passed / stickyTravel));
      setP(np);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const stages = [
    { label: "Estimate", at: 0.0 },
    { label: "Frame", at: 0.22 },
    { label: "Cladding", at: 0.5 },
    { label: "Roof", at: 0.72 },
    { label: "Handover", at: 0.92 },
  ];

  return (
    <div ref={containerRef} className="relative h-[300vh] w-full">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-bh-black text-bh-white">
        <div className="absolute inset-0">
          <Canvas
            dpr={[1, 2]}
            camera={{ position: [0, 4, 12], fov: 36 }}
            gl={{ antialias: true, alpha: true }}
            style={{ background: "transparent" }}
          >
            <BuildScene p={p} />
          </Canvas>
        </div>

        {/* Foreground content */}
        <div className="relative z-10 h-full mx-auto max-w-[1480px] px-6 md:px-10 flex flex-col">
          <div className="pt-28 md:pt-36">
            <p className="text-[11px] tracking-[0.2em] uppercase text-bh-steel">
              03 / How It Works
            </p>
            <h2 className="mt-4 font-medium tracking-[-0.03em] leading-[1.0] text-[36px] md:text-[56px] lg:text-[80px] max-w-3xl">
              From estimate to handover.
              <br />
              <span className="text-bh-steel">No improvisation.</span>
            </h2>
          </div>

          {/* Stage timeline */}
          <div className="mt-auto mb-16 md:mb-24">
            <div className="relative h-px w-full bg-bh-graphite/40">
              <div
                className="absolute left-0 top-0 h-px bg-bh-orange"
                style={{ width: `${p * 100}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-5 text-[11px] tracking-[0.18em] uppercase">
              {stages.map((s) => {
                const active = p >= s.at - 0.05;
                return (
                  <div
                    key={s.label}
                    className={`transition-colors ${
                      active ? "text-bh-white" : "text-bh-graphite"
                    }`}
                  >
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle ${
                        active ? "bg-bh-orange" : "bg-bh-graphite"
                      }`}
                    />
                    {s.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
