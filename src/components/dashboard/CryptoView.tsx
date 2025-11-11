import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { CryptoChart } from './CryptoChart';

interface Crypto {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

export const CryptoView = () => {
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<Crypto | null>(null);

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

  useEffect(() => {
    fetchCryptoPrices();
    const interval = setInterval(fetchCryptoPrices, 30000);
    return () => clearInterval(interval);
  }, []);

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
              <button
                onClick={() => setSelectedCrypto(crypto)}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
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
            Datos en tiempo real de TradingView API. Precios actualizados cada 30 segundos.
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
    </div>
  );
};
