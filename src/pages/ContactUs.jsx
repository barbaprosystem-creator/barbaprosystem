import React, { useState } from 'react';
import Link from 'next/link';
import { HardHat, Send, CheckCircle2 } from 'lucide-react';

export default function ContactUs() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
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
              onClick={() => setSubmitted(false)}
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
                className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FACB00] transition-colors"
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number</label>
              <input 
                required
                type="tel" 
                className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FACB00] transition-colors mb-2"
                placeholder="(555) 123-4567"
              />
              
              {/* TWILIO COMPLIANCE TEXT - DO NOT REMOVE */}
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 text-xs text-gray-400 leading-relaxed">
                By providing your phone number, you agree to receive text messages from Barba Construction regarding your estimate, project updates, and appointments. Message and data rates may apply. Message frequency varies. Reply STOP to opt-out or HELP for help. View our <Link href="/privacy" className="text-[#FACB00] hover:underline">Privacy Policy</Link> and <Link href="/terms" className="text-[#FACB00] hover:underline">Terms of Service</Link>.
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Project Description</label>
              <textarea 
                required
                className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FACB00] transition-colors min-h-[100px]"
                placeholder="I need a new roof installed..."
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-[#FACB00] text-black font-bold text-lg py-3 rounded-lg hover:bg-[#e0b600] transition-all flex justify-center items-center gap-2 mt-4 shadow-lg hover:shadow-[#FACB00]/20"
            >
              <Send size={20} />
              Submit Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
