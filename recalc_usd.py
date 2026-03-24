import csv
import json
import urllib.request
import time
from datetime import datetime, timedelta

CSV_IN = '/Users/junwoong/.openclaw/workspace/ton-payments.csv'
CSV_FILLED = '/Users/junwoong/.openclaw/workspace/ton-payments-filled.csv'
CSV_OUT = '/Users/junwoong/.openclaw/workspace/ton-payments-filled.csv'

# Dates that need real USD/KRW exchange rates
dates_need = [
    '2023-07-04','2023-07-24','2023-07-31','2023-08-01','2023-08-07','2023-08-11',
    '2023-09-01','2023-09-15','2023-10-04','2023-10-11','2023-11-01','2023-11-08',
    '2023-11-10','2023-11-14','2023-12-01','2023-12-20','2023-12-26'
]

def parse_num(s):
    if not s or not s.strip():
        return None
    return float(s.replace(',', ''))

def fmt_num(n):
    if n is None:
        return ''
    return f"{n:,.2f}"

# Fetch real USD/KRW rates from exchangerate-api (free historical)
# Alternative: use frankfurter.app (ECB data, free, no key)
real_rates = {}

for date in dates_need:
    url = f"https://api.frankfurter.app/{date}?from=USD&to=KRW"
    try:
        req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            rate = data['rates']['KRW']
            real_rates[date] = rate
            print(f"  {date}: USD/KRW = {rate:.2f}")
        time.sleep(0.2)
    except Exception as e:
        print(f"  {date}: ERROR {e}")
        # Try next business day
        try:
            d = datetime.strptime(date, '%Y-%m-%d')
            for delta in range(1, 5):
                alt = (d + timedelta(days=delta)).strftime('%Y-%m-%d')
                url2 = f"https://api.frankfurter.app/{alt}?from=USD&to=KRW"
                req2 = urllib.request.Request(url2, headers={'User-Agent':'Mozilla/5.0'})
                with urllib.request.urlopen(req2, timeout=10) as resp2:
                    data2 = json.loads(resp2.read())
                    rate2 = data2['rates']['KRW']
                    real_rates[date] = rate2
                    print(f"    -> used {alt}: {rate2:.2f}")
                    break
            time.sleep(0.2)
        except Exception as e2:
            print(f"    -> fallback also failed: {e2}")

print(f"\nGot {len(real_rates)} exchange rates")

# Now read the filled CSV and recalculate USD for those dates
rows = []
with open(CSV_FILLED, 'r', encoding='utf-8-sig') as f:
    reader = csv.reader(f)
    header = next(reader)
    for row in reader:
        rows.append(row)

# Also need upbit prices (already in filled KRW values)
recalced = 0
for row in rows:
    if len(row) < 5:
        continue
    date = row[0].strip()
    if date not in dates_need:
        continue
    if date not in real_rates:
        continue
    
    ton = parse_num(row[2])
    krw = parse_num(row[4])
    if not ton or not krw:
        continue
    
    rate = real_rates[date]
    new_usd = krw / rate
    old_usd = parse_num(row[3])
    row[3] = fmt_num(new_usd)
    recalced += 1
    if old_usd:
        diff_pct = abs(new_usd - old_usd) / old_usd * 100
        print(f"  {date} {row[1]}: ${old_usd:,.2f} -> ${new_usd:,.2f} (diff {diff_pct:.1f}%)")

print(f"\nRecalculated {recalced} USD values")

# Write
with open(CSV_OUT, 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(header)
    for row in rows:
        writer.writerow(row)

print(f"Saved to {CSV_OUT}")

# Also regenerate xlsx
try:
    import pandas as pd
    df = pd.read_csv(CSV_OUT)
    df.to_excel(CSV_OUT.replace('.csv', '.xlsx'), index=False, engine='openpyxl')
    print("xlsx also updated")
except:
    print("xlsx update skipped (pandas not available)")
