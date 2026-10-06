import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default leaflet icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface JobLocation {
  id: string;
  lat: number;
  lng: number;
  funcao: string;
  valor: number;
  empresa_nome: string;
}

interface JobsMapProps {
  jobs: JobLocation[];
  onMarkerClick: (jobId: string) => void;
  center?: [number, number]; // [lat, lng]
}

export function JobsMap({ jobs, onMarkerClick, center = [-23.5505, -46.6333] }: JobsMapProps) {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-border shadow-sm z-0 relative">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {jobs.filter(j => j.lat && j.lng).map((job) => (
          <Marker 
            key={job.id} 
            position={[job.lat, job.lng]}
            eventHandlers={{
              click: () => onMarkerClick(job.id),
            }}
          >
            <Popup className="custom-popup">
              <div className="text-sm">
                <p className="font-bold text-foreground">{job.funcao}</p>
                <p className="text-muted-foreground">{job.empresa_nome}</p>
                <p className="text-accent font-semibold mt-1">R$ {job.valor}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
