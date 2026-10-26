import { useRef, useState, useEffect, useCallback, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF, Loader, useProgress } from '@react-three/drei';
import { Maximize2, Minimize2, RotateCcw, Hand, RotateCw, Sun, Sunset, Moon, Grid, Eye } from 'lucide-react';

/* ───────────────────────────── Model Mesh ──────────────────────────── */
function Model({ url, xray, wireframe }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        const name = (child.name || '').toLowerCase();
        const isGroundOrVeneer =
          name.includes('greenspace') ||
          name.includes('sidewalk') ||
          name.includes('plazoleta') ||
          name.includes('mulch') ||
          name.includes('road') ||
          name.includes('curb') ||
          name.includes('park_lawn') ||
          name.includes('block') ||
          name.includes('course') ||
          name.includes('mortar');

        mats.forEach((m) => {
          m.wireframe = !!wireframe;
          if (xray && isGroundOrVeneer) {
            m.transparent = true;
            m.opacity = 0.22;
            m.depthWrite = false;
          } else {
            m.opacity = 1.0;
            m.depthWrite = true;
          }
          m.needsUpdate = true;
        });
      }
    });
  }, [scene, xray, wireframe]);

  return <primitive object={scene} position={[0, -2, 12]} />;
}

/* ─────────────────── Inner loading overlay (in-canvas) ──────────────── */
function LoadingOverlay() {
  const { progress } = useProgress();
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
      <div className="w-16 h-16 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
      <p className="mt-4 text-sm font-semibold text-[#888888] tracking-wide">
        Loading 3D model… {Math.round(progress)}%
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
  const [mouseMode, setMouseMode] = useState('rotate'); // 'rotate' | 'pan'
  const [lightMode, setLightMode] = useState('day'); // 'day' | 'sunset' | 'night'
  const [xray, setXray] = useState(false);
  const [wireframe, setWireframe] = useState(false);

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
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 3, 0);
      controlsRef.current.object.position.set(-22, 12, 26);
      controlsRef.current.update();
    }
  }, []);

  const bgByLight = {
    day: '#141c28',
    sunset: '#23172b',
    night: '#090d16',
  };

  /* ─── Error boundary for the model ─── */
  if (hasError) {
    return (
      <div className="relative bg-[#0d0d0d] border border-[#2a2a2a]/60 rounded-2xl shadow-2xl h-[500px] md:h-[680px] flex items-center justify-center">
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
      className="relative border border-[#2a2a2a]/60 rounded-2xl shadow-2xl h-[540px] md:h-[720px] overflow-hidden group"
      style={{ background: bgByLight[lightMode] || '#141c28' }}
    >
      {/* ─── Top Interactive Toolbar ─── */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 bg-black/75 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setMouseMode('rotate')}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mouseMode === 'rotate'
                ? 'bg-violet-600 text-white'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
            title="Click izquierdo rota 360°"
          >
            <RotateCw size={13} />
            Rotar 360°
          </button>
          <button
            onClick={() => setMouseMode('pan')}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mouseMode === 'pan'
                ? 'bg-amber-500 text-black'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
            title="Click izquierdo arrastra y mueve libremente el modelo"
          >
            <Hand size={13} />
            Arrastrar / Mover
          </button>

          <div className="w-px h-5 bg-white/15 mx-1" />

          <button
            onClick={() => setLightMode('day')}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              lightMode === 'day'
                ? 'bg-amber-500 text-black'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <Sun size={13} />
            Día
          </button>
          <button
            onClick={() => setLightMode('sunset')}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              lightMode === 'sunset'
                ? 'bg-orange-500 text-black'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <Sunset size={13} />
            Atardecer
          </button>
          <button
            onClick={() => setLightMode('night')}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              lightMode === 'night'
                ? 'bg-indigo-500 text-white'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <Moon size={13} />
            Noche LED
          </button>

          <div className="w-px h-5 bg-white/15 mx-1" />

          <button
            onClick={() => setXray((v) => !v)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              xray
                ? 'bg-emerald-500 text-black'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <Eye size={13} />
            Rayos-X Cimentaciones
          </button>
          <button
            onClick={() => setWireframe((v) => !v)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              wireframe
                ? 'bg-cyan-400 text-black'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <Grid size={13} />
            Malla CAD
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={resetCamera}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-violet-600/40 transition-all"
            title="Centrar cámara"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-violet-600/40 transition-all"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* ─── Canvas ─── */}
      <Suspense fallback={<LoadingOverlay />}>
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ fov: 38, position: [-22, 12, 26], near: 0.2, far: 400 }}
          gl={{ antialias: true, alpha: true }}
          onError={() => setHasError(true)}
          style={{ background: 'transparent' }}
        >
          <Environment preset={lightMode === 'night' ? 'night' : lightMode === 'sunset' ? 'sunset' : 'city'} />
          <ambientLight intensity={lightMode === 'night' ? 0.25 : lightMode === 'sunset' ? 0.5 : 0.85} />
          <directionalLight
            position={lightMode === 'sunset' ? [-35, 14, 20] : [-25, 40, 30]}
            intensity={lightMode === 'night' ? 0.15 : 1.35}
            color={lightMode === 'sunset' ? '#ff9848' : '#fff6e5'}
            castShadow
          />
          {lightMode !== 'day' && (
            <>
              <pointLight position={[0, 2, -1]} intensity={18} distance={25} color="#ffd080" />
              <pointLight position={[-8, 2, 1]} intensity={14} distance={22} color="#ffd080" />
              <pointLight position={[8, 2, 1]} intensity={14} distance={22} color="#ffd080" />
              <pointLight position={[0, 14, -7]} intensity={25} distance={32} color="#ffe4a8" />
            </>
          )}

          <Model url={modelUrl} xray={xray} wireframe={wireframe} />

          <OrbitControls
            ref={controlsRef}
            target={[0, 3, 0]}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            zoomToCursor={true}
            screenSpacePanning={true}
            minDistance={2}
            maxDistance={150}
            minPolarAngle={0}
            maxPolarAngle={Math.PI * 0.85}
            dampingFactor={0.07}
            enableDamping
            mouseButtons={{
              LEFT: mouseMode === 'pan' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
              MIDDLE: THREE.MOUSE.DOLLY,
              RIGHT: mouseMode === 'pan' ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN,
            }}
            touches={{
              ONE: mouseMode === 'pan' ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE,
              TWO: THREE.TOUCH.DOLLY_PAN,
            }}
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
    </div>
  );
}
