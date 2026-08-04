import { lazy, Suspense, useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, Loader2, Trash2, CheckCircle2 } from 'lucide-react';

/* ─── Lazy-load the heavy Three.js viewer (avoids bundling in main chunk) ─── */
const ModelViewer = lazy(() => import('./ModelViewer'));

/* ─── Skeleton loader shown while the Three.js chunk downloads ─── */
function SkeletonLoader() {
  return (
    <div className="relative bg-[#0d0d0d] border border-[#2a2a2a]/60 rounded-2xl shadow-2xl h-[450px] md:h-[600px] overflow-hidden">
      {/* Pulsing background */}
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#1a1a1a] via-[#0d0d0d] to-[#1a1a1a]" />

      {/* Center spinner + text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
        <p className="text-sm font-semibold text-[#555555] tracking-wide animate-pulse">
          Inicializando visor 3D…
        </p>
      </div>

      {/* Fake control hints (top-left) */}
      <div className="absolute top-3 left-3 w-52 h-7 rounded-xl bg-[#1a1a1a] animate-pulse" />

      {/* Fake buttons (top-right) */}
      <div className="absolute top-3 right-3 flex gap-1.5">
        <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] animate-pulse" />
        <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] animate-pulse" />
      </div>
    </div>
  );
}

/* ─── Empty state when no model URL is available ─── */
function EmptyState({ onUploadClick, uploading, canEdit }) {
  return (
    <div className="relative bg-[#0d0d0d] border border-[#2a2a2a]/60 rounded-2xl shadow-2xl h-[450px] md:h-[600px] flex items-center justify-center overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.03] via-transparent to-blue-500/[0.03]" />

      <div className="relative text-center px-8">
        {/* 3D cube icon */}
        <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </div>

        <h3 className="text-lg font-bold text-[#f0f0f0] mb-2">
          Modelo 3D próximamente
        </h3>
        <p className="text-sm text-[#888888] max-w-sm mx-auto leading-relaxed">
          La propuesta 3D de este proyecto aún no ha sido cargada.
          {canEdit
            ? ' Sube un archivo .glb para activar el visor interactivo.'
            : ' Mantente atento — cuando el equipo de diseño suba el modelo, podrás explorarlo aquí en 3D.'}
        </p>

        {canEdit && (
          <button
            onClick={onUploadClick}
            disabled={uploading}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? 'Subiendo…' : 'Subir modelo .GLB'}
          </button>
        )}

        {/* Decorative dots */}
        {!canEdit && (
          <div className="flex items-center justify-center gap-1.5 mt-6">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500/40 animate-pulse" style={{ animationDelay: '0s' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500/40 animate-pulse" style={{ animationDelay: '0.3s' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500/40 animate-pulse" style={{ animationDelay: '0.6s' }} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Drag & drop overlay ─── */
function DragOverlay() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-violet-600/20 backdrop-blur-sm border-2 border-dashed border-violet-400 rounded-2xl pointer-events-none">
      <div className="text-center">
        <Upload size={48} className="mx-auto text-violet-300 mb-3" />
        <p className="text-lg font-bold text-white">Suelta tu archivo .GLB aquí</p>
        <p className="text-sm text-violet-200 mt-1">El modelo se subirá automáticamente</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════ Exported Wrapper ══════════════════════════ */
export default function ModelViewerLazy({ modelUrl, projectId, canEdit = false, onModelUrlChange, contactPhone, projectTitle }) {
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const BUCKET = '3d-models';

  /* ─── Upload handler ─── */
  const handleUpload = useCallback(async (file) => {
    if (!file || !projectId) return;

    // Validate extension
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'glb' && ext !== 'gltf') {
      alert('Solo se permiten archivos .glb o .gltf');
      return;
    }

    // Max 50MB (límite de Supabase Storage)
    if (file.size > 50 * 1024 * 1024) {
      alert(`El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)}MB y excede el límite de 50MB de Supabase. Por favor, optimiza el modelo con herramientas como gltf-transform o Blender.`);
      return;
    }

    setUploading(true);
    setUploadSuccess(false);

    try {
      const fileName = `${projectId}/${projectId}-${Date.now()}.${ext}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, file, {
          contentType: ext === 'glb' ? 'model/gltf-binary' : 'model/gltf+json',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // 3. Update project record
      const { error: dbError } = await supabase
        .from('projects')
        .update({ model_3d_url: publicUrl })
        .eq('id', projectId);

      if (dbError) throw dbError;

      // 4. Notify parent
      onModelUrlChange?.(publicUrl);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 5000);

      // 5. Send SMS notification to project contact with magic link
      if (contactPhone) {
        try {
          const magicLink = `https://barbaprosystem.vercel.app/3d/${projectId}`;
          const smsBody = `Barba Construction: Tu propuesta 3D para "${projectTitle || 'tu proyecto'}" esta lista! Explorala aqui: ${magicLink}`;
          const smsRes = await fetch('/api/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: contactPhone,
              body: smsBody,
              canal: 'sms'
            })
          });
          if (smsRes.ok) {
            console.log('✅ SMS de notificación 3D enviado a', contactPhone);
          } else {
            console.warn('⚠️ SMS no enviado:', await smsRes.text());
          }
        } catch (smsErr) {
          console.warn('⚠️ No se pudo enviar SMS (puede que solo funcione en producción):', smsErr.message);
        }
      }

    } catch (err) {
      console.error('Error uploading 3D model:', err);
      alert(`Error al subir el modelo 3D: ${err.message}\n\nAsegúrate de que el bucket "${BUCKET}" existe en Supabase Storage.`);
    } finally {
      setUploading(false);
    }
  }, [projectId, onModelUrlChange, contactPhone, projectTitle]);

  /* ─── File input change ─── */
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = null;
  }, [handleUpload]);

  /* ─── Drag & drop events ─── */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  /* ─── Delete model ─── */
  const handleDelete = useCallback(async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar el modelo 3D de este proyecto?')) return;

    try {
      // Extract storage path from URL
      const url = new URL(modelUrl);
      const pathParts = url.pathname.split(`/object/public/${BUCKET}/`);
      if (pathParts.length > 1) {
        await supabase.storage.from(BUCKET).remove([pathParts[1]]);
      }

      // Clear from DB
      await supabase
        .from('projects')
        .update({ model_3d_url: null })
        .eq('id', projectId);

      onModelUrlChange?.(null);
    } catch (err) {
      console.error('Error deleting 3D model:', err);
      alert('Error al eliminar el modelo 3D: ' + err.message);
    }
  }, [modelUrl, projectId, onModelUrlChange]);

  /* ─── Hidden file input ─── */
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept=".glb,.gltf"
      onChange={handleFileChange}
      className="hidden"
    />
  );

  /* ─── No URL → show empty state with upload button ─── */
  if (!modelUrl) {
    return (
      <div
        onDragOver={canEdit ? handleDragOver : undefined}
        onDragLeave={canEdit ? handleDragLeave : undefined}
        onDrop={canEdit ? handleDrop : undefined}
        className="relative"
      >
        {fileInput}
        {dragOver && <DragOverlay />}
        <EmptyState
          onUploadClick={() => fileInputRef.current?.click()}
          uploading={uploading}
          canEdit={canEdit}
        />
      </div>
    );
  }

  /* ─── Has URL → show viewer with admin controls ─── */
  return (
    <div
      className="relative"
      onDragOver={canEdit ? handleDragOver : undefined}
      onDragLeave={canEdit ? handleDragLeave : undefined}
      onDrop={canEdit ? handleDrop : undefined}
    >
      {fileInput}
      {dragOver && <DragOverlay />}

      {/* Admin toolbar */}
      {canEdit && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {uploadSuccess && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg">
                <CheckCircle2 size={14} /> Modelo actualizado
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 text-xs font-bold transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? 'Subiendo…' : 'Reemplazar modelo'}
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-colors"
            >
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Lazy-load the viewer with skeleton fallback */}
      <Suspense fallback={<SkeletonLoader />}>
        <ModelViewer modelUrl={modelUrl} />
      </Suspense>
    </div>
  );
}
