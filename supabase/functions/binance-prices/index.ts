import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BinanceTickerResponse {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  lastPrice: string;
}

interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

const CRYPTO_MAPPING: Record<string, string> = {
  'BTC': 'BTCUSDT',
  'ETH': 'ETHUSDT',
  'XMR': 'XMRUSDT',
  'XRP': 'XRPUSDT',
};

const CRYPTO_NAMES: Record<string, string> = {
  'BTC': 'Bitcoin',
  'ETH': 'Ethereum',
  'XMR': 'Monero',
  'XRP': 'Ripple',
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const symbols = Object.values(CRYPTO_MAPPING);
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(symbols)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    const data: BinanceTickerResponse[] = await response.json();
    
    const cryptos: CryptoData[] = Object.entries(CRYPTO_MAPPING).map(([symbol, binanceSymbol]) => {
      const ticker = data.find(t => t.symbol === binanceSymbol);
      
      return {
        symbol,
        name: CRYPTO_NAMES[symbol],
        price: ticker ? parseFloat(ticker.lastPrice) : 0,
        change: ticker ? parseFloat(ticker.priceChangePercent) : 0,
      };
    });
    
    return new Response(
      JSON.stringify({ cryptos }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error('Error fetching Binance prices:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch crypto prices',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});