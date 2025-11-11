import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const STOCK_TICKERS = ['AAPL', 'MSFT', 'AMZN', 'TSLA', 'NVDA'];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stockData = await Promise.all(
      STOCK_TICKERS.map(async (ticker) => {
        try {
          const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1y&interval=1d`,
            {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch ${ticker}`);
          }

          const data = await response.json();
          const result = data.chart.result[0];
          const meta = result.meta;
          const timestamps = result.timestamp;
          const quotes = result.indicators.quote[0];

          const currentPrice = meta.regularMarketPrice;
          const previousClose = meta.chartPreviousClose;
          const change = ((currentPrice - previousClose) / previousClose) * 100;

          const oneYearAgo = timestamps[0];
          const oneYearAgoPrice = quotes.close[0];
          const yearChange = ((currentPrice - oneYearAgoPrice) / oneYearAgoPrice) * 100;

          const historicalData = timestamps.map((timestamp: number, index: number) => ({
            date: new Date(timestamp * 1000).toISOString().split('T')[0],
            price: quotes.close[index] || 0,
          })).filter((item: any) => item.price > 0);

          return {
            ticker,
            name: meta.longName || ticker,
            price: currentPrice,
            change: change,
            yearChange: yearChange,
            currency: meta.currency,
            historicalData: historicalData,
          };
        } catch (error) {
          console.error(`Error fetching ${ticker}:`, error);
          return {
            ticker,
            name: ticker,
            price: 0,
            change: 0,
            yearChange: 0,
            currency: 'USD',
            historicalData: [],
            error: error.message,
          };
        }
      })
    );

    return new Response(
      JSON.stringify({ stocks: stockData }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});