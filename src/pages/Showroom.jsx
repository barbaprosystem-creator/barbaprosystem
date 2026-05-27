import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Folder, Image as ImageIcon, Search, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Showroom() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: cats } = await supabase.from('showroom_categories').select('*').order('created_at');
      const { data: imgs } = await supabase.from('showroom_images').select('*');
      
      const combined = (cats || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        coverImage: cat.cover_image,
        images: (imgs || []).filter(img => img.category_id === cat.id).map(img => img.image_url)
      }));
      
      setCategories(combined);
      setLoading(false);
    }
    
    fetchData();
  }, []);

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-page p-6 lg:p-10 space-y-8 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <ImageIcon className="text-indigo-400" size={28} />
              Work Showroom
            </h1>
            <p className="text-slate-400 mt-1">
              Gallery of completed projects to showcase to clients
            </p>
          </div>
          {!selectedCategory && (
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-10">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
            <Loader2 className="animate-spin text-indigo-500" size={48} />
            <p>Loading showroom photos...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {!selectedCategory ? (
              <motion.div
                key="folders"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filteredCategories.length === 0 ? (
                  <div className="col-span-full text-center text-gray-500 py-10">No categories found.</div>
                ) : (
                  filteredCategories.map((category) => (
                    <div
                      key={category.id}
                      onClick={() => setSelectedCategory(category)}
                      className="group relative rounded-2xl overflow-hidden bg-slate-800/50 border border-white/10 hover:border-indigo-500/50 cursor-pointer transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]"
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden">
                        <img
                          src={category.coverImage}
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/40 to-transparent opacity-80" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 backdrop-blur-sm">
                            <Folder size={20} fill="currentColor" className="opacity-50" />
                          </div>
                          <h3 className="text-xl font-bold text-white">{category.name}</h3>
                        </div>
                        <p className="text-slate-400 text-sm line-clamp-2">{category.description}</p>
                        <p className="text-xs text-indigo-400 mt-2 font-medium">
                          {category.images.length} projects
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div
                key="gallery"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                <div className="mb-6 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft size={20} />
                    <span>Back to Folders</span>
                  </button>
                  <div className="flex items-center gap-2 text-lg font-semibold text-white">
                    <Folder size={20} className="text-indigo-400" />
                    {selectedCategory.name}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedCategory.images.length === 0 ? (
                    <div className="col-span-full text-center text-gray-500 py-10">No photos in this category yet.</div>
                  ) : (
                    selectedCategory.images.map((image, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedImage(image)}
                        className="group relative rounded-xl overflow-hidden aspect-video bg-slate-800 cursor-pointer border border-white/5 hover:border-indigo-500/50 transition-all"
                      >
                        <img
                          src={image}
                          alt={`${selectedCategory.name} ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Search className="text-white opacity-0 group-hover:opacity-100 transition-opacity transform scale-50 group-hover:scale-100 duration-300" size={32} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-7xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-md transition-colors"
              >
                ✕
              </button>
              <img
                src={selectedImage}
                alt="Enlarged view"
                className="w-full h-full object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
