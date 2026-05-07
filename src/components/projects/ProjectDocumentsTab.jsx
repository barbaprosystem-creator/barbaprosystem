import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, Upload, Trash2, Loader2, Download, File } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export default function ProjectDocumentsTab({ projectId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchDocuments(); }, [projectId]);

  async function fetchDocuments() {
    setLoading(true);
    if (projectId.startsWith('mock-')) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('project_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (!error) {
      setDocuments(data || []);
    } else {
      console.warn('Posiblemente no exista la tabla project_documents', error);
    }
    setLoading(false);
  }

  const handleUploadClick = () => {
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
        .from('project-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('project_documents').insert({
        project_id: projectId,
        name: file.name,
        storage_path: filePath,
        file_type: fileExt,
        created_at: new Date().toISOString()
      });

      if (dbError) throw dbError;

      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert('Error subiendo documento. Asegúrate de tener el storage "project-documents" y la tabla creados.');
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const deleteDocument = async (id, path) => {
    if (!confirm('¿Seguro que deseas eliminar este documento?')) return;
    
    await supabase.storage.from('project-documents').remove([path]);
    await supabase.from('project_documents').delete().eq('id', id);
    fetchDocuments();
  };

  const downloadDocument = async (path, name) => {
    const { data, error } = await supabase.storage.from('project-documents').download(path);
    if (error) {
      alert('Error descargando documento');
      return;
    }
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', name);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="text-[#FACB00]" /> Documentos del Proyecto
          </h3>
          <p className="text-sm text-gray-400">Planos, permisos, inspecciones y contratos.</p>
        </div>
        <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        <button 
          onClick={handleUploadClick}
          disabled={uploading}
          className="bg-[#111] hover:bg-[#222] border border-[#333] text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          {uploading ? 'Subiendo...' : 'Subir Documento'}
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="bg-[#111] border border-dashed border-[#333] rounded-xl p-12 text-center flex flex-col items-center">
          <File size={40} className="text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">No hay documentos guardados</p>
          <p className="text-sm text-gray-500 mt-1">Sube archivos PDF, Word o Excel aquí.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(doc => (
            <div key={doc.id} className="bg-[#111] border border-[#222] rounded-xl p-4 flex items-center justify-between group hover:border-[#FACB00] transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <FileText size={20} className="text-[#FACB00]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate" title={doc.name}>{doc.name}</p>
                  <p className="text-xs text-gray-500">{formatDate(doc.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => downloadDocument(doc.storage_path, doc.name)}
                  className="p-1.5 text-gray-400 hover:text-[#FACB00] transition-colors"
                  title="Descargar"
                >
                  <Download size={18} />
                </button>
                <button 
                  onClick={() => deleteDocument(doc.id, doc.storage_path)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
