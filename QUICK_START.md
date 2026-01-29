# 🚀 HailStorm Pro - Quick Start Guide

## Current Status: Ready for Setup

✅ **7,420 real NOAA storms** downloaded and ready to seed  
✅ **All components** connected to Supabase (no mock data)  
✅ **Database schema** ready to deploy  
⚠️ **Needs:** Your Supabase credentials

---

## 📋 Setup Checklist (5 minutes)

### Step 1: Create Supabase Project (2 min)
1. Go to **https://supabase.com**
2. Click "Start your project" (free tier is perfect)
3. Create a new project:
   - Name: `hailstorm-pro` (or whatever you like)
   - Database password: **Save this!** You'll need it
   - Region: Choose closest to you
   - Click "Create new project"
4. Wait ~2 minutes for project to provision

### Step 2: Get Your Credentials (1 min)
Once your project is ready:
1. Go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### Step 3: Set Up Database Schema (1 min)
1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Open the file: `simplified_schema.sql` (in your project folder)
4. Copy ALL the SQL content
5. Paste into Supabase SQL Editor
6. Click **Run** (bottom right)
7. You should see: "Success. No rows returned"

### Step 4: Configure Your App (30 sec)
In your project folder (`hailstorm-pro`):

1. Create a file named `.env` (note the dot at the start!)
2. Add this content (replace with YOUR values):

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-key-here

# Mapbox Configuration (optional - map won't work without this)
VITE_MAPBOX_TOKEN=pk.eyJ1...get-from-mapbox.com
```

### Step 5: Seed Real NOAA Data (1 min)
From your terminal in the `hailstorm-pro` folder:

```bash
# Set credentials for seeding script
export VITE_SUPABASE_URL="your-url-here"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Run the seeding script
python3 setup_supabase.py
```

**Where to get service_role_key:**
- Supabase dashboard → Settings → API
- Look for "service_role" key (secret key section)
- ⚠️ Keep this private! Don't commit to git

### Step 6: Launch the App! (30 sec)
```bash
# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

Open browser to: **http://localhost:5173**

---

## 🎯 What You'll See

Once running, you'll have:

### Dashboard
- **7,420 real storms** on an interactive map
- Real-time stats from database
- Activity feed showing recent storms
- Charts with monthly/state breakdowns

### Storms Page
- Filterable list of all NOAA storms
- Search by location, date, severity
- Click any storm to see details
- Export capabilities

### Leads Page
- Database-backed lead management
- Status tracking (New → Contacted → Qualified → Closed)
- Search and filter tools

---

## 🔧 Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env` file exists in project root
- Check that variables start with `VITE_`
- Restart dev server after editing `.env`

### "Failed to fetch" errors
- Verify Supabase credentials are correct
- Make sure you ran `simplified_schema.sql`
- Check Supabase dashboard shows "Active" status

### Map not loading
- You need a Mapbox token (free tier available)
- Get one at: https://account.mapbox.com/
- Add to `.env` as `VITE_MAPBOX_TOKEN`

### No storms showing up
- Run the seeding script: `python3 setup_supabase.py`
- Check Supabase dashboard → Table Editor → `storms` table
- Should see 7,420 rows

---

## 📂 Key Files

- **`.env`** - Your credentials (create this!)
- **`simplified_schema.sql`** - Database schema (run in Supabase)
- **`setup_supabase.py`** - Seeds 7,420 real storms
- **`noaa_hail_storms_2024.csv`** - Real NOAA data source

---

## 🆘 Still Stuck?

Common issues and solutions in:
- `TROUBLESHOOTING.md` - Detailed error fixes
- `DEBUG_SUPABASE.md` - Connection debugging
- `SETUP_INSTRUCTIONS.md` - Comprehensive guide

---

## ✨ Next Steps After Setup

Once running:
1. Explore the 7,420 real NOAA storms
2. Test filtering and search
3. Create sample leads
4. Customize the UI to your needs
5. Deploy to Vercel (instructions in README.md)

---

**Need help?** Check the troubleshooting guides or share the specific error message you're seeing.
