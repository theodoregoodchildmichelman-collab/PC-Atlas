import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const cityCoordinates = {
    'Skopje': [41.9981, 21.4254],
    'Bitola': [41.0297, 21.3292],
    'Tetovo': [42.0102, 20.9715],
    'Stip': [41.7455, 22.1958],
    'Prilep': [41.3464, 21.5542],
    'Ohrid': [41.1172, 20.8016],
    'Kumanovo': [42.1322, 21.7144],
    'Veles': [41.7165, 21.7723],
    'Strumica': [41.4378, 22.6427],
    'Kocani': [41.9169, 22.4083],
    'Gostivar': [41.8025, 20.9089],
    'Kavadarci': [41.4331, 22.0119],
    'Gevgelija': [41.1392, 22.5025],
    'Struga': [41.1778, 20.6783],
    'Radovish': [41.6383, 22.4647],
    'Debar': [41.5250, 20.5272],
    'Probistip': [42.0006, 22.1767],
    'Sveti Nikole': [41.8650, 21.9422]
};

// Custom Red Icon
const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export default function ResourceMap({ resources, onResourceClick }) {
    const validResources = resources.filter(r => r.location && cityCoordinates[r.location]);

    return (
        <div className="h-[600px] w-full rounded-3xl overflow-hidden border border-gray-200 shadow-lg z-0">
            <MapContainer
                center={[41.6086, 21.7453]}
                zoom={8}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {validResources.map(resource => (
                    <Marker
                        key={resource.id}
                        position={cityCoordinates[resource.location]}
                        icon={redIcon}
                    >
                        <Popup>
                            <div className="min-w-[200px]">
                                <h3 className="font-bold text-gray-900 mb-1">{resource.title}</h3>
                                <p className="text-xs text-gray-500 mb-2">by {resource.authorName || 'Anonymous'}</p>
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {resource.tags.slice(0, 3).map(tag => (
                                        <span key={tag} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <button
                                    onClick={() => onResourceClick(resource)}
                                    className="w-full bg-indigo-600 text-white text-xs font-bold py-2 rounded hover:bg-indigo-700 transition-colors"
                                >
                                    View Resource
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
