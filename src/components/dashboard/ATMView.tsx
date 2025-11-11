import { useState } from 'react';
import { MapPin, Search } from 'lucide-react';

export const ATMView = () => {
  const [citySearch, setCitySearch] = useState('');
  const [mapLocation, setMapLocation] = useState('Madrid');

  const allAtms = [
    { name: 'Santander - Plaza Mayor', distance: '0.5 km', address: 'Plaza Mayor 1, Madrid', city: 'Madrid' },
    { name: 'CaixaBank - Gran Vía', distance: '0.8 km', address: 'Gran Vía 45, Madrid', city: 'Madrid' },
    { name: 'Santander - Sol', distance: '1.2 km', address: 'Puerta del Sol, Madrid', city: 'Madrid' },
    { name: 'BBVA - Plaza Cataluña', distance: '0.3 km', address: 'Plaza Cataluña 5, Barcelona', city: 'Barcelona' },
    { name: 'Santander - Las Ramblas', distance: '0.7 km', address: 'Las Ramblas 23, Barcelona', city: 'Barcelona' },
    { name: 'CaixaBank - Paseo de Gracia', distance: '1.0 km', address: 'Paseo de Gracia 67, Barcelona', city: 'Barcelona' },
  ];

  const filteredAtms = allAtms.filter(atm => atm.city === mapLocation);

  const handleCitySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (citySearch.trim()) {
      setMapLocation(citySearch);
    }
  };

  const getMapUrl = () => {
    const encodedLocation = encodeURIComponent(`cajeros ${mapLocation}`);
    return `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedLocation}&zoom=13`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Cajeros Automáticos</h2>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <form onSubmit={handleCitySearch} className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar ubicación (ciudad, dirección, código postal)..."
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
          />
        </form>
        <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
          <iframe
            key={mapLocation}
            src={getMapUrl()}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Mapa de Cajeros"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredAtms.map((atm, index) => (
          <div
            key={index}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-emerald-600 transition-all cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{atm.name}</h3>
                <p className="text-sm text-gray-400">{atm.address}</p>
                <p className="text-sm text-emerald-500 mt-1">{atm.distance}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
