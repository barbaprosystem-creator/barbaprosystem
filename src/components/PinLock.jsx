import { useState, useEffect } from 'react';
import { Lock, Delete } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * PinLock — wraps any content behind a numeric PIN with frosted blur effect.
 * Usage: <PinLock title="Acceso Restringido"><YourContent /></PinLock>
 */
export default function PinLock({ pin: fallbackPin = '2012', children, title = 'Acceso Restringido' }) {
  const [dbPin, setDbPin] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [entered, setEntered]   = useState('');
  const [shake, setShake]       = useState(false);

  useEffect(() => {
    supabase.from('system_settings').select('value').eq('key', 'security_pin').single()
      .then(({ data }) => {
        if (data?.value) setDbPin(data.value);
        else setDbPin(fallbackPin);
      })
      .catch(() => setDbPin(fallbackPin));
  }, [fallbackPin]);

  function pressDigit(d) {
    const activePin = dbPin || fallbackPin;
    if (entered.length >= activePin.length) return;
    const next = entered + d;
    setEntered(next);
    if (next.length === activePin.length) {
      if (next === activePin) {
        setUnlocked(true);
      } else {
        setShake(true);
        setTimeout(() => { setEntered(''); setShake(false); }, 600);
      }
    }
  }

  function pressBack() {
    setEntered(e => e.slice(0, -1));
  }

  if (unlocked) return children;

  return (
    <div className="pin-lock-wrapper">
      {/* Blurred preview of content */}
      <div className="pin-lock-blur" aria-hidden="true">
        {children}
      </div>

      {/* Overlay with PIN pad */}
      <div className="pin-lock-overlay">
        <div className={`pin-lock-card ${shake ? 'pin-shake' : ''}`}>
          <div className="pin-lock-icon">
            <Lock size={28} color="#F5C518" />
          </div>
          <h2 className="pin-lock-title">{title}</h2>
          <p className="pin-lock-sub">Ingresa el código para continuar</p>

          {/* Dots */}
          <div className="pin-dots">
            {Array.from({ length: (dbPin || fallbackPin).length }).map((_, i) => (
              <div key={i} className={`pin-dot ${i < entered.length ? 'filled' : ''}`} />
            ))}
          </div>

          {/* Keypad */}
          <div className="pin-keypad">
            {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => {
              if (k === '') return <div key={i} className="pin-key pin-key-empty" />;
              if (k === '⌫') return (
                <button key={i} className="pin-key pin-key-back" onClick={pressBack}>
                  <Delete size={18} />
                </button>
              );
              return (
                <button key={i} className="pin-key" onClick={() => pressDigit(String(k))}>
                  {k}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
