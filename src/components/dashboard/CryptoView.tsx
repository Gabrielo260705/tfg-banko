import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Wallet, ShoppingCart, DollarSign } from 'lucide-react';
import { CryptoChart } from './CryptoChart';
import { supabase, CryptoWallet, Account } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Crypto {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

export const CryptoView = () => {
  const { profile } = useAuth();
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<Crypto | null>(null);
  const [wallet, setWallet] = useState<CryptoWallet[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedForTrade, setSelectedForTrade] = useState<Crypto | null>(null);
  const [tradeAmount, setTradeAmount] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  const fetchCryptoPrices = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/binance-prices`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, { headers });

      if (!response.ok) {
        throw new Error('Failed to fetch crypto prices');
      }

      const data = await response.json();
      setCryptos(data.cryptos);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching crypto prices:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadWallet = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('crypto_wallets')
      .select('*')
      .eq('user_id', profile.id);

    setWallet(data || []);
  };

  const loadAccounts = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', profile.id);

    setAccounts(data || []);
  };

  const buyCrypto = async () => {
    if (!profile || !selectedForTrade || !selectedAccountId || tradeAmount <= 0) return;

    const account = accounts.find(acc => acc.id === selectedAccountId);
    if (!account) return;

    const totalCost = tradeAmount * selectedForTrade.price;

    if (Number(account.balance) < totalCost) {
      alert('Saldo insuficiente');
      return;
    }

    const newBalance = Number(account.balance) - totalCost;

    const { error: accountError } = await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', selectedAccountId);

    if (accountError) {
      alert('Error al actualizar la cuenta');
      return;
    }

    const existingWallet = wallet.find(w => w.symbol === selectedForTrade.symbol);

    if (existingWallet) {
      const newTotalAmount = Number(existingWallet.amount) + tradeAmount;
      const newAveragePrice = ((Number(existingWallet.amount) * Number(existingWallet.average_buy_price)) + (tradeAmount * selectedForTrade.price)) / newTotalAmount;

      await supabase
        .from('crypto_wallets')
        .update({
          amount: newTotalAmount,
          average_buy_price: newAveragePrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingWallet.id);
    } else {
      await supabase
        .from('crypto_wallets')
        .insert({
          user_id: profile.id,
          symbol: selectedForTrade.symbol,
          name: selectedForTrade.name,
          amount: tradeAmount,
          average_buy_price: selectedForTrade.price
        });
    }

    await supabase.from('transactions').insert({
      account_id: selectedAccountId,
      transaction_type: 'payment',
      amount: -totalCost,
      currency: account.currency,
      description: `Compra de ${tradeAmount} ${selectedForTrade.symbol} a $${selectedForTrade.price.toFixed(2)}`,
      is_suspicious: false,
    });

    setShowBuyModal(false);
    setTradeAmount(0);
    setSelectedAccountId('');
    setSelectedForTrade(null);
    loadWallet();
    loadAccounts();
  };

  const sellCrypto = async () => {
    if (!profile || !selectedForTrade || !selectedAccountId || tradeAmount <= 0) return;

    const walletEntry = wallet.find(w => w.symbol === selectedForTrade.symbol);
    if (!walletEntry || Number(walletEntry.amount) < tradeAmount) {
      alert('No tienes suficiente criptomoneda');
      return;
    }

    const account = accounts.find(acc => acc.id === selectedAccountId);
    if (!account) return;

    const totalValue = tradeAmount * selectedForTrade.price;
    const newBalance = Number(account.balance) + totalValue;

    const { error: accountError } = await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', selectedAccountId);

    if (accountError) {
      alert('Error al actualizar la cuenta');
      return;
    }

    const newAmount = Number(walletEntry.amount) - tradeAmount;

    if (newAmount <= 0) {
      await supabase
        .from('crypto_wallets')
        .delete()
        .eq('id', walletEntry.id);
    } else {
      await supabase
        .from('crypto_wallets')
        .update({
          amount: newAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', walletEntry.id);
    }

    await supabase.from('transactions').insert({
      account_id: selectedAccountId,
      transaction_type: 'deposit',
      amount: totalValue,
      currency: account.currency,
      description: `Venta de ${tradeAmount} ${selectedForTrade.symbol} a $${selectedForTrade.price.toFixed(2)}`,
      is_suspicious: false,
    });

    setShowSellModal(false);
    setTradeAmount(0);
    setSelectedAccountId('');
    setSelectedForTrade(null);
    loadWallet();
    loadAccounts();
  };

  useEffect(() => {
    fetchCryptoPrices();
    loadWallet();
    loadAccounts();
    const interval = setInterval(fetchCryptoPrices, 30000);
    return () => clearInterval(interval);
  }, [profile]);

  const getWalletValue = () => {
    return wallet.reduce((total, w) => {
      const crypto = cryptos.find(c => c.symbol === w.symbol);
      if (crypto) {
        return total + (Number(w.amount) * crypto.price);
      }
      return total;
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Criptomonedas</h2>
        <button
          onClick={fetchCryptoPrices}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {wallet.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-700/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="h-6 w-6 text-emerald-400" />
            <h3 className="text-xl font-bold">Mi Wallet de Criptomonedas</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {wallet.map((w) => {
              const crypto = cryptos.find(c => c.symbol === w.symbol);
              const currentValue = crypto ? Number(w.amount) * crypto.price : 0;
              const totalInvested = Number(w.amount) * Number(w.average_buy_price);
              const profit = currentValue - totalInvested;
              const profitPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

              return (
                <div key={w.id} className="bg-gray-900/60 border border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{w.symbol}</h4>
                      <p className="text-sm text-gray-400">{w.name}</p>
                    </div>
                    {crypto && (
                      <div className={`text-sm font-semibold ${profitPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Cantidad:</span>
                      <span className="font-semibold">{Number(w.amount).toFixed(8)} {w.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Precio Promedio:</span>
                      <span className="font-semibold">${Number(w.average_buy_price).toFixed(2)}</span>
                    </div>
                    {crypto && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Precio Actual:</span>
                          <span className="font-semibold">${crypto.price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-700 pt-1 mt-1">
                          <span className="text-gray-400">Valor Total:</span>
                          <span className="font-bold text-emerald-400">${currentValue.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-emerald-700/50">
            <span className="text-lg font-semibold text-gray-300">Valor Total del Portafolio:</span>
            <span className="text-2xl font-bold text-emerald-400">${getWalletValue().toFixed(2)}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
          <p className="text-red-400">Error: {error}</p>
        </div>
      )}

      {loading && cryptos.length === 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse">
              <div className="h-20 bg-gray-800 rounded mb-4"></div>
              <div className="h-10 bg-gray-800 rounded mb-4"></div>
              <div className="h-10 bg-gray-800 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {cryptos.map((crypto) => (
            <div key={crypto.symbol} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{crypto.symbol}</h3>
                  <p className="text-sm text-gray-400">{crypto.name}</p>
                </div>
                <div className={`flex items-center gap-1 ${crypto.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {crypto.change >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  <span className="font-semibold">{crypto.change > 0 ? '+' : ''}{crypto.change.toFixed(2)}%</span>
                </div>
              </div>
              <div className="text-3xl font-bold mb-4">
                ${crypto.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedForTrade(crypto);
                    setShowBuyModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Comprar
                </button>
                {wallet.find(w => w.symbol === crypto.symbol) && (
                  <button
                    onClick={() => {
                      setSelectedForTrade(crypto);
                      setShowSellModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <DollarSign className="h-4 w-4" />
                    Vender
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedCrypto(crypto)}
                className="w-full mt-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                Ver Gráfico
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex justify-between items-center">
          <p className="text-gray-400 text-sm">
            Datos en tiempo real de Binance API. Precios actualizados cada 30 segundos.
          </p>
          {lastUpdate && (
            <p className="text-gray-500 text-xs">
              Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
            </p>
          )}
        </div>
      </div>

      {selectedCrypto && (
        <CryptoChart
          symbol={selectedCrypto.symbol}
          name={selectedCrypto.name}
          onClose={() => setSelectedCrypto(null)}
        />
      )}

      {showBuyModal && selectedForTrade && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Comprar {selectedForTrade.symbol}</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Precio Actual:</span>
                  <span className="font-bold text-emerald-500">${selectedForTrade.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cambio 24h:</span>
                  <span className={selectedForTrade.change >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                    {selectedForTrade.change > 0 ? '+' : ''}{selectedForTrade.change.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cuenta de Pago
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                  required
                >
                  <option value="">Selecciona una cuenta</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_number} - {acc.currency} {Number(acc.balance).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cantidad de {selectedForTrade.symbol}
                </label>
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                  min="0.00000001"
                  step="0.00000001"
                  placeholder="0.00000000"
                />
              </div>
              {tradeAmount > 0 && (
                <div className="p-4 bg-emerald-900/20 border border-emerald-800 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total a Pagar:</span>
                    <span className="font-bold text-emerald-400">
                      ${(tradeAmount * selectedForTrade.price).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowBuyModal(false);
                    setTradeAmount(0);
                    setSelectedAccountId('');
                    setSelectedForTrade(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={buyCrypto}
                  disabled={!selectedAccountId || tradeAmount <= 0}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Comprar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSellModal && selectedForTrade && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Vender {selectedForTrade.symbol}</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Precio Actual:</span>
                  <span className="font-bold text-emerald-500">${selectedForTrade.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Disponible:</span>
                  <span className="font-semibold">
                    {(wallet.find(w => w.symbol === selectedForTrade.symbol)?.amount || 0).toFixed(8)} {selectedForTrade.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cambio 24h:</span>
                  <span className={selectedForTrade.change >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                    {selectedForTrade.change > 0 ? '+' : ''}{selectedForTrade.change.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cuenta de Destino
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                  required
                >
                  <option value="">Selecciona una cuenta</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_number} - {acc.currency} {Number(acc.balance).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cantidad de {selectedForTrade.symbol}
                </label>
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-600"
                  min="0.00000001"
                  step="0.00000001"
                  max={wallet.find(w => w.symbol === selectedForTrade.symbol)?.amount || 0}
                  placeholder="0.00000000"
                />
              </div>
              {tradeAmount > 0 && (
                <div className="p-4 bg-emerald-900/20 border border-emerald-800 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total a Recibir:</span>
                    <span className="font-bold text-emerald-400">
                      ${(tradeAmount * selectedForTrade.price).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowSellModal(false);
                    setTradeAmount(0);
                    setSelectedAccountId('');
                    setSelectedForTrade(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={sellCrypto}
                  disabled={!selectedAccountId || tradeAmount <= 0}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Vender
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
