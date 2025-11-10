import { useState, useEffect } from 'react';
import { Shield, X, CheckCircle, XCircle, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Insurance {
  id: string;
  user_id: string;
  insurance_type: string;
  policy_number: string;
  premium_amount: number;
  coverage_amount: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export const InsurancesView = () => {
  const { profile } = useAuth();
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [myInsurances, setMyInsurances] = useState<Insurance[]>([]);
  const [activeTab, setActiveTab] = useState<'available' | 'contracted'>('available');

  const insuranceData: Record<string, { name: string, description: string, price: number, coverage: number }> = {
    home: { name: 'Seguro de Hogar', description: 'Protección completa para tu hogar y familia', price: 25, coverage: 100000 },
    life: { name: 'Seguro de Vida', description: 'Protección para tu futuro y el de tu familia', price: 45, coverage: 250000 },
    health: { name: 'Seguro de Salud', description: 'Cobertura médica completa', price: 85, coverage: 50000 },
    auto: { name: 'Seguro de Auto', description: 'Protección para tu vehículo', price: 35, coverage: 30000 },
  };

  useEffect(() => {
    loadMyInsurances();
  }, [profile]);

  const loadMyInsurances = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('insurances')
        .select('*')
        .eq('user_id', profile.id)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error loading insurances:', error);
      } else {
        setMyInsurances(data || []);
      }
    } catch (err) {
      console.error('Exception loading insurances:', err);
    }
  };

  const handleContract = (type: string) => {
    setSelectedType(type);
    setShowContractModal(true);
  };

  const handleDetails = (type: string) => {
    setSelectedType(type);
    setShowDetailsModal(true);
  };

  const confirmContract = async () => {
    console.log('confirmContract called');
    console.log('profile:', profile);
    console.log('selectedType:', selectedType);

    if (!profile || !selectedType) {
      console.log('Missing profile or selectedType, returning early');
      alert('Error: Faltan datos necesarios para contratar el seguro');
      return;
    }

    const insurance = insuranceData[selectedType];
    console.log('insurance data:', insurance);

    const policyNumber = `POL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    console.log('Attempting to insert insurance:', {
      user_id: profile.id,
      insurance_type: selectedType,
      policy_number: policyNumber,
      premium_amount: insurance.price,
      coverage_amount: insurance.coverage,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      is_active: true,
    });

    try {
      const { data, error } = await supabase
        .from('insurances')
        .insert({
          user_id: profile.id,
          insurance_type: selectedType,
          policy_number: policyNumber,
          premium_amount: insurance.price,
          coverage_amount: insurance.coverage,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          is_active: true,
        })
        .select();

      console.log('Insert result:', { data, error });

      if (error) {
        console.error('Error contracting insurance:', error);
        alert('Error al contratar seguro: ' + error.message);
      } else {
        alert('¡Seguro contratado con éxito!\nPóliza: ' + policyNumber);
        setShowContractModal(false);
        loadMyInsurances();
        setActiveTab('contracted');
      }
    } catch (err) {
      console.error('Exception contracting insurance:', err);
      alert('Error al contratar seguro: ' + JSON.stringify(err));
    }
  };

  const cancelInsurance = async (insuranceId: string) => {
    if (!confirm('¿Estás seguro de que quieres cancelar este seguro?')) return;

    try {
      const { error } = await supabase
        .from('insurances')
        .update({ is_active: false })
        .eq('id', insuranceId);

      if (error) {
        console.error('Error cancelling insurance:', error);
        alert('Error al cancelar seguro: ' + error.message);
      } else {
        alert('Seguro cancelado con éxito');
        loadMyInsurances();
      }
    } catch (err) {
      console.error('Exception cancelling insurance:', err);
      alert('Error al cancelar seguro');
    }
  };

  const getInsuranceTypeName = (type: string) => {
    return insuranceData[type]?.name || type;
  };

  const activeInsurances = myInsurances.filter(ins => ins.is_active);
  const cancelledInsurances = myInsurances.filter(ins => !ins.is_active);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Seguros</h2>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'available' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400'
          }`}
        >
          Disponibles
        </button>
        <button
          onClick={() => setActiveTab('contracted')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'contracted' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400'
          }`}
        >
          Mis Seguros ({myInsurances.length})
        </button>
      </div>

      {activeTab === 'available' ? (
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
      ) : (
        <div className="space-y-6">
          {activeInsurances.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                Seguros Activos ({activeInsurances.length})
              </h3>
              <div className="space-y-4">
                {activeInsurances.map((insurance) => (
                  <div key={insurance.id} className="bg-gray-900 border border-emerald-800 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <Shield className="h-8 w-8 text-emerald-500" />
                        <div>
                          <h3 className="text-lg font-semibold">{getInsuranceTypeName(insurance.insurance_type)}</h3>
                          <p className="text-sm text-gray-400">Póliza: {insurance.policy_number}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-emerald-600/20 text-emerald-500">
                        <CheckCircle className="h-3 w-3" />
                        Activo
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-400 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Prima Mensual
                        </div>
                        <div className="text-lg font-semibold">€{insurance.premium_amount}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Cobertura</div>
                        <div className="text-lg font-semibold">€{insurance.coverage_amount.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Inicio
                        </div>
                        <div className="text-sm">{new Date(insurance.start_date).toLocaleDateString('es-ES')}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Vencimiento</div>
                        <div className="text-sm">{new Date(insurance.end_date).toLocaleDateString('es-ES')}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => cancelInsurance(insurance.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Cancelar Seguro
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cancelledInsurances.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Seguros Cancelados ({cancelledInsurances.length})
              </h3>
              <div className="space-y-4">
                {cancelledInsurances.map((insurance) => (
                  <div key={insurance.id} className="bg-gray-900 border border-red-900 rounded-xl p-6 opacity-75">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <Shield className="h-8 w-8 text-gray-500" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-400">{getInsuranceTypeName(insurance.insurance_type)}</h3>
                          <p className="text-sm text-gray-500">Póliza: {insurance.policy_number}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-red-600/20 text-red-500">
                        <XCircle className="h-3 w-3" />
                        Cancelado
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Prima Mensual</div>
                        <div className="text-lg font-semibold text-gray-400">€{insurance.premium_amount}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Cobertura</div>
                        <div className="text-lg font-semibold text-gray-400">€{insurance.coverage_amount.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Estuvo activo desde</div>
                        <div className="text-sm text-gray-400">{new Date(insurance.start_date).toLocaleDateString('es-ES')}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Hasta</div>
                        <div className="text-sm text-gray-400">{new Date(insurance.end_date).toLocaleDateString('es-ES')}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {myInsurances.length === 0 && (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tienes seguros contratados</h3>
              <p className="text-gray-400 mb-4">Explora nuestras opciones de seguros y protege lo que más te importa</p>
              <button
                onClick={() => setActiveTab('available')}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Ver Seguros Disponibles
              </button>
            </div>
          )}
        </div>
      )}

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
                Al contratar este seguro, aceptas los términos y condiciones. La póliza será efectiva inmediatamente después del pago y tendrá una vigencia de 1 año.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowContractModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmContract}
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
