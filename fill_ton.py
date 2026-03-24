import csv
import json
import urllib.request
import time
from datetime import datetime, timedelta

CSV_IN = '/Users/junwoong/.openclaw/workspace/ton-payments.csv'
CSV_OUT = '/Users/junwoong/.openclaw/workspace/ton-payments-filled.csv'

def parse_num(s):
    if not s or not s.strip():
        return None
    return float(s.replace(',', ''))

def fmt_num(n):
    if n is None:
        return ''
    return f"{n:,.2f}"

def fetch_upbit_price(date_str):
    """Fetch TOKAMAK KRW close price from Upbit. Try date+1 day to get that date's candle."""
    d = datetime.strptime(date_str, '%Y-%m-%d') + timedelta(days=1)
    url = f"https://api.upbit.com/v1/candles/days?market=KRW-TOKAMAK&to={d.strftime('%Y-%m-%d')}T09:00:00&count=1"
    req = urllib.request.Request(url)
    req.add_header('Accept', 'application/json')
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read())
        if data:
            candle_date = data[0]['candle_date_time_kst'][:10]
            price = data[0]['trade_price']
            return candle_date, price
    return None, None

# Read CSV
rows = []
with open(CSV_IN, 'r', encoding='utf-8-sig') as f:
    reader = csv.reader(f)
    header = next(reader)
    for row in reader:
        rows.append(row)

# Get all unique dates
all_dates = sorted(set(row[0].strip() for row in rows if len(row) >= 1 and row[0].strip().startswith('2023')))
print(f"Unique dates: {len(all_dates)}")

# Fetch Upbit prices
upbit_prices = {}  # date -> KRW price per TON
for date in all_dates:
    try:
        candle_date, price = fetch_upbit_price(date)
        upbit_prices[date] = price
        print(f"  {date}: candle={candle_date}, price={price}")
        time.sleep(0.12)  # rate limit
    except Exception as e:
        print(f"  {date}: ERROR {e}")
        time.sleep(0.5)

print(f"\nGot {len(upbit_prices)} prices")

# Now derive USD/KRW exchange rates from rows that have USD values
# exchange_rate = (TON * upbit_krw) / USD
derived_rates = {}  # date -> exchange_rate
for row in rows:
    if len(row) < 5:
        continue
    date = row[0].strip()
    if not date.startswith('2023'):
        continue
    ton = parse_num(row[2])
    usd = parse_num(row[3])
    if ton and usd and usd > 0 and date in upbit_prices and upbit_prices[date]:
        krw_calc = ton * upbit_prices[date]
        rate = krw_calc / usd
        if date not in derived_rates:
            derived_rates[date] = []
        derived_rates[date].append(rate)

# Average rates per date
avg_rates = {}
for date, rates in derived_rates.items():
    avg_rates[date] = sum(rates) / len(rates)
    print(f"  Derived rate {date}: {avg_rates[date]:.2f} (from {len(rates)} rows)")

# For dates without derived rates, interpolate
# Sort all dates and use nearest available rate
all_rate_dates = sorted(avg_rates.keys())
print(f"\nDates with derived rates: {len(all_rate_dates)}")

def get_exchange_rate(date):
    if date in avg_rates:
        return avg_rates[date]
    # Find nearest date with rate
    best = None
    best_diff = 999999
    d = datetime.strptime(date, '%Y-%m-%d')
    for rd in all_rate_dates:
        diff = abs((datetime.strptime(rd, '%Y-%m-%d') - d).days)
        if diff < best_diff:
            best_diff = diff
            best = rd
    if best:
        return avg_rates[best]
    return 1300.0  # fallback

# Fill in missing values
filled = 0
for row in rows:
    if len(row) < 5:
        continue
    date = row[0].strip()
    if not date.startswith('2023'):
        continue
    ton = parse_num(row[2])
    if not ton:
        continue
    usd = parse_num(row[3])
    krw = parse_num(row[4])
    
    upbit_krw = upbit_prices.get(date)
    if not upbit_krw:
        continue
    
    rate = get_exchange_rate(date)
    
    # Fill KRW if missing
    if krw is None:
        krw_val = ton * upbit_krw
        row[4] = fmt_num(krw_val)
        filled += 1
    
    # Fill USD if missing
    if usd is None:
        krw_val = ton * upbit_krw
        usd_val = krw_val / rate
        row[3] = fmt_num(usd_val)
        filled += 1

print(f"\nFilled {filled} cells")

# Write output
with open(CSV_OUT, 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(header)
    for row in rows:
        writer.writerow(row)

print(f"Saved to {CSV_OUT}")
