export const ASSETS = {
  Forex: {
    label: 'Forex', icon: 'FX', operationType: 'par cambial',
    items: [
      { symbol: 'FX:EURUSD',  label: 'EUR/USD', nameKey: 'EUR/USD', name: 'Euro / Dollar',         price: '1,0847', change: '+0,12%', pos: true  },
      { symbol: 'FX:GBPUSD',  label: 'GBP/USD', nameKey: 'GBP/USD', name: 'Pound / Dollar',        price: '1,2634', change: '+0,08%', pos: true  },
      { symbol: 'FX:USDJPY',  label: 'USD/JPY', nameKey: 'USD/JPY', name: 'Dollar / Yen',         price: '149,82', change: '-0,21%', pos: false },
      { symbol: 'FX:AUDUSD',  label: 'AUD/USD', name: 'Aussie / USD',     price: '0,6512', change: '+0,05%', pos: true  },
      { symbol: 'FX:USDCHF',  label: 'USD/CHF', name: 'Dólar / Franco Suíço', price: '0,8974', change: '-0,09%', pos: false },
      { symbol: 'FX:EURGBP',  label: 'EUR/GBP', nameKey: 'EUR/GBP', name: 'Euro / Pound',         price: '0,8585', change: '+0,03%', pos: true  },
      { symbol: 'FX:USDCAD',  label: 'USD/CAD', name: 'Dólar / Dólar Can.',   price: '1,3621', change: '-0,14%', pos: false },
      { symbol: 'FX:NZDUSD',  label: 'NZD/USD', name: 'Dólar NZ / USD',       price: '0,5987', change: '+0,07%', pos: true  },
    ],
  },
  Cripto: {
    label: 'Cripto', icon: 'BTC', operationType: 'criptomoeda',
    items: [
      { symbol: 'BINANCE:BTCUSDT',  label: 'BTC/USDT',  name: 'Bitcoin',      price: '95.420', change: '+2,34%', pos: true  },
      { symbol: 'BINANCE:ETHUSDT',  label: 'ETH/USDT',  name: 'Ethereum',     price: '3.285',  change: '+1,82%', pos: true  },
      { symbol: 'BINANCE:SOLUSDT',  label: 'SOL/USDT',  name: 'Solana',       price: '187,40', change: '+3,12%', pos: true  },
      { symbol: 'BINANCE:BNBUSDT',  label: 'BNB/USDT',  name: 'Binance Coin', price: '412,50', change: '-0,45%', pos: false },
      { symbol: 'BINANCE:XRPUSDT',  label: 'XRP/USDT',  name: 'Ripple',       price: '0,5821', change: '+1,23%', pos: true  },
      { symbol: 'BINANCE:ADAUSDT',  label: 'ADA/USDT',  name: 'Cardano',      price: '0,4512', change: '-1,02%', pos: false },
      { symbol: 'BINANCE:DOGEUSDT', label: 'DOGE/USDT', name: 'Dogecoin',     price: '0,1234', change: '+4,56%', pos: true  },
      { symbol: 'BINANCE:AVAXUSDT', label: 'AVAX/USDT', name: 'Avalanche',    price: '38,72',  change: '+2,11%', pos: true  },
    ],
  },
  Stocks: {
    label: 'Stocks', icon: 'ACT', operationType: 'stock',
    items: [
      { symbol: 'NASDAQ:AAPL',  label: 'AAPL',  name: 'Apple Inc.',       price: '189,30', change: '+0,54%', pos: true  },
      { symbol: 'NASDAQ:TSLA',  label: 'TSLA',  name: 'Tesla Inc.',       price: '245,80', change: '-1,23%', pos: false },
      { symbol: 'NASDAQ:GOOGL', label: 'GOOGL', name: 'Alphabet Inc.',    price: '175,40', change: '+0,87%', pos: true  },
      { symbol: 'NASDAQ:AMZN',  label: 'AMZN',  name: 'Amazon.com',      price: '198,60', change: '+1,12%', pos: true  },
      { symbol: 'NASDAQ:MSFT',  label: 'MSFT',  name: 'Microsoft Corp.', price: '415,20', change: '+0,33%', pos: true  },
      { symbol: 'NASDAQ:META',  label: 'META',  name: 'Meta Platforms',  price: '512,40', change: '+1,67%', pos: true  },
      { symbol: 'NASDAQ:NVDA',  label: 'NVDA',  name: 'NVIDIA Corp.',    price: '875,30', change: '+3,21%', pos: true  },
      { symbol: 'NYSE:JPM',     label: 'JPM',   name: 'JPMorgan Chase',  price: '198,70', change: '-0,42%', pos: false },
    ],
  },
  Metals: {
    label: 'Metals', icon: 'XAU', operationType: 'precious metal',
    items: [
      { symbol: 'OANDA:XAUUSD',  label: 'Ouro',    nameKey: 'GOLD', name: 'Gold',    price: '2.032,40', change: '+0,38%', pos: true  },
      { symbol: 'OANDA:XAGUSD',  label: 'Prata',   nameKey: 'SILVER', name: 'Silver',   price: '22,85',    change: '-0,21%', pos: false },
      { symbol: 'TVC:PLATINUM',  label: 'Platinum', name: 'Platinum', price: '891,40',   change: '+0,62%', pos: true  },
      { symbol: 'TVC:PALLADIUM', label: 'Palladium', name: 'Palladium', price: '952,30',   change: '-1,14%', pos: false },
      { symbol: 'COMEX:HG1!',    label: 'Cobre',   name: 'Cobre',   price: '3,842',    change: '+0,29%', pos: true  },
    ],
  },
  Commodities: {
    label: 'Commodities', icon: 'OIL', operationType: 'matéria-prima',
    items: [
      { symbol: 'NYMEX:CL1!', label: 'WTI Crude', name: 'WTI Crude Oil',   price: '78,42',    change: '-0,85%', pos: false },
      { symbol: 'ICE:BRN1!',  label: 'Brent',        name: 'Petróleo Brent', price: '82,64',    change: '-0,67%', pos: false },
      { symbol: 'NYMEX:NG1!', label: 'Gás Natural',  nameKey: 'GAS', name: 'Natural Gas',    price: '2,148',    change: '+1,23%', pos: true  },
      { symbol: 'CBOT:ZW1!',  label: 'Trigo',        name: 'Trigo',          price: '584,25',   change: '+0,72%', pos: true  },
      { symbol: 'CBOT:ZC1!',  label: 'Milho',        name: 'Milho',          price: '452,75',   change: '-0,18%', pos: false },
      { symbol: 'CBOT:ZS1!',  label: 'Soja',         name: 'Soja',           price: '1.248,50', change: '+0,45%', pos: true  },
      { symbol: 'NYMEX:RB1!', label: 'Gasolina',     name: 'Gasolina',       price: '2,312',    change: '-0,34%', pos: false },
    ],
  },
};

