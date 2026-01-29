# HailStorm Pro - Setup Instructions

## Prerequisites

1. **Supabase Account** - Create a free account at [supabase.com](https://supabase.com)
2. **Mapbox Account** - Create a free account at [mapbox.com](https://mapbox.com) for map functionality

## Step 1: Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in:
   - **Name**: HailStorm Pro
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
4. Click "Create new project" (takes ~2 minutes)

## Step 2: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the contents of `simplified_schema.sql` from this project
4. Paste into the SQL editor
5. Click "Run" to create the tables

You should see: `Success. No rows returned`

## Step 3: Seed Database with Real NOAA Data

We have **7,420 real hail storm events** from NOAA ready to upload!

### Option A: Using Python Script (Recommended)

```bash
# Set environment variables
export VITE_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Run the setup script
python3 setup_supabase.py
```

The script will:
- Upload all 7,420 NOAA hail storms from 2024
- Generate realistic property leads based on storm locations
- Create ~500+ mock leads for testing

### Option B: Manual Import via Supabase Dashboard

1. Go to **Table Editor** in Supabase
2. Select the `storms` table
3. Click "Insert" > "Import data from CSV"
4. Upload `noaa_hail_storms_2024.csv`
5. Map columns to match the schema

## Step 4: Get API Credentials

### Supabase Credentials

1. In Supabase dashboard, go to **Settings** > **API**
2. Copy these two values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

### Mapbox Token

1. Go to [mapbox.com/account/access-tokens](https://mapbox.com/account/access-tokens)
2. Copy your **Default public token**
3. Or create a new token with these scopes:
   - `styles:read`
   - `fonts:read`
   - `datasets:read`

## Step 5: Configure Environment Variables

1. Copy `env.example` to `.env` in the `hailstorm-pro` directory:

```bash
cp env.example .env
```

2. Edit `.env` and add your credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_MAPBOX_TOKEN=your-mapbox-token-here
```

## Step 6: Install Dependencies & Run

```bash
cd hailstorm-pro

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to see your app!

## Step 7: Test the Application

1. **Landing Page** - Should load with hero section
2. **Login** - Use any email/password (we'll add auth later)
3. **Dashboard** - Should show analytics and charts
4. **Storms Map** - Should display real NOAA storms on Mapbox
5. **Leads** - Should show property leads

## Troubleshooting

### "Missing Supabase environment variables"

- Make sure your `.env` file is in the `hailstorm-pro` directory (same level as `package.json`)
- Restart the dev server after creating/editing `.env`
- Check that variable names start with `VITE_`

### Map not loading

- Verify your Mapbox token is correct
- Check browser console for errors
- Make sure the token has the required scopes

### No data showing

- Confirm you ran the SQL schema (`simplified_schema.sql`)
- Check that the `storms` and `leads` tables exist in Supabase Table Editor
- Run the Python setup script to seed data

### CORS errors

- This is normal in development
- Supabase automatically allows localhost origins
- For production, add your domain in Supabase Settings > API > CORS

## Next Steps

### Add Authentication

Currently the app uses mock authentication. To add real Supabase auth:

1. Enable Email provider in Supabase: **Authentication** > **Providers** > **Email**
2. Update `src/lib/supabaseClient.ts` to use real auth
3. Replace mock login in `LoginPage.tsx` with `supabase.auth.signInWithPassword()`

### Connect Real Property Data

Integrate with property data APIs:
- **Attom Data** - Property details, ownership records
- **CoreLogic** - Roof measurements, property values
- **Melissa Data** - Address validation, skip tracing

### Add Outreach Features

- **Twilio** - SMS campaigns
- **SendGrid** - Email marketing
- **RingCentral** - Voice calls

## File Structure

```
hailstorm-pro/
├── simplified_schema.sql          # Database schema (run in Supabase)
├── setup_supabase.py              # Data seeding script
├── noaa_hail_storms_2024.csv      # 7,420 real hail storms
├── env.example                     # Environment template
├── .env                            # Your credentials (create this)
├── src/
│   ├── lib/
│   │   └── supabaseClient.ts      # Supabase connection
│   ├── pages/                      # All app pages
│   └── components/                 # Reusable components
└── package.json
```

## Support

Questions? Check:
- Supabase docs: [supabase.com/docs](https://supabase.com/docs)
- Mapbox docs: [docs.mapbox.com](https://docs.mapbox.com)
- React docs: [react.dev](https://react.dev)
