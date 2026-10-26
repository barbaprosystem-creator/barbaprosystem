import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { Maximize2, Minimize2, Layers, Box } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ModelViewer = lazy(() => import('../components/3d/ModelViewer'));

/* ─── Skeleton while Three.js loads ─── */
function ViewerSkeleton() {
  return (
    <div className="relative w-full h-[75vh] bg-[#0d0d0d] rounded-2xl overflow-hidden">
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#1a1a1a] via-[#0d0d0d] to-[#1a1a1a]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
        <p className="text-sm font-semibold text-[#555555] tracking-wide animate-pulse">
          Loading 3D model…
        </p>
      </div>
    </div>
  );
}

export default function Public3DViewer() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [project, setProject] = useState(null);
  const [viewerMode, setViewerMode] = useState('interactive'); // 'interactive' | 'glb'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const cadFrameWrapRef = useRef(null);

  const toggleCadFullscreen = useCallback(async () => {
    if (!cadFrameWrapRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await cadFrameWrapRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    async function fetchProject() {
      if (!id) {
        setError('No valid project ID was provided.');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchErr } = await supabase
          .from('projects')
          .select('id, title, address, model_3d_url, contact:contacts!projects_contact_id_fkey(first_name, last_name)')
          .eq('id', id)
          .single();

        if (fetchErr) throw fetchErr;
        if (!data) throw new Error('Project not found.');
        if (!data.model_3d_url) throw new Error('This project does not have a 3D model available yet.');

        setProject(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [id]);

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
          <p className="mt-4 text-sm text-[#888888]">Loading 3D proposal…</p>
        </div>
      </div>
    );
  }

  /* ─── Error state ─── */
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-[#f0f0f0] mb-2">Unable to load 3D model</h1>
          <p className="text-sm text-[#888888] leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  const clientName = project.contact
    ? `${project.contact.first_name} ${project.contact.last_name}`
    : null;

  const isLynnview =
    id === 'cf6b582a-61e6-40ab-8df8-c8fb039befaf' ||
    (project.title && project.title.toLowerCase().includes('lynnview'));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ─── Header ─── */}
      <header className="border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-lg text-white shadow-lg shadow-amber-500/20">
              B
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#f0f0f0] tracking-tight">Barba Construction</h1>
              <p className="text-[11px] text-[#555555] uppercase tracking-widest">Interactive 3D Engineering Proposal</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {isLynnview && (
              <div className="inline-flex rounded-xl bg-[#141821] p-1 border border-[#2a3140]">
                <button
                  onClick={() => setViewerMode('interactive')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewerMode === 'interactive'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/25'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Layers size={14} />
                  Visor Ingeniería Completo (Luces + Cimentaciones + Pan)
                </button>
                <button
                  onClick={() => setViewerMode('glb')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewerMode === 'glb'
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Box size={14} />
                  Visor Malla .GLB
                </button>
              </div>
            )}

            {clientName && (
              <span className="text-xs text-[#888888] bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-[#2a2a2a]">
                Prepared for <span className="text-[#f0f0f0] font-semibold">{clientName}</span>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ─── Content ─── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        {/* Project info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#f0f0f0]">
              {project.title}
            </h2>
            {project.address && (
              <p className="text-xs sm:text-sm text-[#888888] flex items-center gap-1.5 mt-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {project.address}
              </p>
            )}
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-medium">
            <span>🖐️</span>
            Usa <strong>"Arrastrar / Mover"</strong> para desplazar • <strong>Rueda</strong> para Zoom en el cursor • <strong>Rayos-X</strong> para ver Zapatas (-36&quot;/-60&quot;)
          </div>
        </div>

        {/* 3D Viewer */}
        {isLynnview && viewerMode === 'interactive' ? (
          <div
            ref={cadFrameWrapRef}
            onFullscreenChange={() => setIsFullscreen(!!document.fullscreenElement)}
            className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-amber-500/30 bg-[#0f1319]"
            style={{ height: isFullscreen ? '100vh' : '78vh', minHeight: '560px' }}
          >
            <iframe
              src="/landing/lynnview-3d-viewer.html"
              title="City of Lynnview Interactive 3D Engineering Viewer"
              className="w-full h-full border-0"
              allow="fullscreen"
            />
            <button
              onClick={toggleCadFullscreen}
              className="absolute bottom-3.5 right-28 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/80 hover:bg-amber-500 hover:text-black text-xs font-bold text-white border border-amber-500/50 transition-all shadow-lg"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {isFullscreen ? 'Salir Pantalla Completa' : 'Pantalla Completa'}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-[#1a1a1a]">
            <Suspense fallback={<ViewerSkeleton />}>
              <ModelViewer modelUrl={project.model_3d_url} />
            </Suspense>
          </div>
        )}

        {/* Footer CTA */}
        <div className="text-center pt-2 pb-6">
          <p className="text-xs text-[#555555]">
            Questions about this proposal? Call us at{' '}
            <a href="tel:+15025470644" className="text-amber-400 hover:underline font-semibold">(502) 547-0644</a>
          </p>
        </div>
      </main>
    </div>
  );
}
