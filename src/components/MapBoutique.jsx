import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BOUTIQUE as DEFAULT_BOUTIQUE } from '../data/infos';

// Carte OpenStreetMap (gratuite, sans clé). Coordonnées pilotables via la configuration.
export const COORDS = [48.8606, 2.3376];

export default function MapBoutique({ className = '', coords, nom, boutique }) {
  const ref = useRef(null);
  const BOUTIQUE = { nom: nom || DEFAULT_BOUTIQUE.nom, ...DEFAULT_BOUTIQUE, ...(boutique || {}) };
  const center = Array.isArray(coords) && coords.length === 2 ? coords : COORDS;

  useEffect(() => {
    const map = L.map(ref.current, { scrollWheelZoom: false, zoomControl: false, attributionControl: true }).setView(center, 16);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const icon = L.divIcon({
      className: '',
      html: `<div style="width:44px;height:44px;border-radius:50%;background:#1b1512;border:3px solid #e0b054;box-shadow:0 10px 24px rgba(27,21,18,.35);display:flex;align-items:center;justify-content:center">
               <svg viewBox="0 0 64 64" width="26" height="26" fill="none"><path d="M14 40c0-12 8-22 18-22s18 10 18 22c0 5-5 7-18 7S14 45 14 40Z" fill="#e0b054"/><path d="M22 30l8 8 8-8M19 39l11 7 11-7" stroke="#1b1512" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
             </div>`,
      iconSize: [44, 44], iconAnchor: [22, 44], popupAnchor: [0, -40],
    });
    L.marker(center, { icon }).addTo(map)
      .bindPopup(`<strong style="font-family:Fraunces,Georgia,serif;font-size:15px">${BOUTIQUE.nom}</strong><br>${BOUTIQUE.adresse}<br>${BOUTIQUE.codePostal} ${BOUTIQUE.ville}`)
      .openPopup();

    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], BOUTIQUE.nom, BOUTIQUE.adresse]);

  return <div ref={ref} className={`relative z-0 ${className}`} aria-label="Carte d'accès à la boutique" role="img" />;
}
