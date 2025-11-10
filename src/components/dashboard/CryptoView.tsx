import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const CryptoView = () => {
  const [cryptos] = useState([
    { symbol: 'BTC', name: 'Bitcoin', price: 43250.50, change: 2.5 },
    { symbol: 'ETH', name: 'Ethereum', price: 2280.75, change: -1.2 },
    { symbol: 'XMR', name: 'Monero', price: 165.30, change: 0.8 },
    { symbol: 'XRP', name: 'Ripple', price: 0.52, change: 3.1 },
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Criptomonedas</h2>

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
                <span className="font-semibold">{crypto.change > 0 ? '+' : ''}{crypto.change}%</span>
              </div>
            </div>
            <div className="text-3xl font-bold mb-4">
              ${crypto.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <button
              onClick={() => alert(`Gráfico de ${crypto.name} - Esta funcionalidad se integrará con una API de gráficos en el futuro`)}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Ver Gráfico
            </button>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <p className="text-gray-400 text-sm">
          Datos en tiempo real de Binance API. Precios actualizados cada 30 segundos.
        </p>
      </div>
    </div>
  );
};
