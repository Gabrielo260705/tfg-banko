import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { supabase, Loan } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const ApproveLoansView = () => {
  const { profile } = useAuth();
  const [pendingLoans, setPendingLoans] = useState<Loan[]>([]);

  useEffect(() => {
    loadPendingLoans();
  }, []);

  const loadPendingLoans = async () => {
    const { data } = await supabase
      .from('loans')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    setPendingLoans(data || []);
  };

  const approveLoan = async (loanId: string) => {
    if (!profile) return;

    const { error } = await supabase
      .from('loans')
      .update({
        status: 'approved',
        approved_by: profile.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', loanId);

    if (!error) {
      loadPendingLoans();
    }
  };

  const rejectLoan = async (loanId: string) => {
    const { error } = await supabase
      .from('loans')
      .update({ status: 'defaulted' })
      .eq('id', loanId);

    if (!error) {
      loadPendingLoans();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Aprobar Préstamos</h2>

      <div className="space-y-4">
        {pendingLoans.map((loan) => (
          <div key={loan.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="grid md:grid-cols-5 gap-4 items-center">
              <div>
                <div className="text-sm text-gray-400">Tipo</div>
                <div className="font-semibold">
                  {loan.loan_type === 'mortgage' ? 'Hipoteca' : 'Personal'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Cantidad</div>
                <div className="font-semibold">€{Number(loan.amount).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Plazo</div>
                <div className="font-semibold">{loan.term_months} meses</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Interés</div>
                <div className="font-semibold">{loan.interest_rate}%</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => approveLoan(loan.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  Aprobar
                </button>
                <button
                  onClick={() => rejectLoan(loan.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  Rechazar
                </button>
              </div>
            </div>
          </div>
        ))}

        {pendingLoans.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No hay préstamos pendientes de aprobación
          </div>
        )}
      </div>
    </div>
  );
};
