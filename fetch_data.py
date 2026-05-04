import json
import math
import random
from datetime import datetime, timedelta

def generate_mock_data(start_price, volatility, days=365):
    records = []
    current_price = start_price
    
    # Generate prices
    base_date = datetime(2025, 5, 4) - timedelta(days=days)
    
    prices = []
    for i in range(days + 100):  # +100 to allow for EMA calculations
        change = random.gauss(0, volatility) * current_price
        open_p = current_price
        close_p = current_price + change
        high_p = max(open_p, close_p) + abs(random.gauss(0, volatility/2) * current_price)
        low_p = min(open_p, close_p) - abs(random.gauss(0, volatility/2) * current_price)
        volume = max(1000, random.gauss(50000, 20000))
        
        prices.append({
            'date': (base_date + timedelta(days=i)).strftime('%Y-%m-%d'),
            'open': open_p,
            'high': high_p,
            'low': low_p,
            'close': close_p,
            'volume': volume
        })
        current_price = close_p
        
    # Calculate indicators manually (simple approximations)
    def calc_ema(data, period):
        emas = []
        multiplier = 2 / (period + 1)
        ema = data[0]['close']
        for row in data:
            ema = (row['close'] - ema) * multiplier + ema
            emas.append(ema)
        return emas
    
    ema20 = calc_ema(prices, 20)
    ema60 = calc_ema(prices, 60)
    ema12 = calc_ema(prices, 12)
    ema26 = calc_ema(prices, 26)
    
    macd_line = [e12 - e26 for e12, e26 in zip(ema12, ema26)]
    
    macd_signal = []
    signal_ema = macd_line[0]
    signal_mult = 2 / (9 + 1)
    for m in macd_line:
        signal_ema = (m - signal_ema) * signal_mult + signal_ema
        macd_signal.append(signal_ema)
        
    macd_hist = [m - s for m, s in zip(macd_line, macd_signal)]
    
    # RSI (rough approximation)
    rsi = []
    for i in range(len(prices)):
        if i < 14:
            rsi.append(50)
            continue
        gains = sum(max(0, prices[j]['close'] - prices[j-1]['close']) for j in range(i-13, i+1))
        losses = sum(max(0, prices[j-1]['close'] - prices[j]['close']) for j in range(i-13, i+1))
        if losses == 0:
            rsi.append(100)
        else:
            rs = gains / losses
            rsi.append(100 - (100 / (1 + rs)))
            
    # Combine
    final_records = []
    for i in range(100, len(prices)): # skip first 100 to simulate dropping NaNs
        final_records.append({
            'date': prices[i]['date'],
            'open': prices[i]['open'],
            'high': prices[i]['high'],
            'low': prices[i]['low'],
            'close': prices[i]['close'],
            'volume': prices[i]['volume'],
            'ema20': ema20[i],
            'ema60': ema60[i],
            'macd': macd_line[i],
            'macd_signal': macd_signal[i],
            'macd_histogram': macd_hist[i],
            'rsi': rsi[i]
        })
        
    return final_records

def main():
    asset_categories = {
        "Crypto": ["BTC-USD", "ETH-USD", "SOL-USD", "BNB-USD", "XRP-USD", "ADA-USD", "DOGE-USD", "DOT-USD", "MATIC-USD", "LINK-USD"],
        "US Stocks": ["AAPL", "TSLA", "NVDA", "MSFT", "GOOGL", "AMZN", "META", "AMD", "NFLX", "INTC", "BRK-B", "LLY", "V", "JPM", "COST", "DIS", "NKE"],
        "HK Stocks": ["0700.HK", "9988.HK", "3690.HK", "1810.HK", "1211.HK", "2318.HK", "0005.HK", "1299.HK"],
        "Indices": ["^GSPC", "^IXIC", "^DJI", "^HSI", "^N225"],
        "Commodities": ["GC=F", "SI=F", "CL=F", "HG=F", "NG=F"],
        "Forex": ["EURUSD=X", "USDJPY=X", "GBPUSD=X", "AUDUSD=X"]
    }

    friendly_names = {
        "BTC-USD": "Bitcoin", "ETH-USD": "Ethereum", "SOL-USD": "Solana",
        "BNB-USD": "BNB", "XRP-USD": "XRP", "ADA-USD": "Cardano",
        "DOGE-USD": "Dogecoin", "DOT-USD": "Polkadot", "MATIC-USD": "Polygon",
        "LINK-USD": "Chainlink",
        "AAPL": "Apple", "TSLA": "Tesla", "NVDA": "Nvidia", "MSFT": "Microsoft",
        "GOOGL": "Google", "AMZN": "Amazon", "META": "Meta", "AMD": "AMD",
        "NFLX": "Netflix", "INTC": "Intel", "BRK-B": "Berkshire", "LLY": "Eli Lilly",
        "V": "Visa", "JPM": "JPMorgan", "COST": "Costco", "DIS": "Disney", "NKE": "Nike",
        "0700.HK": "腾讯 Tencent", "9988.HK": "阿里巴巴 Alibaba",
        "3690.HK": "美团 Meituan", "1810.HK": "小米 Xiaomi",
        "1211.HK": "比亚迪 BYD", "2318.HK": "平安 Ping An",
        "0005.HK": "汇丰 HSBC", "1299.HK": "友邦 AIA",
        "^GSPC": "S&P 500", "^IXIC": "Nasdaq", "^DJI": "Dow Jones",
        "^HSI": "恒生指数 Hang Seng", "^N225": "日经 Nikkei 225",
        "GC=F": "Gold", "SI=F": "Silver", "CL=F": "Crude Oil",
        "HG=F": "Copper", "NG=F": "Natural Gas",
        "EURUSD=X": "EUR/USD", "USDJPY=X": "USD/JPY",
        "GBPUSD=X": "GBP/USD", "AUDUSD=X": "AUD/USD"
    }

    assets = {
        **{t: {"start_price": 60000 if "BTC" in t else 3000 if "ETH" in t else 150, "volatility": 0.04} for t in asset_categories["Crypto"]},
        **{t: {"start_price": 400, "volatility": 0.03} for t in asset_categories["US Stocks"]},
        **{t: {"start_price": 100, "volatility": 0.035} for t in asset_categories["HK Stocks"]},
        **{t: {"start_price": 10000, "volatility": 0.015} for t in asset_categories["Indices"]},
        **{t: {"start_price": 100, "volatility": 0.02} for t in asset_categories["Commodities"]},
        **{t: {"start_price": 1, "volatility": 0.006} for t in asset_categories["Forex"]}
    }
    
    final_data = {"metadata": asset_categories, "names": friendly_names, "prices": {}}
    for ticker, params in assets.items():
        print(f"Generating mock data for {ticker}...")
        final_data["prices"][ticker] = generate_mock_data(params["start_price"], params["volatility"])
    
    with open('data.js', 'w') as f:
        f.write("const rawFinancialData = ")
        json.dump(final_data, f, indent=2)
        f.write(";")
    print("Data successfully exported to data.js")

if __name__ == "__main__":
    main()
