import { useState } from 'react';
import { MapPin, Search } from 'lucide-react';

export const ATMView = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mapLocation, setMapLocation] = useState('Madrid');

  const allAtms = [
    { name: 'Santander - Plaza Mayor', distance: '0.5 km', address: 'Plaza Mayor 1, Madrid', city: 'Madrid' },
    { name: 'CaixaBank - Gran Vía', distance: '0.8 km', address: 'Gran Vía 45, Madrid', city: 'Madrid' },
    { name: 'Santander - Sol', distance: '1.2 km', address: 'Puerta del Sol, Madrid', city: 'Madrid' },
    { name: 'BBVA - Plaza Cataluña', distance: '0.3 km', address: 'Plaza Cataluña 5, Barcelona', city: 'Barcelona' },
    { name: 'Santander - Las Ramblas', distance: '0.7 km', address: 'Las Ramblas 23, Barcelona', city: 'Barcelona' },
    { name: 'CaixaBank - Paseo de Gracia', distance: '1.0 km', address: 'Paseo de Gracia 67, Barcelona', city: 'Barcelona' },
  ];

  const filteredAtms = searchQuery.trim()
    ? allAtms.filter(atm =>
        atm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        atm.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        atm.city.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allAtms.filter(atm => atm.city === mapLocation);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const foundAtm = allAtms.find(atm =>
        atm.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        atm.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (foundAtm) {
        setMapLocation(foundAtm.city);
      }
    }
  };

  const getMapUrl = () => {
    const encodedLocation = encodeURIComponent(`cajeros ${mapLocation} España`);
    return `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedLocation}&zoom=13`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Cajeros Automáticos</h2>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por ciudad o ubicación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
          />
        </form>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setMapLocation('Madrid')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              mapLocation === 'Madrid'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Madrid
          </button>
          <button
            onClick={() => setMapLocation('Barcelona')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              mapLocation === 'Barcelona'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Barcelona
          </button>
        </div>
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
        {filteredAtms.length > 0 ? (
          filteredAtms.map((atm, index) => (
            <div
              key={index}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-emerald-600 transition-all cursor-pointer"
              onClick={() => setMapLocation(atm.city)}
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
          ))
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <p className="text-gray-400">No se encontraron cajeros para tu búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
};
