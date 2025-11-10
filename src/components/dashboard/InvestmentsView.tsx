import { useEffect, useState } from 'react';
import { TrendingUp, Plus } from 'lucide-react';
import { supabase, Investment } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const InvestmentsView = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'simulator'>('portfolio');
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInvestment, setNewInvestment] = useState({
    investment_type: 'stocks' as 'stocks' | 'funds' | 'savings_account',
    name: '',
    amount_invested: 1000,
    interest_rate: 5,
  });

  const [simulator, setSimulator] = useState({
    principal: 10000,
    rate: 5,
    years: 10,
    result: 0,
  });

  useEffect(() => {
    loadInvestments();
  }, [profile]);

  const loadInvestments = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', profile.id)
      .order('purchase_date', { ascending: false });

    setInvestments(data || []);
  };

  const createInvestment = async () => {
    if (!profile || !newInvestment.name) return;

    const { error } = await supabase
      .from('investments')
      .insert({
        user_id: profile.id,
        investment_type: newInvestment.investment_type,
        name: newInvestment.name,
        amount_invested: newInvestment.amount_invested,
        current_value: newInvestment.amount_invested,
        interest_rate: newInvestment.interest_rate,
      });

    if (!error) {
      setShowCreateModal(false);
      setNewInvestment({
        investment_type: 'stocks',
        name: '',
        amount_invested: 1000,
        interest_rate: 5,
      });
      loadInvestments();
    }
  };

  const calculateCompoundInterest = () => {
    const { principal, rate, years } = simulator;
    const result = principal * Math.pow(1 + rate / 100, years);
    setSimulator({ ...simulator, result });
  };

  useEffect(() => {
    calculateCompoundInterest();
  }, [simulator.principal, simulator.rate, simulator.years]);

  const getInvestmentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      stocks: 'Acciones',
      funds: 'Fondos',
      savings_account: 'Cuenta de Ahorro',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Inversiones</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nueva Inversión
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'portfolio' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400'
          }`}
        >
          Mi Cartera
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'simulator' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400'
          }`}
        >
          Simulador de Inversión
        </button>
      </div>

      {activeTab === 'portfolio' ? (
        <div className="space-y-4">
          {investments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No tienes inversiones activas. Comienza a invertir ahora.
            </div>
          ) : (
            investments.map((inv) => (
              <div key={inv.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{inv.name}</h3>
                    <p className="text-sm text-gray-400">{getInvestmentTypeLabel(inv.investment_type)}</p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <div className="text-sm text-gray-400">Inversión Inicial</div>
                    <div className="text-lg font-semibold">€{Number(inv.amount_invested).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Valor Actual</div>
                    <div className="text-lg font-semibold text-emerald-500">€{Number(inv.current_value).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Rentabilidad</div>
                    <div className={`text-lg font-semibold ${
                      Number(inv.current_value) >= Number(inv.amount_invested) ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {(((Number(inv.current_value) - Number(inv.amount_invested)) / Number(inv.amount_invested)) * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Simulador de Interés Compuesto</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Inversión Inicial (€)
                </label>
                <input
                  type="number"
                  value={simulator.principal}
                  onChange={(e) => setSimulator({ ...simulator, principal: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                  min="100"
                  step="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tasa de Interés Anual (%)
                </label>
                <input
                  type="number"
                  value={simulator.rate}
                  onChange={(e) => setSimulator({ ...simulator, rate: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                  min="0"
                  max="50"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Años
                </label>
                <input
                  type="number"
                  value={simulator.years}
                  onChange={(e) => setSimulator({ ...simulator, years: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                  min="1"
                  max="50"
                />
              </div>
            </div>
            <div className="flex flex-col justify-center items-center bg-gray-800 rounded-lg p-6">
              <TrendingUp className="h-16 w-16 text-emerald-500 mb-4" />
              <div className="text-sm text-gray-400 mb-2">Valor Final Estimado</div>
              <div className="text-4xl font-bold text-emerald-500 mb-4">
                €{simulator.result.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-gray-400">
                Ganancia: €{(simulator.result - simulator.principal).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-emerald-500 mt-1">
                +{(((simulator.result - simulator.principal) / simulator.principal) * 100).toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Nueva Inversión</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Inversión
                </label>
                <select
                  value={newInvestment.investment_type}
                  onChange={(e) => setNewInvestment({ ...newInvestment, investment_type: e.target.value as any })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="stocks">Acciones</option>
                  <option value="funds">Fondos</option>
                  <option value="savings_account">Cuenta de Ahorro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newInvestment.name}
                  onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                  placeholder="Ej: Apple Inc, Fondo Indexado S&P500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cantidad a Invertir (€)
                </label>
                <input
                  type="number"
                  value={newInvestment.amount_invested}
                  onChange={(e) => setNewInvestment({ ...newInvestment, amount_invested: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                  min="100"
                  step="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tasa de Interés Esperada (%)
                </label>
                <input
                  type="number"
                  value={newInvestment.interest_rate}
                  onChange={(e) => setNewInvestment({ ...newInvestment, interest_rate: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                  min="0"
                  max="50"
                  step="0.1"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={createInvestment}
                  disabled={!newInvestment.name}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Invertir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
