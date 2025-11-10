import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { supabase, Loan } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface LoanWithUser extends Loan {
  user_account_id?: string;
}

export const ApproveLoansView = () => {
  const { profile } = useAuth();
  const [pendingLoans, setPendingLoans] = useState<LoanWithUser[]>([]);

  useEffect(() => {
    loadPendingLoans();
  }, []);

  const loadPendingLoans = async () => {
    const { data: loans } = await supabase
      .from('loans')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (!loans) {
      setPendingLoans([]);
      return;
    }

    const loansWithAccounts = await Promise.all(
      loans.map(async (loan) => {
        const { data: accounts } = await supabase
          .from('accounts')
          .select('id')
          .eq('user_id', loan.user_id)
          .limit(1);

        return {
          ...loan,
          user_account_id: accounts?.[0]?.id,
        };
      })
    );

    setPendingLoans(loansWithAccounts);
  };

  const approveLoan = async (loanId: string) => {
    if (!profile) return;

    const loan = pendingLoans.find(l => l.id === loanId);
    if (!loan || !loan.user_account_id) {
      alert('No se encontr\u00f3 la cuenta del usuario');
      return;
    }

    const { data: userAccount } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', loan.user_account_id)
      .maybeSingle();

    if (!userAccount) {
      alert('No se encontr\u00f3 la cuenta del usuario');
      return;
    }

    const { data: bankAccount } = await supabase
      .from('accounts')
      .select('*')
      .eq('account_number', 'BANKO-SYSTEM-ACCOUNT-001')
      .maybeSingle();

    if (!bankAccount) {
      alert('No se encontr\u00f3 la cuenta del banco');
      return;
    }

    if (Number(bankAccount.balance) < Number(loan.amount)) {
      alert('El banco no tiene fondos suficientes para aprobar este pr\u00e9stamo');
      return;
    }

    const newUserBalance = Number(userAccount.balance) + Number(loan.amount);
    const newBankBalance = Number(bankAccount.balance) - Number(loan.amount);

    const { error: userAccountError } = await supabase
      .from('accounts')
      .update({ balance: newUserBalance })
      .eq('id', userAccount.id);

    if (userAccountError) {
      alert('Error al actualizar la cuenta del usuario');
      return;
    }

    const { error: bankAccountError } = await supabase
      .from('accounts')
      .update({ balance: newBankBalance })
      .eq('id', bankAccount.id);

    if (bankAccountError) {
      alert('Error al actualizar la cuenta del banco');
      return;
    }

    const { error } = await supabase
      .from('loans')
      .update({
        status: 'active',
        approved_by: profile.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', loanId);

    if (!error) {
      await supabase.from('transactions').insert([
        {
          account_id: userAccount.id,
          transaction_type: 'deposit',
          amount: Number(loan.amount),
          currency: userAccount.currency,
          description: `Pr\u00e9stamo ${loan.loan_type === 'mortgage' ? 'hipotecario' : 'personal'} aprobado`,
          recipient_account: bankAccount.account_number,
          is_suspicious: false,
        },
        {
          account_id: bankAccount.id,
          transaction_type: 'payment',
          amount: -Number(loan.amount),
          currency: 'EUR',
          description: `Pr\u00e9stamo otorgado - ${loan.loan_type} - A: ${userAccount.account_number}`,
          recipient_account: userAccount.account_number,
          is_suspicious: false,
        }
      ]);

      loadPendingLoans();
      alert('Pr\u00e9stamo aprobado y dinero depositado');
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
