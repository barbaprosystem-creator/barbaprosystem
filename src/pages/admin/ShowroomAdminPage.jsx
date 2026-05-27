import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Image as ImageIcon, Loader2, Folder, Upload } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function ShowroomAdminPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    const { data } = await supabase.from('showroom_categories').select('*').order('created_at');
    setCategories(data || []);
    setLoading(false);
  }

  async function fetchImages(categoryId) {
    const { data } = await supabase.from('showroom_images').select('*').eq('category_id', categoryId).order('created_at');
    setImages(data || []);
  }

  async function handleCreateCategory(e) {
    e.preventDefault();
    if (!newCatName) return;
    const { data, error } = await supabase.from('showroom_categories').insert({
      name: newCatName,
      description: newCatDesc,
      cover_image: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&q=80&w=600' // Default fallback
    }).select().single();

    if (error) {
      alert('Error creating category');
    } else {
      setCategories([...categories, data]);
      setShowCategoryForm(false);
      setNewCatName('');
      setNewCatDesc('');
    }
  }

  async function handleDeleteCategory(id) {
    if (!confirm('Are you sure you want to delete this category and ALL of its photos?')) return;
    // Las imágenes se borran en cascada por la base de datos (ON DELETE CASCADE),
    // pero idealmente deberían borrarse del Storage también. Por simplicidad de este demo, solo borramos el registro.
    await supabase.from('showroom_categories').delete().eq('id', id);
    if (selectedCategory?.id === id) setSelectedCategory(null);
    fetchCategories();
  }

  function handleCategoryClick(cat) {
    setSelectedCategory(cat);
    fetchImages(cat.id);
  }

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length || !selectedCategory) return;
    
    setUploading(true);
    let uploadedUrls = [];

    for (const file of files) {
      const ext = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('showroom')
        .upload(fileName, file);
      
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('showroom').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }
    }

    if (uploadedUrls.length > 0) {
      const inserts = uploadedUrls.map(url => ({
        category_id: selectedCategory.id,
        image_url: url
      }));
      const { data } = await supabase.from('showroom_images').insert(inserts).select();
      
      // Update cover image if category has none (or just using default)
      if (uploadedUrls.length > 0 && categories.find(c => c.id === selectedCategory.id)?.cover_image?.includes('unsplash')) {
        await supabase.from('showroom_categories').update({ cover_image: uploadedUrls[0] }).eq('id', selectedCategory.id);
        fetchCategories(); // refresh cover images
      }
      
      if (data) setImages([...images, ...data]);
    }
    
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleDeleteImage(id) {
    if (!confirm('Delete this photo?')) return;
    await supabase.from('showroom_images').delete().eq('id', id);
    setImages(images.filter(img => img.id !== id));
  }

  return (
    <div className="admin-page p-6 lg:p-10 space-y-6 h-full flex flex-col">
      <div className="crm-toolbar">
        <div className="crm-toolbar-left">
          <h1><ImageIcon size={24}/> Showroom Manager</h1>
        </div>
        {!selectedCategory && (
          <div className="crm-toolbar-right">
            <button className="btn-primary" onClick={() => setShowCategoryForm(true)}>
              <Plus size={18}/> New Category
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Lista de Categorías */}
        <div className={`w-full ${selectedCategory ? 'lg:w-1/3 hidden lg:block' : ''} bg-[#1a1a1a] rounded-xl border border-[#333] overflow-y-auto`}>
          <div className="p-4 border-b border-[#333]">
            <h2 className="font-bold text-lg text-white flex items-center gap-2">
              <Folder size={20} className="text-indigo-400"/>
              Categories ({categories.length})
            </h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-gray-500"><Loader2 className="animate-spin mx-auto mb-2"/> Loading...</div>
          ) : (
            <ul className="divide-y divide-[#333]">
              {categories.map(cat => (
                <li key={cat.id} 
                  className={`p-4 hover:bg-[#2a2a2a] transition-colors cursor-pointer group flex items-center justify-between ${selectedCategory?.id === cat.id ? 'bg-[#222] border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}`}
                  onClick={() => handleCategoryClick(cat)}
                >
                  <div className="flex gap-4 items-center">
                    <img src={cat.cover_image} alt={cat.name} className="w-12 h-12 rounded object-cover bg-black" />
                    <div>
                      <h3 className="text-white font-bold">{cat.name}</h3>
                      <p className="text-xs text-gray-400 line-clamp-1">{cat.description}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                    className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete category"
                  >
                    <Trash2 size={16}/>
                  </button>
                </li>
              ))}
              {categories.length === 0 && <li className="p-8 text-center text-gray-500">No categories found.</li>}
            </ul>
          )}
        </div>

        {/* Panel de Fotos (Derecha) */}
        {selectedCategory && (
          <div className="flex-1 bg-[#1a1a1a] rounded-xl border border-[#333] flex flex-col min-h-0">
            <div className="p-4 border-b border-[#333] flex justify-between items-center">
              <div>
                <button className="lg:hidden text-indigo-400 text-sm mb-2 hover:underline" onClick={() => setSelectedCategory(null)}>&larr; Back to Categories</button>
                <h2 className="font-bold text-xl text-white">{selectedCategory.name}</h2>
                <p className="text-sm text-gray-400">{images.length} photos in this category</p>
              </div>
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  multiple 
                  accept="image/png, image/jpeg, image/webp" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="btn-primary flex items-center gap-2"
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16}/>}
                  {uploading ? 'Uploading...' : 'Upload Photos'}
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {images.length === 0 && !uploading && (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                  <ImageIcon size={48} className="opacity-20"/>
                  <p>No photos in this category yet.</p>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {images.map(img => (
                  <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-black border border-[#333]">
                    <img src={img.image_url} alt="Showroom" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    <button 
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Nueva Categoría */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateCategory} className="bg-[#111] border border-[#222] rounded-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-white mb-4">New Category</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name (e.g. Roofing, Kitchens)</label>
                <input required type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white"/>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white h-24"/>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" className="btn-secondary flex-1" onClick={() => setShowCategoryForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary flex-1">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
