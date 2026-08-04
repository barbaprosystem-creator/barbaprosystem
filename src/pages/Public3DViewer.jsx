import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ModelViewer = lazy(() => import('../components/3d/ModelViewer'));

/* ─── Skeleton while Three.js loads ─── */
function ViewerSkeleton() {
  return (
    <div className="relative w-full h-[70vh] bg-[#0d0d0d] rounded-2xl overflow-hidden">
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#1a1a1a] via-[#0d0d0d] to-[#1a1a1a]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
        <p className="text-sm font-semibold text-[#555555] tracking-wide animate-pulse">
          Cargando modelo 3D…
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

  useEffect(() => {
    async function fetchProject() {
      if (!id) {
        setError('No se proporcionó un ID de proyecto válido.');
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
        if (!data) throw new Error('Proyecto no encontrado');
        if (!data.model_3d_url) throw new Error('Este proyecto aún no tiene un modelo 3D disponible.');

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
          <p className="mt-4 text-sm text-[#888888]">Cargando propuesta 3D…</p>
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
          <h1 className="text-xl font-bold text-[#f0f0f0] mb-2">No se pudo cargar el modelo</h1>
          <p className="text-sm text-[#888888] leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  const clientName = project.contact
    ? `${project.contact.first_name} ${project.contact.last_name}`
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ─── Header ─── */}
      <header className="border-b border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-lg text-white shadow-lg shadow-amber-500/20">
              B
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#f0f0f0] tracking-tight">Barba Construction</h1>
              <p className="text-[11px] text-[#555555] uppercase tracking-widest">Propuesta 3D</p>
            </div>
          </div>

          {clientName && (
            <span className="text-xs text-[#888888] bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-[#2a2a2a]">
              Preparado para <span className="text-[#f0f0f0] font-semibold">{clientName}</span>
            </span>
          )}
        </div>
      </header>

      {/* ─── Content ─── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Project info */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#f0f0f0]">
            {project.title}
          </h2>
          {project.address && (
            <p className="text-sm text-[#888888] flex items-center justify-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {project.address}
            </p>
          )}
        </div>

        {/* Instruction hint */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 font-medium">
            <span>🖱️</span>
            Mantén presionado y arrastra para explorar el modelo • Usa la rueda para hacer zoom
          </div>
        </div>

        {/* 3D Viewer */}
        <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-[#1a1a1a]">
          <Suspense fallback={<ViewerSkeleton />}>
            <ModelViewer modelUrl={project.model_3d_url} />
          </Suspense>
        </div>

        {/* Footer CTA */}
        <div className="text-center pt-4 pb-8">
          <p className="text-xs text-[#555555]">
            ¿Tienes preguntas sobre esta propuesta? Llámanos al{' '}
            <a href="tel:+15025470644" className="text-amber-400 hover:underline font-semibold">(502) 547-0644</a>
          </p>
        </div>
      </main>
    </div>
  );
}
