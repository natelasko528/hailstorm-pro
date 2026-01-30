#!/usr/bin/env python3
"""
Seed Wisconsin Hail Storm Data into Supabase
============================================
This script loads 584 Wisconsin hail events (2024-2025) from NOAA into the storm_events table.

Uses httpx directly to avoid heavy build dependencies.
Run with: python seed_hail_data.py
"""

import csv
import json
from datetime import datetime

try:
    import httpx
except ImportError:
    print("Installing httpx...")
    import subprocess
    subprocess.check_call(["pip", "install", "httpx"])
    import httpx

# Supabase credentials
SUPABASE_URL = "https://hekxyqhylzczirrbpldx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhla3h5cWh5bHpjemlycmJwbGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MDUwMjMsImV4cCI6MjA3NTk4MTAyM30.EVRJEhTbDmvRKFim7FaPQaD5LbUrlTSNpsP08Zm46tM"

# CSV file path
CSV_FILE = "wisconsin_hail_2024_2025.csv"


def parse_date(date_str: str) -> str:
    """Convert NOAA date format to ISO format for PostgreSQL."""
    if not date_str:
        return None
    try:
        # Format: '08-FEB-24 18:49:00'
        dt = datetime.strptime(date_str, '%d-%b-%y %H:%M:%S')
        return dt.isoformat()
    except ValueError:
        return None


def main():
    print("=" * 60)
    print("Wisconsin Hail Storm Data Seeder")
    print("=" * 60)
    
    # Set up HTTP client
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    
    # Read CSV file
    print(f"\n1. Reading {CSV_FILE}...")
    records = []
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Skip if not a hail event
            if row.get('EVENT_TYPE', '').lower() != 'hail':
                continue
                
            record = {
                'event_id': row['EVENT_ID'],
                'event_type': 'Hail',
                'event_narrative': (row.get('EVENT_NARRATIVE') or '')[:500] or None,
                'magnitude': float(row['MAGNITUDE']) if row.get('MAGNITUDE') else 0.75,
                'location': row.get('BEGIN_LOCATION') or None,
                'county': row.get('CZ_NAME') or None,
                'state': 'WISCONSIN',
                'begin_date_time': parse_date(row.get('BEGIN_DATE_TIME')),
                'latitude': float(row['BEGIN_LAT']) if row.get('BEGIN_LAT') else None,
                'longitude': float(row['BEGIN_LON']) if row.get('BEGIN_LON') else None,
                'source': row.get('SOURCE') or 'NOAA',
                'year': int(row['YEAR']) if row.get('YEAR') else 2024,
                'month_name': row.get('MONTH_NAME') or None,
            }
            records.append(record)
    
    print(f"   Loaded {len(records)} hail storm records")
    
    # Insert records in batches via REST API
    print("\n2. Inserting records into storm_events table...")
    batch_size = 50
    total_inserted = 0
    errors = 0
    
    url = f"{SUPABASE_URL}/rest/v1/storm_events"
    
    with httpx.Client(timeout=30.0) as client:
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            try:
                response = client.post(url, headers=headers, json=batch)
                if response.status_code in (200, 201):
                    total_inserted += len(batch)
                    print(f"   Batch {i // batch_size + 1}: Inserted {len(batch)} records ({total_inserted}/{len(records)})")
                elif response.status_code == 409:
                    # Conflict - records already exist, that's OK
                    total_inserted += len(batch)
                    print(f"   Batch {i // batch_size + 1}: Upserted {len(batch)} records ({total_inserted}/{len(records)})")
                else:
                    errors += 1
                    print(f"   Batch {i // batch_size + 1}: ERROR {response.status_code} - {response.text[:200]}")
            except Exception as e:
                errors += 1
                print(f"   Batch {i // batch_size + 1}: EXCEPTION - {str(e)[:100]}")
    
    # Verify insertion
    print("\n3. Verifying data...")
    try:
        with httpx.Client(timeout=30.0) as client:
            count_url = f"{SUPABASE_URL}/rest/v1/storm_events?state=eq.WISCONSIN&select=event_id"
            count_headers = {**headers, "Prefer": "count=exact"}
            response = client.get(count_url, headers=count_headers)
            if 'content-range' in response.headers:
                content_range = response.headers['content-range']
                total = content_range.split('/')[-1]
                print(f"   Records in database: {total}")
            else:
                print(f"   Records returned: {len(response.json())}")
    except Exception as e:
        print(f"   Could not verify: {e}")
    
    print(f"\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"   Total records processed: {len(records)}")
    print(f"   Successfully inserted: {total_inserted}")
    print(f"   Errors: {errors}")
    print("\nDone! You can now run the application with real Wisconsin hail data.")


if __name__ == '__main__':
    main()
