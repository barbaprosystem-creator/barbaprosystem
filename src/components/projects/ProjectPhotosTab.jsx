import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Camera, Upload, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';

export default function ProjectPhotosTab({ projectId }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadType, setUploadType] = useState('before');

  useEffect(() => { fetchPhotos(); }, [projectId]);

  async function fetchPhotos() {
    setLoading(true);
    if (projectId.startsWith('mock-')) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('project_photos')
      .select('*')
      .eq('project_id', projectId)
      .order('taken_at', { ascending: false });

    if (!error) {
      setPhotos(data || []);
    }
    setLoading(false);
  }

  const handleUploadClick = (type) => {
    setUploadType(type);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}-${Date.now()}.${fileExt}`;
      const filePath = `${projectId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('jobsite_photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('project_photos').insert({
        project_id: projectId,
        storage_path: filePath,
        photo_type: uploadType,
        taken_at: new Date().toISOString()
      });

      if (dbError) throw dbError;

      fetchPhotos();
    } catch (err) {
      console.error(err);
      alert('Error subiendo foto. Asegúrate de tener el storage "jobsite_photos" configurado en Supabase.');
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const deletePhoto = async (id, path) => {
    if (!confirm('¿Seguro que deseas eliminar esta foto?')) return;
    
    await supabase.storage.from('jobsite_photos').remove([path]);
    await supabase.from('project_photos').delete().eq('id', id);
    fetchPhotos();
  };

  const beforePhotos = photos.filter(p => p.photo_type === 'before');
  const afterPhotos = photos.filter(p => p.photo_type === 'after');

  const renderPhotoGrid = (title, photoList, type) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#222] pb-2">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          {type === 'before' ? '📸 Fotos del Antes' : '✨ Fotos del Después'}
        </h3>
        <button 
          onClick={() => handleUploadClick(type)}
          disabled={uploading}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
            type === 'before' ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
          }`}
        >
          {uploading && uploadType === type ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          Subir Foto ({title})
        </button>
      </div>

      {photoList.length === 0 ? (
        <div className="bg-[#111] border border-dashed border-[#333] rounded-xl p-8 text-center flex flex-col items-center">
          <ImageIcon size={32} className="text-gray-600 mb-2" />
          <p className="text-sm text-gray-500">No hay fotos de "{title}" todavía.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photoList.map(photo => (
            <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden border border-[#222] group bg-[#111]">
              <img
                src={supabase.storage.from('jobsite_photos').getPublicUrl(photo.storage_path).data.publicUrl}
                alt="Foto"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <button 
                onClick={() => deletePhoto(photo.id, photo.storage_path)}
                className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-500" /></div>;

  return (
    <div className="space-y-8">
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      {renderPhotoGrid('Antes', beforePhotos, 'before')}
      {renderPhotoGrid('Después', afterPhotos, 'after')}
    </div>
  );
}
