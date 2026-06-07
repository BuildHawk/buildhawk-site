"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import HouseFrame from "./HouseFrame";

function CameraRig() {
  const { camera } = useThree();
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1; // -1..1
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      target.current.x = x;
      target.current.y = y;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // eslint-disable-next-line react-hooks/immutability -- react-three-fiber: mutating camera in the useFrame loop is the intended r3f pattern
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Base position with subtle ambient drift, then add cursor parallax on top.
    const baseX = 9 + Math.sin(t * 0.05) * 0.15;
    const baseY = 6 + Math.sin(t * 0.04) * 0.1;
    const baseZ = 14;
    const parX = target.current.x * 1.4;
    const parY = -target.current.y * 0.7;
    // Lerp toward target for smoothness
    // eslint-disable-next-line react-hooks/immutability -- react-three-fiber: per-frame camera lerp mutates camera.position by design
    camera.position.x += (baseX + parX - camera.position.x) * 0.045;
    camera.position.y += (baseY + parY - camera.position.y) * 0.045;
    camera.position.z += (baseZ - camera.position.z) * 0.045;
    camera.lookAt(0, 1.4, 0);
  });
  return null;
}

export default function HeroCanvas() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const dur = 1600;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [9, 6, 14], fov: 38, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <CameraRig />
        <HouseFrame progress={progress} />
      </Suspense>
    </Canvas>
  );
}
