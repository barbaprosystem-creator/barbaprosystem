import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HardHat, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ContactUs() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // split name into first and last
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      // Append SMS opt-in status to notes
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
      const consentText = smsOptIn 
        ? `\n\n[SMS Consent: Opted-In on ${timestamp} EST]`
        : `\n\n[SMS Consent: Opted-Out / Not Provided on ${timestamp} EST]`;
      const finalNotes = formData.notes + consentText;

      const { error } = await supabase.from('contacts').insert([{
        first_name: firstName,
        last_name: lastName,
        phone: formData.phone,
        notes: finalNotes,
        source: 'web',
        pipeline_status: 'new'
      }]);

      if (error) throw error;
      setSubmitted(true);
      setSmsOptIn(false);
    } catch (err) {
      alert('Error sending request: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-lg p-8 shadow-2xl relative overflow-hidden">
        
        <div className="flex justify-center mb-6">
          <div className="bg-[#FACB00] text-black p-3 rounded-xl shadow-[0_0_20px_rgba(250,203,0,0.3)]">
            <HardHat size={40} />
          </div>
        </div>
        
        <h1 className="text-3xl font-black text-white text-center mb-2">Barba Construction</h1>
        <p className="text-gray-400 text-center mb-8">Get a free estimate for your project</p>

        {submitted ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-8 text-center animate-in fade-in zoom-in duration-300">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Request Received</h2>
            <p className="text-gray-400 text-sm">
              Thank you for contacting us. We will get back to you shortly to discuss your project.
            </p>
            <button 
              onClick={() => {
                setSubmitted(false);
                setFormData({ name: '', phone: '', notes: '' });
              }}
              className="mt-6 text-[#FACB00] hover:underline text-sm font-medium"
            >
              Submit another request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled={loading}
                className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FACB00] transition-colors"
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number</label>
              <input 
                required
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                disabled={loading}
                className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FACB00] transition-colors mb-2"
                placeholder="(502) 123-4567"
              />
              
              {/* TWILIO COMPLIANCE TEXT - OPTIONAL CHECKBOX */}
              <div className="flex items-start gap-3 mt-2 bg-[#1a1a1a] p-3 rounded-lg border border-[#333]">
                <input 
                  type="checkbox" 
                  id="smsOptIn"
                  checked={smsOptIn}
                  onChange={(e) => setSmsOptIn(e.target.checked)}
                  disabled={loading}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-[#FACB00] focus:ring-[#FACB00] bg-[#0a0a0a]"
                />
                <label htmlFor="smsOptIn" className="text-xs text-gray-400 leading-normal">
                  I agree to receive SMS text messages from Barba Construction regarding my estimates, project updates, and appointments (optional). Consent is not a condition of purchase or completing any transaction or service. Message frequency varies. Message & data rates may apply. Reply STOP to opt out, HELP for help. View our <Link to="/privacy-policy" className="text-[#FACB00] hover:underline">Privacy Policy</Link> and <Link to="/terms-of-service" className="text-[#FACB00] hover:underline">Terms of Service</Link>.
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Project Description</label>
              <textarea 
                required
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                disabled={loading}
                className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FACB00] transition-colors min-h-[100px]"
                placeholder="I need a new roof installed..."
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#FACB00] text-black font-bold text-lg py-3 rounded-lg hover:bg-[#e0b600] transition-all flex justify-center items-center gap-2 mt-4 shadow-lg hover:shadow-[#FACB00]/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              {loading ? 'Sending...' : 'Submit Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
