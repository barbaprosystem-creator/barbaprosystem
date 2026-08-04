import { useRef, useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stage, OrbitControls, useGLTF, Loader, useProgress } from '@react-three/drei';
import { Maximize2, Minimize2, RotateCcw } from 'lucide-react';

/* ───────────────────────────── Model Mesh ──────────────────────────── */
function Model({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

/* ─────────────────── Inner loading overlay (in-canvas) ──────────────── */
function LoadingOverlay() {
  const { progress } = useProgress();
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
      <div className="w-16 h-16 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
      <p className="mt-4 text-sm font-semibold text-[#888888] tracking-wide">
        Cargando modelo 3D… {Math.round(progress)}%
      </p>
    </div>
  );
}

/* ═══════════════════════════ Main Component ══════════════════════════ */
export default function ModelViewer({ modelUrl }) {
  const containerRef = useRef(null);
  const controlsRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);

  /* ─── Fullscreen toggle ─── */
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      /* Fullscreen not supported or denied */
    }
  }, []);

  /* Listen for external fullscreen exit (e.g. Esc key) */
  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  /* ─── Reset camera ─── */
  const resetCamera = useCallback(() => {
    controlsRef.current?.reset();
  }, []);

  /* ─── Error boundary for the model ─── */
  if (hasError) {
    return (
      <div className="relative bg-[#0d0d0d] border border-[#2a2a2a]/60 rounded-2xl shadow-2xl h-[450px] md:h-[600px] flex items-center justify-center">
        <div className="text-center px-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-lg font-bold text-[#f0f0f0] mb-2">Error loading 3D model</h3>
          <p className="text-sm text-[#888888] max-w-xs mx-auto">
            The 3D file could not be loaded. Please verify the file URL is valid and the format is .glb.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onFullscreenChange={handleFullscreenChange}
      className="relative bg-[#0d0d0d] border border-[#2a2a2a]/60 rounded-2xl shadow-2xl h-[450px] md:h-[600px] overflow-hidden group"
    >
      {/* ─── Canvas ─── */}
      <Suspense fallback={<LoadingOverlay />}>
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ fov: 45, position: [0, 2, 6] }}
          gl={{ antialias: true, alpha: true }}
          onError={() => setHasError(true)}
          style={{ background: 'transparent' }}
        >
          <Stage
            environment="city"
            intensity={0.6}
            adjustCamera={1.5}
            shadows={{ type: 'contact', opacity: 0.4, blur: 2 }}
          >
            <Model url={modelUrl} />
          </Stage>

          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minPolarAngle={0}
            maxPolarAngle={Math.PI}
            dampingFactor={0.08}
            enableDamping
            makeDefault
          />
        </Canvas>
      </Suspense>

      {/* ─── Loader bar at the bottom (drei) ─── */}
      <Loader
        containerStyles={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'transparent',
        }}
        barStyles={{
          height: '4px',
          background: 'linear-gradient(90deg, #8b5cf6, #6366f1, #3b82f6)',
          borderRadius: '0 0 16px 16px',
        }}
        dataStyles={{ display: 'none' }}
        dataInterpolation={(p) => `${p.toFixed(0)}%`}
      />

      {/* ─── Hint overlay (top-left) ─── */}
      <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/5 opacity-60 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none select-none">
        <span className="text-xs">🖱️</span>
        <span className="text-[11px] font-medium text-[#c0c0c0]">
          Mantén presionado y arrastra para explorar en 3D
        </span>
      </div>

      {/* ─── Floating controls (top-right) ─── */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
        {/* Reset camera */}
        <button
          onClick={resetCamera}
          className="w-9 h-9 rounded-xl bg-black/60 backdrop-blur-md border border-white/5 flex items-center justify-center text-[#c0c0c0] hover:text-white hover:bg-violet-600/40 hover:border-violet-500/30 transition-all"
          title="Reset camera"
        >
          <RotateCcw size={15} />
        </button>

        {/* Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          className="w-9 h-9 rounded-xl bg-black/60 backdrop-blur-md border border-white/5 flex items-center justify-center text-[#c0c0c0] hover:text-white hover:bg-violet-600/40 hover:border-violet-500/30 transition-all"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </div>

      {/* ─── Subtle gradient border glow ─── */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none ring-1 ring-inset ring-white/[0.03]" />
    </div>
  );
}
