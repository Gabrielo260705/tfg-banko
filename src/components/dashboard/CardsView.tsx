import { useEffect, useState } from 'react';
import { Plus, CreditCard, Eye, EyeOff } from 'lucide-react';
import { supabase, Card, Account } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const CardsView = () => {
  const { profile } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [visibleCVV, setVisibleCVV] = useState<string | null>(null);
  const [newCard, setNewCard] = useState({
    account_id: '',
    card_type: 'debit' as 'debit' | 'credit' | 'disposable',
    credit_limit: 1000,
  });

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile) return;

    try {
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', profile.id);

      if (accountsError) {
        console.error('Error loading accounts:', accountsError);
        return;
      }

      setAccounts(accountsData || []);

      if (accountsData && accountsData.length > 0) {
        const { data: cardsData, error: cardsError } = await supabase
          .from('cards')
          .select('*')
          .in('account_id', accountsData.map(a => a.id))
          .order('created_at', { ascending: false });

        if (cardsError) {
          console.error('Error loading cards:', cardsError);
        } else {
          setCards(cardsData || []);
        }
      }
    } catch (err) {
      console.error('Exception in loadData:', err);
    }
  };

  const createCard = async () => {
    if (!profile || !newCard.account_id) return;

    const cardNumber = `4${Math.random().toString().slice(2, 18)}`;
    const cvv = Math.floor(100 + Math.random() * 900).toString();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);

    const pointsMultiplier = newCard.card_type === 'credit' ? 2 : 1;

    const { error } = await supabase
      .from('cards')
      .insert({
        account_id: newCard.account_id,
        card_number: cardNumber,
        card_type: newCard.card_type,
        cvv,
        expiry_date: expiryDate.toISOString().split('T')[0],
        credit_limit: newCard.card_type === 'credit' ? newCard.credit_limit : null,
        current_debt: 0,
        points_multiplier: pointsMultiplier,
        is_active: true,
        expires_at: newCard.card_type === 'disposable' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
      });

    if (!error) {
      setShowCreateModal(false);
      loadData();
    }
  };

  const getCardTypeName = (type: string) => {
    const types: Record<string, string> = {
      debit: 'Débito',
      credit: 'Crédito',
      disposable: 'Desechable',
    };
    return types[type] || type;
  };

  const getCardColor = (type: string) => {
    const colors: Record<string, string> = {
      debit: 'from-blue-900 to-blue-800',
      credit: 'from-emerald-900 to-emerald-800',
      disposable: 'from-gray-800 to-gray-700',
    };
    return colors[type] || 'from-gray-900 to-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mis Tarjetas</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nueva Tarjeta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.id} className={`bg-gradient-to-br ${getCardColor(card.card_type)} border border-gray-700 rounded-xl p-6 shadow-lg`}>
            <div className="flex justify-between items-start mb-8">
              <CreditCard className="h-8 w-8 text-white/80" />
              <span className="px-2 py-1 bg-white/10 text-white text-xs font-medium rounded">
                {getCardTypeName(card.card_type)}
              </span>
            </div>
            <div className="text-xl font-mono tracking-wider mb-6 text-white">
              {card.card_number.match(/.{1,4}/g)?.join(' ')}
            </div>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-xs text-white/60 mb-1">Válida hasta</div>
                <div className="font-medium text-white">
                  {new Date(card.expiry_date).toLocaleDateString('es-ES', { month: '2-digit', year: '2-digit' })}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/60 mb-1">CVV</div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">
                    {visibleCVV === card.id ? card.cvv : '•••'}
                  </span>
                  <button
                    onClick={() => setVisibleCVV(visibleCVV === card.id ? null : card.id)}
                    className="text-white/60 hover:text-white"
                  >
                    {visibleCVV === card.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            {card.card_type === 'credit' && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-xs text-white/60">Límite de crédito</div>
                <div className="text-sm font-medium text-white">
                  €{Number(card.credit_limit).toFixed(2)}
                </div>
                <div className="text-xs text-white/60 mt-1">
                  Deuda actual: €{Number(card.current_debt).toFixed(2)}
                </div>
              </div>
            )}
            <div className="mt-2 text-xs text-white/60">
              Multiplicador de puntos: x{card.points_multiplier}
            </div>
          </div>
        ))}

        {cards.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No tienes tarjetas. Crea una para empezar.
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Crear Nueva Tarjeta</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cuenta Asociada
                </label>
                <select
                  value={newCard.account_id}
                  onChange={(e) => setNewCard({ ...newCard, account_id: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="">Seleccionar cuenta</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_number} ({acc.currency})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Tarjeta
                </label>
                <select
                  value={newCard.card_type}
                  onChange={(e) => setNewCard({ ...newCard, card_type: e.target.value as any })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="debit">Débito (x1 puntos)</option>
                  <option value="credit">Crédito (x2 puntos)</option>
                  <option value="disposable">Desechable (x1 puntos)</option>
                </select>
              </div>
              {newCard.card_type === 'credit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Límite de Crédito
                  </label>
                  <input
                    type="number"
                    value={newCard.credit_limit}
                    onChange={(e) => setNewCard({ ...newCard, credit_limit: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                    min="100"
                    step="100"
                  />
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={createCard}
                  disabled={!newCard.account_id}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Crear Tarjeta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
