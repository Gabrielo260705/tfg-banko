import { MapPin, Search } from 'lucide-react';

export const ATMView = () => {
  const atms = [
    { name: 'Santander - Plaza Mayor', distance: '0.5 km', address: 'Plaza Mayor 1, Madrid' },
    { name: 'CaixaBank - Gran Vía', distance: '0.8 km', address: 'Gran Vía 45, Madrid' },
    { name: 'Santander - Sol', distance: '1.2 km', address: 'Puerta del Sol, Madrid' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Cajeros Automáticos</h2>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar ubicación..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
          />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d24305.14676439103!2d-3.7087468!3d40.4168!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1scajeros%20santander%20caixabank%20madrid!5e0!3m2!1ses!2ses!4v1234567890"
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
        {atms.map((atm, index) => (
          <div key={index} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-emerald-600 transition-all cursor-pointer">
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
