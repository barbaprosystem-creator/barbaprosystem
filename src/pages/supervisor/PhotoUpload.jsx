import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, Loader2, Image, Trash2 } from 'lucide-react';

export default function PhotoUpload() {
  const [photos, setPhotos] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data:{user} } = await supabase.auth.getUser();
    const [photosRes, projRes] = await Promise.all([
      supabase.from('project_photos').select('*,project:projects!project_photos_project_id_fkey(title,project_number)').eq('uploaded_by',user.id).order('created_at',{ascending:false}).limit(50),
      supabase.from('projects').select('id,title,project_number').eq('supervisor_id',user.id),
    ]);
    setPhotos(photosRes.data||[]);
    setProjects(projRes.data||[]);
    setLoading(false);
  }

  async function handleUpload(e) {
    const files = e.target.files;
    if(!files.length || !selectedProject) return alert('Selecciona un proyecto primero');
    setUploading(true);
    const { data:{user} } = await supabase.auth.getUser();
    for(const file of files) {
      const path = `${selectedProject}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from('project-photos').upload(path, file);
      if(!uploadErr) {
        const { data:{ publicUrl } } = supabase.storage.from('project-photos').getPublicUrl(path);
        await supabase.from('project_photos').insert({ project_id:selectedProject, url:publicUrl, filename:file.name, uploaded_by:user.id });
      }
    }
    setUploading(false);
    fetchData();
  }

  if(loading) return <div className="page-loading"><Loader2 size={32} className="spin"/><p>Cargando fotos...</p></div>;

  return (
    <div className="photos-page">
      <div className="crm-toolbar">
        <div className="crm-toolbar-left"><h1>Fotos de Proyecto</h1><span className="crm-count">{photos.length}</span></div>
        <div className="crm-toolbar-right" style={{gap:12}}>
          <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="project-select">
            <option value="">Seleccionar proyecto...</option>
            {projects.map(p => <option key={p.id} value={p.id}>PRJ-{String(p.project_number).padStart(4,'0')}</option>)}
          </select>
          <label className="btn-primary upload-btn">
            <Upload size={18}/>
            <span>{uploading ? 'Subiendo...' : 'Subir Fotos'}</span>
            <input type="file" accept="image/*" multiple onChange={handleUpload} hidden disabled={uploading||!selectedProject}/>
          </label>
        </div>
      </div>

      <div className="photos-grid">
        {photos.map(p => (
          <div key={p.id} className="photo-card">
            <img src={p.url} alt={p.filename} loading="lazy"/>
            <div className="photo-card-info">
              <span className="photo-project">PRJ-{String(p.project?.project_number||0).padStart(4,'0')}</span>
              <span className="photo-date">{new Date(p.created_at).toLocaleDateString('es')}</span>
            </div>
          </div>
        ))}
        {photos.length===0 && (
          <div className="projects-empty" style={{gridColumn:'1/-1'}}>
            <Image size={48}/>
            <p>No hay fotos subidas</p>
            <p className="text-sm">Selecciona un proyecto y sube fotos desde tu dispositivo</p>
          </div>
        )}
      </div>
    </div>
  );
}
