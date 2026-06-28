import { useState, useEffect, useRef } from 'react';
import { Search, Satellite, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { useEstimatorStore } from '../../store/useEstimatorStore';

export default function SolarScanWidget() {
  const [address, setAddress] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState(null); // { lat, lng }

  const { roofingConfig, setRoofingField } = useEstimatorStore();

  const inputRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

  // Initialize Autocomplete on mount
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
        const script = document.getElementById(scriptId);
        script.addEventListener('load', initAutocomplete);
      }
    }
  }, []);

  // Initialize or update the Google Map when mapCenter changes
  useEffect(() => {
    if (!mapCenter || !window.google || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create map instance
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: mapCenter,
        zoom: 20,
        mapTypeId: 'satellite',
        tilt: 0, // Force 2D overhead view
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapInstanceRef.current = map;

      // Create draggable marker instance
      const marker = new window.google.maps.Marker({
        position: mapCenter,
        map: map,
        draggable: true,
        title: 'Drag to adjust scan position',
      });
      markerInstanceRef.current = marker;

      // Listen to marker dragend
      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        if (pos) {
          handleScanAtCoords(pos.lat(), pos.lng());
        }
      });

      // Listen to map click to reposition and scan
      map.addListener('click', (e) => {
        if (e.latLng) {
          marker.setPosition(e.latLng);
          handleScanAtCoords(e.latLng.lat(), e.latLng.lng());
        }
      });
    } else {
      // Smoothly pan to the new center and update marker position
      mapInstanceRef.current.panTo(mapCenter);
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setPosition(mapCenter);
      }
    }
  }, [mapCenter]);

  // Core solar scan trigger
  const runSolarScan = async (lat, lng, apiKey) => {
    setScanning(true);
    setResult(null);
    setError(null);

    try {
      const solarRes = await fetch(`https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=HIGH&key=${apiKey}`);
      
      if (solarRes.status === 404) {
        throw new Error('No Google Solar satellite coverage for this exact location.');
      }
      
      const solarData = await solarRes.json();

      if (solarData.error) {
        throw new Error(solarData.error.message || 'No satellite data for this location');
      }

      if (!solarData.solarPotential) {
        throw new Error('Could not identify a building roof at this exact coordinate. Try clicking closer to the center of the roof.');
      }

      const areaMeters = solarData.solarPotential.wholeRoofStats?.areaMeters2 || 0;
      const areaSqFt = Math.round(areaMeters * 10.7639);
      const squares = (areaSqFt / 100).toFixed(1);

      // Calculate Pitch (inclination) from biggest segment
      let pitchStr = 'N/A';
      if (solarData.solarPotential.roofSegmentStats?.length > 0) {
        const biggestSegment = solarData.solarPotential.roofSegmentStats.reduce((prev, current) => 
          ((prev.stats?.areaMeters2 || 0) > (current.stats?.areaMeters2 || 0)) ? prev : current
        );
        const pitchDegrees = biggestSegment.pitchDegrees || 0;
        const pitchRatio = Math.round(Math.tan(pitchDegrees * Math.PI / 180) * 12);
        pitchStr = `${pitchRatio}/12`;
      }

      const finalResult = {
        areaSqFt,
        squares: squares.replace('.0', ''),
        pitch: pitchStr,
        confidence: 'High',
        lat,
        lng
      };
      
      setResult(finalResult);
      
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error scanning this location');
    } finally {
      setScanning(false);
    }
  };

  // Run scan when address autocomplete or search is clicked
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
      setMapCenter({ lat, lng });

      // Run initial scan
      await runSolarScan(lat, lng, apiKey);
      
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error connecting to satellite');
    } finally {
      setScanning(false);
    }
  };

  // Run scan directly from click or drag coordinates
  const handleScanAtCoords = async (lat, lng) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;
    await runSolarScan(lat, lng, apiKey);
  };

  // Add/Set values in estimator store
  const handleSetInEstimator = () => {
    if (!result) return;
    setRoofingField('squares', result.squares);
    alert(`Estimador actualizado con ${result.squares} SQ.`);
  };

  const handleAddToEstimator = () => {
    if (!result) return;
    const currentVal = parseFloat(roofingConfig?.squares) || 0;
    const scanVal = parseFloat(result.squares) || 0;
    const newVal = currentVal + scanVal;
    const formatted = newVal.toFixed(1).replace('.0', '');
    setRoofingField('squares', formatted);
    alert(`Se sumaron ${result.squares} SQ. Nuevo total: ${formatted} SQ.`);
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
            <p className="text-xs text-[#888888] m-0">Estimate main house, garage, or secondary roof dimensions via satellite</p>
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

        {/* Interactive Google Map */}
        {mapCenter && (
          <div className="mt-6">
            <p className="text-xs text-amber-500/80 mb-2 flex items-center gap-1">
              <Satellite size={12} className="text-amber-400" />
              Vista satelital activa. Haz clic en el techo de un garaje o estructura secundaria (o arrastra el marcador rojo) para escanearlo.
            </p>
            <div 
              ref={mapContainerRef} 
              style={{ width: '100%', height: '340px' }} 
              className="rounded-xl border border-[#2a2a2a] overflow-hidden" 
            />
          </div>
        )}

        {/* Scan Animation */}
        {scanning && (
          <div className="mt-6 flex flex-col items-center justify-center py-6 border-t border-[#2a2a2a]/40">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 border-2 border-amber-500 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-2 border-2 border-amber-400 rounded-full animate-ping opacity-40" style={{ animationDelay: '300ms' }}></div>
              <div className="absolute inset-0 bg-amber-500/10 rounded-full flex items-center justify-center">
                <Satellite size={28} className="text-amber-400 animate-pulse" />
              </div>
            </div>
            <p className="text-sm font-semibold text-amber-400 animate-pulse">Obtaining satellite roof geometry...</p>
          </div>
        )}

        {/* Error Boundary */}
        {error && !scanning && (
          <div className="mt-6 border-t border-[#2a2a2a]/40 pt-5">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
              <p className="text-red-400 font-bold text-sm mb-1">Satellite Error</p>
              <p className="text-[#888888] text-xs">{error}</p>
            </div>
          </div>
        )}

        {/* Result Area */}
        {result && !scanning && (
          <div className="mt-6 border-t border-[#2a2a2a]/40 pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-emerald-400 mb-1">
                  <CheckCircle2 size={16} /> Análisis de Satélite Completado
                </p>
                <p className="text-xs text-[#888888]">Aplica estos resultados al estimador usando las opciones de abajo.</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#888888] uppercase tracking-wider mb-1">Confianza (IA)</p>
                <p className="text-sm font-bold text-[#f0f0f0]">{result.confidence}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              <div className="bg-[#0d0d0d] p-4 rounded-xl border border-[#2a2a2a] flex justify-between items-center">
                <span className="text-xs text-[#555] uppercase tracking-wider">Área Total</span>
                <span className="text-md font-bold text-[#f0f0f0]">{result.areaSqFt} <span className="text-xs text-[#888]">sq ft</span></span>
              </div>
              <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/30 flex justify-between items-center">
                <span className="text-xs text-amber-500/70 uppercase tracking-wider font-bold">Squares Escaneados</span>
                <span className="text-xl font-black text-amber-400">{result.squares} SQ</span>
              </div>
              <div className="bg-[#0d0d0d] p-4 rounded-xl border border-[#2a2a2a] flex justify-between items-center">
                <span className="text-xs text-[#555] uppercase tracking-wider">Inclinación (Pitch)</span>
                <span className="text-md font-bold text-[#f0f0f0]">{result.pitch}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <button
                onClick={handleSetInEstimator}
                className="bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-600/10 cursor-pointer"
              >
                Establecer en Estimador (Reemplazar con {result.squares} SQ)
              </button>
              <button
                onClick={handleAddToEstimator}
                className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10 cursor-pointer"
              >
                Sumar al Estimador (+ {result.squares} SQ)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
