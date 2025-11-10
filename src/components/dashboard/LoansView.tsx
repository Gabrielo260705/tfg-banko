import { useEffect, useState } from 'react';
import { Plus, DollarSign, AlertCircle } from 'lucide-react';
import { supabase, Loan } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const LoansView = () => {
  const { profile } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [newLoan, setNewLoan] = useState({
    loan_type: 'personal' as 'personal' | 'mortgage',
    amount: 10000,
    interest_rate: 5.5,
    term_months: 12,
  });

  useEffect(() => {
    loadLoans();
  }, [profile]);

  const loadLoans = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading loans:', error);
      } else {
        setLoans(data || []);
      }
    } catch (err) {
      console.error('Exception loading loans:', err);
    }
  };

  const calculateMonthlyPayment = (principal: number, annualRate: number, months: number) => {
    const monthlyRate = annualRate / 100 / 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  };

  const requestLoan = async () => {
    if (!profile) return;

    const monthlyPayment = calculateMonthlyPayment(newLoan.amount, newLoan.interest_rate, newLoan.term_months);

    const { error } = await supabase
      .from('loans')
      .insert({
        user_id: profile.id,
        loan_type: newLoan.loan_type,
        amount: newLoan.amount,
        interest_rate: newLoan.interest_rate,
        term_months: newLoan.term_months,
        monthly_payment: monthlyPayment,
        remaining_balance: newLoan.amount,
        status: 'pending',
      });

    if (!error) {
      setShowRequestModal(false);
      loadLoans();
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-600/20 text-yellow-500 border-yellow-600',
      approved: 'bg-blue-600/20 text-blue-500 border-blue-600',
      active: 'bg-emerald-600/20 text-emerald-500 border-emerald-600',
      paid: 'bg-gray-600/20 text-gray-500 border-gray-600',
      defaulted: 'bg-red-600/20 text-red-500 border-red-600',
    };
    return colors[status] || '';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: 'Pendiente',
      approved: 'Aprobado',
      active: 'Activo',
      paid: 'Pagado',
      defaulted: 'Impago',
    };
    return texts[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Préstamos</h2>
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Solicitar Préstamo
        </button>
      </div>

      <div className="grid gap-6">
        {loans.map((loan) => (
          <div key={loan.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-600/20 rounded-lg">
                  <DollarSign className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {loan.loan_type === 'mortgage' ? 'Hipoteca' : 'Préstamo Personal'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Solicitado el {new Date(loan.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 text-xs font-medium rounded border ${getStatusColor(loan.status)}`}>
                {getStatusText(loan.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-400">Cantidad</div>
                <div className="text-lg font-semibold">€{Number(loan.amount).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Interés</div>
                <div className="text-lg font-semibold">{loan.interest_rate}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Plazo</div>
                <div className="text-lg font-semibold">{loan.term_months} meses</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Pago Mensual</div>
                <div className="text-lg font-semibold">€{Number(loan.monthly_payment).toFixed(2)}</div>
              </div>
            </div>

            {(loan.status === 'active' || loan.status === 'approved') && (
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Saldo Pendiente</span>
                  <span className="text-lg font-semibold">€{Number(loan.remaining_balance).toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full"
                    style={{
                      width: `${((Number(loan.amount) - Number(loan.remaining_balance)) / Number(loan.amount)) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}

            {loan.status === 'defaulted' && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-2 text-red-400">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">Este préstamo tiene pagos pendientes. Contacte con atención al cliente.</span>
              </div>
            )}
          </div>
        ))}

        {loans.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No tienes préstamos. Solicita uno para empezar.
          </div>
        )}
      </div>

      {showRequestModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Solicitar Préstamo</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Préstamo
                </label>
                <select
                  value={newLoan.loan_type}
                  onChange={(e) => setNewLoan({ ...newLoan, loan_type: e.target.value as any })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="personal">Préstamo Personal</option>
                  <option value="mortgage">Hipoteca</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cantidad (€)
                </label>
                <input
                  type="number"
                  value={newLoan.amount}
                  onChange={(e) => setNewLoan({ ...newLoan, amount: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                  min="1000"
                  step="1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Plazo (meses)
                </label>
                <input
                  type="number"
                  value={newLoan.term_months}
                  onChange={(e) => setNewLoan({ ...newLoan, term_months: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                  min="6"
                  max="360"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tasa de Interés (%)
                </label>
                <input
                  type="number"
                  value={newLoan.interest_rate}
                  onChange={(e) => setNewLoan({ ...newLoan, interest_rate: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                  min="0"
                  max="20"
                  step="0.1"
                />
              </div>
              <div className="p-4 bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Pago Mensual Estimado</div>
                <div className="text-2xl font-bold text-emerald-500">
                  €{calculateMonthlyPayment(newLoan.amount, newLoan.interest_rate, newLoan.term_months).toFixed(2)}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={requestLoan}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Solicitar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
