import { useRef } from 'react';
import { Camera, Image as ImageIcon, Trash2 } from 'lucide-react';

export default function JobsitePhotos({ photos, setPhotos }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const removePhoto = (index) => {
    setPhotos(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[#2a2a2a]/60 rounded-2xl p-6 mt-6">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Camera size={18} color="#f97316" />
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Fotos de Inspección (Obligatorias)</h2>
      </div>
      
      <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '16px' }}>
        Es obligatorio tomar múltiples fotos desde diferentes ángulos y medir las áreas para la aprobación del estimado.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <button
          onClick={() => document.getElementById('camera-input').click()}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 20px', background: '#f97316', borderRadius: '12px',
            border: 'none', color: '#fff', fontWeight: '600', cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#ea580c'}
          onMouseLeave={e => e.currentTarget.style.background = '#f97316'}
        >
          <Camera size={18} /> Tomar Foto
        </button>
        
        <button
          onClick={() => document.getElementById('gallery-input').click()}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 20px', background: '#374151', borderRadius: '12px',
            border: 'none', color: '#e2e8f0', fontWeight: '600', cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#4b5563'}
          onMouseLeave={e => e.currentTarget.style.background = '#374151'}
        >
          <ImageIcon size={18} /> Subir de Galería
        </button>

        <input
          id="camera-input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <input
          id="gallery-input"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
          {photos.map((photo, i) => (
            <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', border: '1px solid #374151' }}>
              <img src={photo.preview} alt={`Preview ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                onClick={() => removePhoto(i)}
                style={{
                  position: 'absolute', top: '4px', right: '4px',
                  background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                  width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#ef4444'
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
