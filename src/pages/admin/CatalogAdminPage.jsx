import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Image as ImageIcon, Link as LinkIcon, Share2, Upload } from 'lucide-react';

export default function CatalogAdminPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Plumbing',
    description: '',
    price: 0,
    image_url: '',
    purchase_url: ''
  });

  const categories = [
    'Plumbing',
    'Cabinets',
    'Flooring',
    'Roofing',
    'Siding',
    'Accessories',
    'Others'
  ];

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('catalog_items')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching catalog items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('catalog_images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('catalog_images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('catalog_items')
          .update({
            name: formData.name,
            category: formData.category,
            description: formData.description,
            price: formData.price,
            image_url: formData.image_url,
            purchase_url: formData.purchase_url,
            updated_at: new Date()
          })
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('catalog_items')
          .insert([{
            name: formData.name,
            category: formData.category,
            description: formData.description,
            price: formData.price,
            image_url: formData.image_url,
            purchase_url: formData.purchase_url
          }]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingItem(null);
      fetchItems();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product from the catalog?')) return;
    try {
      const { error } = await supabase
        .from('catalog_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        description: item.description || '',
        price: item.price,
        image_url: item.image_url || '',
        purchase_url: item.purchase_url || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: 'Plumbing',
        description: '',
        price: 0,
        image_url: '',
        purchase_url: ''
      });
    }
    setIsModalOpen(true);
  };

  const copyPublicLink = () => {
    const url = `${window.location.origin}/catalog`;
    navigator.clipboard.writeText(url);
    alert('Catalog link copied to clipboard: ' + url);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Interactive Catalog</h1>
          <p className="text-gray-400">Manage products and finishes to send to clients</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={copyPublicLink}
            className="flex items-center gap-2 bg-[#2a2d3d] hover:bg-[#34384c] text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Share2 size={20} />
            Copy Catalog Link for Client
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            New Product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading catalog...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-[#2a2d3d] rounded-xl overflow-hidden shadow-lg border border-[#34384c] flex flex-col">
              <div className="h-48 bg-[#1e1f2e] relative group">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                    <ImageIcon size={40} className="mb-2" />
                    <span>No image</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white backdrop-blur-sm">
                  {item.category}
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-white mb-1">{item.name}</h3>
                <p className="text-blue-400 font-medium mb-3">${Number(item.price).toFixed(2)}</p>
                {item.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{item.description}</p>
                )}
                
                <div className="mt-auto space-y-3">
                  {item.purchase_url && (
                    <a 
                      href={item.purchase_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      <LinkIcon size={14} /> Purchase link (Amazon, Home Depot, etc.)
                    </a>
                  )}
                  
                  <div className="flex items-center gap-2 pt-3 border-t border-[#34384c]">
                    <button 
                      onClick={() => openModal(item)}
                      className="flex-1 bg-[#1e1f2e] hover:bg-[#34384c] text-white py-2 rounded transition-colors text-sm"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="px-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {items.length === 0 && (
            <div className="col-span-full bg-[#2a2d3d] rounded-xl p-10 text-center border border-dashed border-[#34384c]">
              <ImageIcon size={48} className="mx-auto text-gray-500 mb-4" />
              <h3 className="text-xl text-white font-medium mb-2">Empty Catalog</h3>
              <p className="text-gray-400 mb-6">You haven't added any products to the catalog yet.</p>
              <button
                onClick={() => openModal()}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <Plus size={20} />
                Add my first product
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Agregar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1f2e] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#34384c]">
            <div className="p-6 border-b border-[#34384c] flex justify-between items-center sticky top-0 bg-[#1e1f2e] z-10">
              <h2 className="text-xl font-bold text-white">
                {editingItem ? 'Edit Product' : 'New Product'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Imagen */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Product Image</label>
                <div className="flex items-center gap-4">
                  {formData.image_url ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-[#34384c]">
                      <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-[#2a2d3d] border border-dashed border-[#34384c] flex items-center justify-center text-gray-500">
                      <ImageIcon size={24} />
                    </div>
                  )}
                  <label className="cursor-pointer bg-[#2a2d3d] hover:bg-[#34384c] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                    <Upload size={18} />
                    {uploading ? 'Uploading...' : 'Upload Photo'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-[#2a2d3d] border border-[#34384c] text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Matte Black Moen Faucet"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                  <select
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-[#2a2d3d] border border-[#34384c] text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Short description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full bg-[#2a2d3d] border border-[#34384c] text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="Details about materials, dimensions, finish..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full bg-[#2a2d3d] border border-[#34384c] text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Purchase Link (Amazon, Home Depot)</label>
                  <input
                    type="url"
                    name="purchase_url"
                    value={formData.purchase_url}
                    onChange={handleInputChange}
                    className="w-full bg-[#2a2d3d] border border-[#34384c] text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#34384c]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 bg-transparent text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
                >
                  {editingItem ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
