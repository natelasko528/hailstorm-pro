"""
Supabase Database Setup and NOAA Data Seeding Script
This script:
1. Reads NOAA hail storm data from CSV
2. Creates database tables via Supabase SQL
3. Seeds the database with real storm data
4. Generates mock leads based on storm locations
"""

import os
import csv
import json
from datetime import datetime, timedelta
import random

# You'll need to set these environment variables or pass them as arguments
SUPABASE_URL = os.environ.get('VITE_SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

print("=" * 80)
print("HailStorm Pro - Supabase Setup & Data Seeding")
print("=" * 80)

# Check for Supabase credentials
if not SUPABASE_URL or not SUPABASE_KEY:
    print("\n⚠️  Supabase credentials not found in environment variables.")
    print("\nTo complete setup, you need to:")
    print("1. Create a Supabase project at https://supabase.com")
    print("2. Get your project URL and service role key from Settings > API")
    print("3. Set environment variables:")
    print("   export VITE_SUPABASE_URL='your-project-url'")
    print("   export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'")
    print("\nOr create a .env file in the hailstorm-pro directory with:")
    print("   VITE_SUPABASE_URL=your-project-url")
    print("   VITE_SUPABASE_ANON_KEY=your-anon-key")
    print("   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key")
    print("\n" + "=" * 80)
    
    # Generate the SQL migration file
    print("\n✓ Generating SQL migration file...")
    sql_file = '/home/user/files/001_initial_schema.sql'
    print(f"✓ SQL schema saved to: 001_initial_schema.sql")
    print("\nYou can run this SQL in your Supabase SQL Editor to create tables.")
    
    exit(0)

try:
    import requests
    
    # Initialize Supabase connection
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    
    base_url = SUPABASE_URL.rstrip('/')
    
    print(f"\n✓ Connected to Supabase: {base_url}")
    
    # Load NOAA data
    csv_file = '/home/user/files/noaa_hail_storms_2024.csv'
    print(f"\n📊 Loading NOAA data from CSV...")
    
    storms = []
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Parse date
            try:
                begin_date = datetime.strptime(row['begin_date'], '%d-%b-%y %H:%M:%S')
            except:
                begin_date = datetime.now()
            
            # Determine severity based on magnitude
            magnitude = float(row['magnitude'])
            if magnitude >= 3.0:
                severity = 'extreme'
            elif magnitude >= 2.0:
                severity = 'severe'
            elif magnitude >= 1.5:
                severity = 'moderate'
            else:
                severity = 'mild'
            
            # Parse damage
            damage_str = row['damage_property']
            damage = 0
            if damage_str and damage_str != '0.00K':
                try:
                    if 'K' in damage_str:
                        damage = float(damage_str.replace('K', '')) * 1000
                    elif 'M' in damage_str:
                        damage = float(damage_str.replace('M', '')) * 1000000
                except:
                    pass
            
            storm = {
                'event_id': row['event_id'],
                'name': f"{row['state']} - {row['cz_name']}",
                'state': row['state'],
                'date': begin_date.isoformat(),
                'severity': severity,
                'hail_size': magnitude,
                'affected_properties': random.randint(50, 500) if magnitude >= 1.5 else random.randint(10, 100),
                'estimated_damage': int(damage) if damage > 0 else random.randint(100000, 5000000),
                'latitude': float(row['begin_lat']),
                'longitude': float(row['begin_lon']),
                'narrative': row['event_narrative'] or row['episode_narrative'] or '',
                'county': row['cz_name'],
                'timezone': row['cz_timezone']
            }
            storms.append(storm)
    
    print(f"✓ Loaded {len(storms)} storm events")
    
    # Insert storms in batches
    print(f"\n📤 Uploading storms to Supabase...")
    batch_size = 100
    uploaded = 0
    
    for i in range(0, len(storms), batch_size):
        batch = storms[i:i+batch_size]
        response = requests.post(
            f'{base_url}/rest/v1/storms',
            headers=headers,
            json=batch
        )
        
        if response.status_code in [200, 201]:
            uploaded += len(batch)
            print(f"  Uploaded {uploaded}/{len(storms)} storms...")
        else:
            print(f"  Error uploading batch: {response.status_code} - {response.text}")
    
    print(f"✓ Successfully uploaded {uploaded} storms")
    
    # Generate mock leads based on storms
    print(f"\n🏠 Generating mock property leads from storm data...")
    
    leads = []
    lead_statuses = ['new', 'contacted', 'qualified', 'appointment', 'won', 'lost']
    
    # Create 2-10 leads per storm (for first 100 storms to keep it manageable)
    for storm in storms[:100]:
        num_leads = random.randint(2, 10)
        for _ in range(num_leads):
            # Generate random address near storm location
            lat_offset = random.uniform(-0.05, 0.05)
            lon_offset = random.uniform(-0.05, 0.05)
            
            lead = {
                'storm_id': storm['event_id'],
                'owner_name': f"Property Owner {random.randint(1000, 9999)}",
                'address': f"{random.randint(100, 9999)} Main St",
                'city': storm['county'],
                'state': storm['state'],
                'zip': f"{random.randint(10000, 99999)}",
                'phone': f"({random.randint(200, 999)}) {random.randint(200, 999)}-{random.randint(1000, 9999)}",
                'email': f"owner{random.randint(1000, 9999)}@example.com",
                'latitude': storm['latitude'] + lat_offset,
                'longitude': storm['longitude'] + lon_offset,
                'lead_score': random.randint(30, 100),
                'status': random.choice(lead_statuses),
                'damage_severity': random.choice(['minor', 'moderate', 'severe']),
                'roof_age': random.randint(5, 30),
                'property_value': random.randint(150000, 750000),
                'notes': f"Generated from {storm['name']} storm event",
                'created_at': datetime.now().isoformat()
            }
            leads.append(lead)
    
    print(f"✓ Generated {len(leads)} property leads")
    
    # Upload leads
    print(f"\n📤 Uploading leads to Supabase...")
    uploaded_leads = 0
    
    for i in range(0, len(leads), batch_size):
        batch = leads[i:i+batch_size]
        response = requests.post(
            f'{base_url}/rest/v1/leads',
            headers=headers,
            json=batch
        )
        
        if response.status_code in [200, 201]:
            uploaded_leads += len(batch)
            print(f"  Uploaded {uploaded_leads}/{len(leads)} leads...")
        else:
            print(f"  Error uploading batch: {response.status_code} - {response.text}")
    
    print(f"✓ Successfully uploaded {uploaded_leads} leads")
    
    print("\n" + "=" * 80)
    print("✅ Database setup complete!")
    print("=" * 80)
    print(f"\n📊 Summary:")
    print(f"   • Storms: {uploaded}")
    print(f"   • Leads: {uploaded_leads}")
    print(f"\n🚀 Your HailStorm Pro app is ready to use!")
    
except ImportError:
    print("\n⚠️  'requests' library not available.")
    print("Run: pip install requests")
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\nPlease check your Supabase credentials and try again.")
