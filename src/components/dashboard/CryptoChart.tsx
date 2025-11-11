import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';

interface CryptoChartProps {
  symbol: string;
  name: string;
  onClose: () => void;
}

export const CryptoChart = ({ symbol, name, onClose }: CryptoChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#111827' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: '#1F2937' },
        horzLines: { color: '#1F2937' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    const fetchChartData = async () => {
      try {
        setLoading(true);
        setError(null);

        const binanceSymbol = `${symbol}USDT`;
        const endTime = Date.now();
        const startTime = endTime - 7 * 24 * 60 * 60 * 1000;

        const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=1h&startTime=${startTime}&endTime=${endTime}&limit=168`;

        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.msg || 'Error al obtener datos del gráfico');
        }

        const data = await response.json();

        if (!data || data.length === 0) {
          throw new Error('No hay datos disponibles para este símbolo');
        }

        const formattedData = data.map((d: any) => ({
          time: d[0] / 1000,
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
        }));

        candlestickSeries.setData(formattedData);
        chart.timeScale().fitContent();
        setLoading(false);
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setError(error instanceof Error ? error.message : 'Error desconocido');
        setLoading(false);
      }
    };

    fetchChartData();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-5xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-2xl font-bold">{name} ({symbol})</h3>
            <p className="text-sm text-gray-400">Últimos 7 días - Gráfico de velas (1h)</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-gray-400">Cargando datos del gráfico...</div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <p className="text-red-400 mb-2">Error al cargar el gráfico</p>
              <p className="text-sm text-gray-500">{error}</p>
              <p className="text-xs text-gray-600 mt-2">
                Este símbolo puede no estar disponible en Binance
              </p>
            </div>
          </div>
        )}

        <div ref={chartContainerRef} className={`w-full ${(loading || error) ? 'hidden' : ''}`} />
      </div>
    </div>
  );
};
