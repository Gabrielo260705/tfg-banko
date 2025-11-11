import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

const CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin', tvSymbol: 'BTCUSD' },
  { symbol: 'ETH', name: 'Ethereum', tvSymbol: 'ETHUSD' },
  { symbol: 'SOL', name: 'Solana', tvSymbol: 'SOLUSD' },
  { symbol: 'XRP', name: 'Ripple', tvSymbol: 'XRPUSD' },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const cryptos: CryptoData[] = await Promise.all(
      CRYPTOS.map(async (crypto) => {
        try {
          const url = `https://api.tvapi.io/v1/quotes?symbols=${crypto.tvSymbol}`;

          const response = await fetch(url);

          if (!response.ok) {
            console.error(`TradingView API error for ${crypto.symbol}: ${response.status}`);
            return {
              symbol: crypto.symbol,
              name: crypto.name,
              price: 0,
              change: 0,
            };
          }

          const data = await response.json();
          const quote = data[0];

          return {
            symbol: crypto.symbol,
            name: crypto.name,
            price: quote?.lp || 0,
            change: quote?.chp || 0,
          };
        } catch (error) {
          console.error(`Error fetching ${crypto.symbol}:`, error);
          return {
            symbol: crypto.symbol,
            name: crypto.name,
            price: 0,
            change: 0,
          };
        }
      })
    );

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
    console.error('Error fetching TradingView prices:', error);

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