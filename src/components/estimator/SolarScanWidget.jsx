import { useState, useEffect, useRef } from 'react';
import { Search, Satellite, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { useEstimatorStore } from '../../store/useEstimatorStore';

export default function SolarScanWidget() {
  const [address, setAddress] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { setRoofingField } = useEstimatorStore();
  const inputRef = useRef(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    const initAutocomplete = () => {
      if (!inputRef.current || !window.google) return;
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        fields: ['formatted_address', 'geometry'],
        types: ['address']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        console.log("Place Selected:", place);
        if (place.formatted_address) {
          setAddress(place.formatted_address);
        } else if (place.name) {
          setAddress(place.name);
        }
      });
    };

    if (window.google && window.google.maps) {
      initAutocomplete();
    } else {
      const scriptId = 'google-maps-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = initAutocomplete;
        document.head.appendChild(script);
      } else {
        // If script is already there but loading
        const script = document.getElementById(scriptId);
        script.addEventListener('load', initAutocomplete);
      }
    }
  }, []);

  const handleScan = async () => {
    if (!address.trim()) return;
    setScanning(true);
    setResult(null);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) throw new Error('API Key not configured in .env');

      // 1. Geocoding
      const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
      const geoData = await geoRes.json();
      
      if (geoData.status !== 'OK' || !geoData.results.length) {
        throw new Error(geoData.error_message || `Geocoding error: ${geoData.status}. Make sure the 'Geocoding API' is enabled.`);
      }

      const { lat, lng } = geoData.results[0].geometry.location;

      // 2. Solar API
      const solarRes = await fetch(`https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=HIGH&key=${apiKey}`);
      
      if (solarRes.status === 404) {
        throw new Error('No Google Solar satellite coverage for this exact location.');
      }
      
      const solarData = await solarRes.json();

      if (solarData.error) {
         throw new Error(solarData.error.message || 'No satellite data for this location');
      }

      if (!solarData.solarPotential) {
         throw new Error('Could not identify the roof at this location');
      }

      const areaMeters = solarData.solarPotential.wholeRoofStats?.areaMeters2 || 0;
      const areaSqFt = Math.round(areaMeters * 10.7639);
      const squares = (areaSqFt / 100).toFixed(1);

      // Calcular Pitch (inclinación) promedio basado en el segmento más grande
      let pitchStr = 'N/A';
      if (solarData.solarPotential.roofSegmentStats?.length > 0) {
        const biggestSegment = solarData.solarPotential.roofSegmentStats.reduce((prev, current) => 
          ((prev.stats?.areaMeters2 || 0) > (current.stats?.areaMeters2 || 0)) ? prev : current
        );
        const pitchDegrees = biggestSegment.pitchDegrees || 0;
        const pitchRatio = Math.round(Math.tan(pitchDegrees * Math.PI / 180) * 12);
        pitchStr = `${pitchRatio}/12`;
      }

      const mapImageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=20&size=600x400&maptype=satellite&markers=color:red%7C${lat},${lng}&key=${apiKey}`;

      const finalResult = {
        areaSqFt,
        squares: squares.replace('.0', ''),
        pitch: pitchStr,
        confidence: 'High',
        mapImageUrl
      };
      
      setResult(finalResult);
      setRoofingField('squares', finalResult.squares);
      
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error connecting to satellite');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="bg-[#151515] rounded-2xl border border-amber-500/20 overflow-hidden mb-8 relative">
      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/10 via-amber-400 to-amber-500/10" />

      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Satellite className="text-amber-400" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#f0f0f0] m-0">Google Solar Scan</h3>
            <p className="text-xs text-[#888888] m-0">Estimate roof dimensions via satellite</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" size={18} />
            <input 
              ref={inputRef}
              type="text" 
              placeholder="e.g. 123 Main St, Louisville, KY" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              className="w-full bg-[#0d0d0d] border border-[#2a2a2a] text-[#f0f0f0] text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-[#555]"
            />
          </div>
          <button
            onClick={handleScan}
            disabled={!address.trim() || scanning}
            className="bg-amber-600 hover:bg-amber-500 disabled:bg-[#2a2a2a] disabled:text-[#666] text-white px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center min-w-[140px]"
          >
            {scanning ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Scanning...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Search size={16} /> Search
              </span>
            )}
          </button>
        </div>

        {/* Scan Animation / Result Area */}
        {scanning && (
          <div className="mt-6 flex flex-col items-center justify-center py-6 border-t border-[#2a2a2a]/40">
            <div className="relative w-16 h-16 mb-4">
              {/* Radar pulse effect */}
              <div className="absolute inset-0 border-2 border-amber-500 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-2 border-2 border-amber-400 rounded-full animate-ping opacity-40" style={{ animationDelay: '300ms' }}></div>
              <div className="absolute inset-0 bg-amber-500/10 rounded-full flex items-center justify-center">
                <Satellite size={28} className="text-amber-400 animate-pulse" />
              </div>
            </div>
            <p className="text-sm font-semibold text-amber-400 animate-pulse">Getting roof geometry...</p>
          </div>
        )}

        {error && !scanning && (
          <div className="mt-6 border-t border-[#2a2a2a]/40 pt-5">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
              <p className="text-red-400 font-bold text-sm mb-1">Satellite Error</p>
              <p className="text-[#888888] text-xs">{error}</p>
            </div>
          </div>
        )}

        {result && !scanning && (
          <div className="mt-6 border-t border-[#2a2a2a]/40 pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-emerald-400 mb-1">
                  <CheckCircle2 size={16} /> Satellite Analysis Complete
                </p>
                <p className="text-xs text-[#888888]">Squares have been auto-filled in the estimator.</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#888888] uppercase tracking-wider mb-1">Confidence (AI)</p>
                <p className="text-sm font-bold text-[#f0f0f0]">{result.confidence}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
              {/* Left Column: Stats */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-[#0d0d0d] p-4 rounded-xl border border-[#2a2a2a] flex justify-between items-center">
                  <p className="text-xs text-[#555] uppercase tracking-wider mb-1">Total Area</p>
                  <p className="text-lg font-bold text-[#f0f0f0]">{result.areaSqFt} <span className="text-xs text-[#888]">sq ft</span></p>
                </div>
                <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/30 flex justify-between items-center">
                  <p className="text-xs text-amber-500/70 uppercase tracking-wider mb-1">Squares (Auto)</p>
                  <p className="text-2xl font-black text-amber-400">{result.squares}</p>
                </div>
                <div className="bg-[#0d0d0d] p-4 rounded-xl border border-[#2a2a2a] flex justify-between items-center">
                  <p className="text-xs text-[#555] uppercase tracking-wider mb-1">Pitch</p>
                  <p className="text-lg font-bold text-[#f0f0f0]">{result.pitch}</p>
                </div>
              </div>

              {/* Right Column: Satellite Image */}
              <div className="relative rounded-xl overflow-hidden border-2 border-[#2a2a2a] h-48 md:h-full min-h-[180px]">
                {result.mapImageUrl && (
                  <img 
                    src={result.mapImageUrl} 
                    alt="Satellite Roof View" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl pointer-events-none" />
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md">
                  <p className="text-[10px] text-white/70 font-mono flex items-center gap-1">
                    <Satellite size={10} /> SATELLITE
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
