import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingCart, Check, X, Search, Link as LinkIcon, Send } from 'lucide-react';

export default function PublicCatalogPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection Cart
  const [selectedItems, setSelectedItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [clientInfo, setClientInfo] = useState({ name: '', address: '', email: '', phone: '', smsOptIn: false });
  const [isSendingEmail, setIsSendingEmail] = useState(false);

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
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data.map(item => item.category))];
      setCategories(['All', ...uniqueCategories]);
      
    } catch (error) {
      console.error('Error fetching catalog items:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (item) => {
    const isSelected = selectedItems.some(i => i.id === item.id);
    if (isSelected) {
      setSelectedItems(prev => prev.filter(i => i.id !== item.id));
    } else {
      setSelectedItems(prev => [...prev, item]);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const totalPrice = selectedItems.reduce((sum, item) => sum + Number(item.price), 0);

  const handleSendWhatsApp = () => {
    if (!clientInfo.name) {
      alert('Please enter your name before sending.');
      return;
    }

    let message = `*NEW MATERIAL SELECTION*%0A`;
    message += `👤 *Client:* ${clientInfo.name}%0A`;
    if (clientInfo.address) {
      message += `📍 *Address:* ${clientInfo.address}%0A`;
    }
    if (clientInfo.phone) {
      message += `📞 *Phone:* ${clientInfo.phone}%0A`;
    }
    if (clientInfo.smsOptIn) {
      message += `✅ *SMS Opt-In:* Accepted%0A`;
    }
    message += `%0A`;
    
    message += `*SELECTED MATERIALS:*%0A`;
    selectedItems.forEach((item, index) => {
      message += `${index + 1}. ${item.name} - $${Number(item.price).toFixed(2)}%0A`;
    });
    
    message += `%0A💰 *Estimated Total:* $${totalPrice.toFixed(2)}`;

    // Replace this number with the office WhatsApp number
    const phoneNumber = "15023383720"; 
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
    setIsCartOpen(false);
  };

  const handleSendEmail = async () => {
    if (!clientInfo.name || !clientInfo.email) {
      alert('Please enter your name and email address before sending.');
      return;
    }

    setIsSendingEmail(true);

    let htmlBody = `<h2>New Material Selection from: ${clientInfo.name}</h2>`;
    htmlBody += `<p><strong>Client Email:</strong> ${clientInfo.email}</p>`;
    if (clientInfo.address) {
      htmlBody += `<p><strong>Address:</strong> ${clientInfo.address}</p>`;
    }
    if (clientInfo.phone) {
      htmlBody += `<p><strong>Phone:</strong> ${clientInfo.phone}</p>`;
    }
    if (clientInfo.smsOptIn) {
      htmlBody += `<p><strong>SMS Opt-In:</strong> Accepted by client</p>`;
    }
    htmlBody += `<h3>Selected Materials:</h3><ul>`;
    selectedItems.forEach((item) => {
      htmlBody += `<li>${item.name} - $${Number(item.price).toFixed(2)}</li>`;
    });
    htmlBody += `</ul><br/><h3>Estimated Total: $${totalPrice.toFixed(2)}</h3>`;

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'barbaprosystem@gmail.com', 
          subject: `Material Selection - ${clientInfo.name}`,
          html: htmlBody,
          fromName: clientInfo.name
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        // --- SUPABASE INTEGRATION ---
        try {
          // split name
          const nameParts = clientInfo.name.trim().split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ') || '';

          // Find existing contact or create
          let { data: existingContacts } = await supabase
            .from('contacts')
            .select('id')
            .or(`email.eq."${clientInfo.email}",phone.eq."${clientInfo.phone}"`)
            .limit(1);

          let contactId;
          
          if (existingContacts && existingContacts.length > 0) {
            contactId = existingContacts[0].id;
          } else {
            // Create new contact
            const { data: newContact, error: insertError } = await supabase
              .from('contacts')
              .insert([{
                first_name: firstName,
                last_name: lastName,
                email: clientInfo.email,
                phone: clientInfo.phone,
                source: 'web',
                pipeline_status: 'new',
                notes: 'Contact from Public Catalog'
              }])
              .select('id')
              .single();
              
            if (!insertError && newContact) {
              contactId = newContact.id;
            }
          }

          // Save selections
          if (contactId) {
            await supabase.from('catalog_selections').insert([{
              contact_id: contactId,
              selections: selectedItems,
              notes: 'Selected from Public Catalog page'
            }]);
          }
        } catch (dbErr) {
          console.error("Error saving selection to DB:", dbErr);
        }
        // ----------------------------

        alert('Selection successfully emailed to the office and saved in the CRM!');
        setIsCartOpen(false);
      } else {
        alert('Error sending: ' + (result.error || 'Unknown'));
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('There was a connection error.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#12131c] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#12131c] text-white font-sans">
      {/* Header */}
      <header className="bg-[#1e1f2e] border-b border-[#34384c] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo-barba.png" alt="Barba Construction" className="h-10 w-auto object-contain" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Material Catalog</h1>
              <p className="text-xs text-blue-400 font-medium">Barba Construction</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative bg-blue-600 hover:bg-blue-700 p-3 rounded-full transition-colors"
          >
            <ShoppingCart size={24} />
            {selectedItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-[#1e1f2e]">
                {selectedItems.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="w-full md:w-auto overflow-x-auto pb-2 flex gap-2 hide-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                  activeCategory === cat 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-[#2a2d3d] text-gray-400 hover:bg-[#34384c] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <div className="w-full md:w-72 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#2a2d3d] border border-[#34384c] rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
          {filteredItems.map(item => {
            const isSelected = selectedItems.some(i => i.id === item.id);
            
            return (
              <div 
                key={item.id} 
                className={`bg-[#1e1f2e] rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                  isSelected ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'border-[#34384c] hover:border-gray-500'
                }`}
              >
                <div className="h-56 relative bg-[#2a2d3d]">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">No photo</div>
                  )}
                  
                  {isSelected && (
                    <div className="absolute top-3 right-3 bg-blue-500 text-white p-1.5 rounded-full shadow-lg">
                      <Check size={20} strokeWidth={3} />
                    </div>
                  )}
                </div>
                
                <div className="p-5">
                  <div className="text-xs font-semibold tracking-wider text-blue-400 uppercase mb-1">{item.category}</div>
                  <h3 className="text-lg font-bold text-white mb-2 leading-tight">{item.name}</h3>
                  <div className="text-xl font-black text-white mb-3">${Number(item.price).toFixed(2)}</div>
                  
                  {item.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{item.description}</p>
                  )}
                  
                  {item.purchase_url && (
                    <a 
                      href={item.purchase_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400 mb-4 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <LinkIcon size={12} /> View in store
                    </a>
                  )}
                  
                  <button
                    onClick={() => toggleSelection(item)}
                    className={`w-full py-3 rounded-xl font-bold transition-all ${
                      isSelected 
                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                        : 'bg-[#2a2d3d] text-white hover:bg-blue-600'
                    }`}
                  >
                    {isSelected ? 'Remove from selection' : 'Add to selection'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredItems.length === 0 && (
          <div className="text-center py-20">
            <h3 className="text-2xl font-bold text-white mb-2">No materials found</h3>
            <p className="text-gray-400">Try searching with another term or category.</p>
          </div>
        )}
      </main>

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-[#1e1f2e] h-full flex flex-col shadow-2xl animate-in slide-in-from-right">
            <div className="p-6 border-b border-[#34384c] flex justify-between items-center bg-[#2a2d3d]">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShoppingCart size={24} />
                My Selection ({selectedItems.length})
              </h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 bg-[#1e1f2e] text-gray-400 hover:text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {selectedItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <ShoppingCart size={64} className="mb-4 opacity-50" />
                  <p className="text-lg font-medium">Your selection is empty</p>
                  <p className="text-sm mt-2 text-center">Explore the catalog and add the materials you like for your project.</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium"
                  >
                    Explore Catalog
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedItems.map(item => (
                    <div key={item.id} className="flex gap-4 bg-[#2a2d3d] p-3 rounded-xl border border-[#34384c]">
                      <div className="w-16 h-16 rounded-lg bg-[#1e1f2e] overflow-hidden flex-shrink-0">
                        {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                        <p className="text-xs text-gray-400">{item.category}</p>
                        <p className="text-sm font-semibold text-blue-400 mt-1">${Number(item.price).toFixed(2)}</p>
                      </div>
                      <button 
                        onClick={() => toggleSelection(item)}
                        className="text-gray-500 hover:text-red-500 self-start p-1"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                  
                  <div className="mt-8 pt-6 border-t border-[#34384c]">
                    <div className="flex justify-between items-end mb-6">
                      <span className="text-gray-400 font-medium">Estimated Total</span>
                      <span className="text-3xl font-black text-white">${totalPrice.toFixed(2)}</span>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Contact Information</h3>
                      <div>
                        <input 
                          type="text" 
                          placeholder="Your Full Name *"
                          value={clientInfo.name}
                          onChange={(e) => setClientInfo({...clientInfo, name: e.target.value})}
                          className="w-full bg-[#12131c] border border-[#34384c] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div>
                        <input 
                          type="email" 
                          placeholder="Your Email *"
                          value={clientInfo.email}
                          onChange={(e) => setClientInfo({...clientInfo, email: e.target.value})}
                          className="w-full bg-[#12131c] border border-[#34384c] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div>
                        <input 
                          type="text" 
                          placeholder="Project Address (Optional)"
                          value={clientInfo.address}
                          onChange={(e) => setClientInfo({...clientInfo, address: e.target.value})}
                          className="w-full bg-[#12131c] border border-[#34384c] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div>
                        <input 
                          type="tel" 
                          placeholder="Your Phone Number *"
                          value={clientInfo.phone}
                          onChange={(e) => setClientInfo({...clientInfo, phone: e.target.value})}
                          className="w-full bg-[#12131c] border border-[#34384c] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div className="flex items-start gap-3 mt-2 bg-[#12131c] p-3 rounded-lg border border-[#34384c]">
                        <input 
                          type="checkbox" 
                          id="smsOptIn"
                          checked={clientInfo.smsOptIn}
                          onChange={(e) => setClientInfo({...clientInfo, smsOptIn: e.target.checked})}
                          className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-[#2a2d3d]"
                        />
                        <label htmlFor="smsOptIn" className="text-xs text-gray-400 leading-tight">
                          By checking this box, you agree to receive SMS text messages from Barba Construction regarding your estimates, projects, and appointments (optional). Consent is not a condition of purchase or completing any transaction or service. Message frequency varies. Message & data rates may apply. Reply STOP to opt out, HELP for help. See our <a href="/privacy-policy" className="text-blue-400 underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and <a href="/terms-of-service" className="text-blue-400 underline" target="_blank" rel="noopener noreferrer">Terms of Service</a>.
                        </label>
                      </div>
                      
                      <div className="flex flex-col gap-3 mt-4">
                        <button 
                          onClick={handleSendWhatsApp}
                          className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-[#25D366]/20"
                        >
                          <Send size={20} />
                          Send via WhatsApp
                        </button>

                        <button 
                          onClick={handleSendEmail}
                          disabled={isSendingEmail}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-blue-600/20"
                        >
                          {isSendingEmail ? (
                            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                          ) : (
                            <Send size={20} />
                          )}
                          Send Selection by Email
                        </button>
                      </div>
                      <p className="text-xs text-center text-gray-500 mt-2">
                        This will open WhatsApp with your selection to send to our team.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
