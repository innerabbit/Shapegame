'use client';

import { useEffect, useRef } from 'react';
import { Application } from '@splinetool/runtime';

const SCENE_URL = 'https://prod.spline.design/f0yF1oYeO50SDQs1/scene.splinecode?v=2';

export function SplineWallpaper() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const app = new Application(canvas);
    app.load(SCENE_URL);

    return () => {
      app.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'auto',
      }}
    />
  );
}
