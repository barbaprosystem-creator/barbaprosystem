import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HardHat, Send, CheckCircle2, ChevronRight, Phone, Mail, MapPin, Hammer, ShieldCheck, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';

// Animation Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const imageReveal = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function LandingPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#FACB00] selection:text-black">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-shrink-0 flex items-center gap-3"
            >
              <img src="/landing/logo.png" alt="Barba Construction" className="h-10 w-auto" />
              <span className="font-black text-xl tracking-tight">BARBA CONSTRUCTION</span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden md:flex space-x-8"
            >
              <a href="#services" className="text-gray-300 hover:text-[#FACB00] font-medium transition-colors">Services</a>
              <a href="#portfolio" className="text-gray-300 hover:text-[#FACB00] font-medium transition-colors">Portfolio</a>
              <a href="#about" className="text-gray-300 hover:text-[#FACB00] font-medium transition-colors">About Us</a>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <a href="#contact" className="bg-[#FACB00] text-black px-6 py-2.5 rounded-full font-bold hover:bg-[#e0b600] transition-colors shadow-[0_0_15px_rgba(250,203,0,0.2)] hover:shadow-[0_0_20px_rgba(250,203,0,0.4)]">
                Get a Free Estimate
              </a>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex items-center min-h-[90vh]">
        <div className="absolute inset-0 z-0">
          <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
            src="/landing/portfolio-1.jpg" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-20" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
          <motion.h1 
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight leading-tight"
          >
            Building Excellence, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FACB00] to-yellow-200">Restoring Trust.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mt-4 max-w-2xl text-xl text-gray-300 mx-auto mb-10 leading-relaxed"
          >
            Premium Roofing, Siding, and Gutters in Louisville. We deliver top-quality craftsmanship with materials built to last a lifetime.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <a href="#contact" className="bg-[#FACB00] text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-[#e0b600] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-[#FACB00]/20">
              Request an Estimate <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </a>
            <a href="#portfolio" className="bg-[#111] border border-[#333] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#222] hover:border-[#FACB00]/50 transition-all flex items-center justify-center backdrop-blur-md">
              View Our Work
            </a>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-[#111] border-y border-[#222] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FACB00]/5 rounded-full blur-[100px] -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-sm font-bold text-[#FACB00] uppercase tracking-widest mb-2">Our Expertise</h2>
            <h3 className="text-3xl md:text-5xl font-black tracking-tight">Professional Services</h3>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div variants={fadeInUp} className="bg-[#0a0a0a] p-10 rounded-3xl border border-[#222] hover:border-[#FACB00]/50 hover:-translate-y-2 transition-all duration-300 group shadow-lg">
              <div className="bg-[#111] w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#FACB00]/10 transition-colors">
                <Hammer className="text-[#FACB00]" size={32} />
              </div>
              <h4 className="text-2xl font-bold mb-4">Roofing</h4>
              <p className="text-gray-400 leading-relaxed">
                Complete roof replacements, repairs, and inspections using premium architectural shingles designed to withstand severe weather.
              </p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="bg-[#0a0a0a] p-10 rounded-3xl border border-[#222] hover:border-[#FACB00]/50 hover:-translate-y-2 transition-all duration-300 group shadow-lg">
              <div className="bg-[#111] w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#FACB00]/10 transition-colors">
                <ShieldCheck className="text-[#FACB00]" size={32} />
              </div>
              <h4 className="text-2xl font-bold mb-4">Siding</h4>
              <p className="text-gray-400 leading-relaxed">
                Transform your home's exterior with high-quality vinyl, fiber cement, or wood siding installations that improve insulation and curb appeal.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-[#0a0a0a] p-10 rounded-3xl border border-[#222] hover:border-[#FACB00]/50 hover:-translate-y-2 transition-all duration-300 group shadow-lg">
              <div className="bg-[#111] w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#FACB00]/10 transition-colors">
                <Wrench className="text-[#FACB00]" size={32} />
              </div>
              <h4 className="text-2xl font-bold mb-4">Gutters</h4>
              <p className="text-gray-400 leading-relaxed">
                Seamless gutter installation and repair services to protect your home's foundation and roof from water damage.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-24 relative">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#FACB00]/5 rounded-full blur-[120px] -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-sm font-bold text-[#FACB00] uppercase tracking-widest mb-2">Our Work</h2>
            <h3 className="text-3xl md:text-5xl font-black tracking-tight">Recent Projects</h3>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <motion.div 
                key={num} 
                variants={imageReveal}
                className="aspect-square rounded-2xl overflow-hidden relative group border border-[#222]"
              >
                <img 
                  src={`/landing/portfolio-${num}.jpg`} 
                  alt={`Project ${num}`} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <span className="font-bold text-[#FACB00] translate-y-4 group-hover:translate-y-0 transition-transform duration-300">View Project</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact Section (Twilio Compliant) */}
      <section id="contact" className="py-24 bg-[#111] border-t border-[#222] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Contact Info */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeInUp}
            >
              <h2 className="text-sm font-bold text-[#FACB00] uppercase tracking-widest mb-2">Get in Touch</h2>
              <h3 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-tight">Ready to start <br/>your project?</h3>
              <p className="text-gray-400 text-lg mb-12 leading-relaxed max-w-lg">
                Fill out the form to request a free, no-obligation estimate. Our team will review your details and contact you shortly.
              </p>
              
              <div className="space-y-8">
                <div className="flex items-center gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-[#222] group-hover:bg-[#FACB00] transition-colors flex items-center justify-center text-[#FACB00] group-hover:text-black">
                    <Phone size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Call Us Directly</p>
                    <p className="text-2xl font-bold text-white">(502) 305-8421</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-[#222] group-hover:bg-[#FACB00] transition-colors flex items-center justify-center text-[#FACB00] group-hover:text-black">
                    <Mail size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Email Us</p>
                    <p className="text-xl font-bold text-white">barbaconstruct@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-[#222] group-hover:bg-[#FACB00] transition-colors flex items-center justify-center text-[#FACB00] group-hover:text-black">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Our Office</p>
                    <p className="text-lg font-bold text-white">5910 Preston Hwy, Louisville, KY 40219</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Twilio Compliant Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="bg-[#0a0a0a] border border-[#333] rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FACB00]/10 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none" />
              
              <h3 className="text-3xl font-black text-white mb-8">Request an Estimate</h3>
              
              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-10 text-center"
                >
                  <CheckCircle2 size={56} className="text-emerald-500 mx-auto mb-6" />
                  <h4 className="text-2xl font-bold text-white mb-3">Request Received!</h4>
                  <p className="text-gray-400">
                    Thank you for contacting Barba Construction. We will get back to you shortly.
                  </p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="mt-8 px-6 py-2 rounded-full border border-[#FACB00] text-[#FACB00] hover:bg-[#FACB00] hover:text-black transition-colors font-bold text-sm uppercase tracking-wider"
                  >
                    Submit another request
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-[#111] border border-[#333] text-white rounded-xl px-5 py-4 focus:outline-none focus:border-[#FACB00] focus:ring-1 focus:ring-[#FACB00] transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Phone Number</label>
                    <input 
                      required
                      type="tel" 
                      className="w-full bg-[#111] border border-[#333] text-white rounded-xl px-5 py-4 focus:outline-none focus:border-[#FACB00] focus:ring-1 focus:ring-[#FACB00] transition-all mb-3"
                      placeholder="(502) 123-4567"
                    />
                    
                    {/* TWILIO COMPLIANCE TEXT - MANDATORY */}
                    <div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-4 text-xs text-gray-400 leading-relaxed">
                      By providing your phone number, you agree to receive text messages from Barba Construction regarding your estimate, project updates, and appointments. Message and data rates may apply. Message frequency varies. Reply STOP to opt-out or HELP for help. View our <Link to="/privacy" className="text-[#FACB00] hover:underline">Privacy Policy</Link> and <Link to="/terms" className="text-[#FACB00] hover:underline">Terms of Service</Link>.
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Project Details</label>
                    <textarea 
                      required
                      className="w-full bg-[#111] border border-[#333] text-white rounded-xl px-5 py-4 focus:outline-none focus:border-[#FACB00] focus:ring-1 focus:ring-[#FACB00] transition-all min-h-[120px] resize-y"
                      placeholder="Tell us what you need help with..."
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-[#FACB00] text-black font-black text-lg py-4 rounded-xl hover:bg-[#e0b600] active:scale-[0.98] transition-all flex justify-center items-center gap-3 shadow-lg shadow-[#FACB00]/20 hover:shadow-[#FACB00]/40"
                  >
                    <Send size={22} />
                    Send Request
                  </button>
                </form>
              )}
            </motion.div>
            
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#050505] py-12 border-t border-[#111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4 opacity-70 hover:opacity-100 transition-opacity">
            <img src="/landing/logo.png" alt="Barba Construction" className="h-10 w-auto grayscale" />
            <span className="font-bold tracking-widest text-sm">BARBA CONSTRUCTION &copy; {new Date().getFullYear()}</span>
          </div>
          <div className="text-gray-500 text-sm flex flex-wrap justify-center gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/eula" className="hover:text-white transition-colors">EULA</Link>
            <Link to="/login" className="text-[#FACB00] hover:text-white transition-colors flex items-center gap-1 md:ml-4 md:pl-4 md:border-l border-[#333]">
               Employee Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
