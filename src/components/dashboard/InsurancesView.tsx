import { useState } from 'react';
import { Shield, Plus, X } from 'lucide-react';

export const InsurancesView = () => {
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const insuranceData: Record<string, { name: string, description: string, price: number, coverage: number }> = {
    home: { name: 'Seguro de Hogar', description: 'Protección completa para tu hogar y familia', price: 25, coverage: 100000 },
    life: { name: 'Seguro de Vida', description: 'Protección para tu futuro y el de tu familia', price: 45, coverage: 250000 },
    health: { name: 'Seguro de Salud', description: 'Cobertura médica completa', price: 85, coverage: 50000 },
    auto: { name: 'Seguro de Auto', description: 'Protección para tu vehículo', price: 35, coverage: 30000 },
  };

  const handleContract = (type: string) => {
    setSelectedType(type);
    setShowContractModal(true);
  };

  const handleDetails = (type: string) => {
    setSelectedType(type);
    setShowDetailsModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Seguros</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {Object.entries(insuranceData).map(([type, data]) => (
          <div key={type} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-emerald-600 transition-all">
            <Shield className="h-12 w-12 text-emerald-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{data.name}</h3>
            <p className="text-gray-400 text-sm mb-4">{data.description}</p>
            <div className="mb-4">
              <div className="text-2xl font-bold text-emerald-500">€{data.price}/mes</div>
              <div className="text-sm text-gray-400">Cobertura hasta €{data.coverage.toLocaleString()}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDetails(type)}
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Ver Detalles
              </button>
              <button
                onClick={() => handleContract(type)}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Contratar
              </button>
            </div>
          </div>
        ))}
      </div>

      {showDetailsModal && selectedType && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{insuranceData[selectedType].name}</h3>
              <button onClick={() => setShowDetailsModal(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-400">{insuranceData[selectedType].description}</p>
              <div>
                <div className="text-sm text-gray-400">Prima mensual</div>
                <div className="text-2xl font-bold text-emerald-500">€{insuranceData[selectedType].price}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Cobertura</div>
                <div className="text-xl font-semibold">€{insuranceData[selectedType].coverage.toLocaleString()}</div>
              </div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>✓ Cobertura 24/7</li>
                <li>✓ Sin deducibles</li>
                <li>✓ Cancelación gratuita</li>
                <li>✓ Renovación automática</li>
              </ul>
              <button
                onClick={() => { setShowDetailsModal(false); handleContract(selectedType); }}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Contratar Ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {showContractModal && selectedType && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Contratar {insuranceData[selectedType].name}</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-400">Prima mensual</div>
                <div className="text-2xl font-bold text-emerald-500">€{insuranceData[selectedType].price}</div>
              </div>
              <p className="text-sm text-gray-400">
                Al contratar este seguro, aceptas los términos y condiciones. La póliza será efectiva inmediatamente después del pago.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowContractModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    alert('Seguro contratado con éxito');
                    setShowContractModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
