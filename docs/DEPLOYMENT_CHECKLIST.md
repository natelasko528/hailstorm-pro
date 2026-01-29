# HailStorm Pro - Deployment Checklist

## Pre-Deployment Setup

### 1. Supabase Setup (15 minutes)
- [ ] Create Supabase account at https://supabase.com
- [ ] Create new project (choose region closest to users)
- [ ] Wait for project to initialize (2-3 minutes)
- [ ] Navigate to SQL Editor
- [ ] Copy entire contents of `supabase/migrations/001_initial_schema.sql`
- [ ] Paste and click "Run" (should see success messages)
- [ ] Verify tables created: Go to Table Editor, should see:
  - profiles
  - storms
  - properties
  - roof_measurements
  - campaigns
  - interactions
- [ ] Copy credentials:
  - Project Settings → API → URL
  - Project Settings → API → anon/public key

### 2. Mapbox Setup (5 minutes)
- [ ] Create Mapbox account at https://mapbox.com
- [ ] Navigate to Account → Tokens
- [ ] Copy default public token OR create new token
- [ ] Note: Free tier includes 50,000 map loads/month

### 3. GitHub Repository (10 minutes)
- [ ] Create new GitHub repository (public or private)
- [ ] Initialize with .gitignore (Node)
- [ ] Copy all project files to repository:
  ```bash
  git init
  git add .
  git commit -m "Initial commit: HailStorm Pro MVP"
  git remote add origin https://github.com/yourusername/hailstorm-pro.git
  git push -u origin main
  ```

### 4. Vercel Deployment (10 minutes)
- [ ] Create Vercel account at https://vercel.com
- [ ] Click "Add New Project"
- [ ] Import your GitHub repository
- [ ] Configure project:
  - Framework Preset: Vite
  - Build Command: `npm run build`
  - Output Directory: `dist`
- [ ] Add Environment Variables:
  ```
  VITE_SUPABASE_URL=https://xxxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGci...
  VITE_MAPBOX_TOKEN=pk.eyJ1Ijoi...
  ```
- [ ] Click "Deploy"
- [ ] Wait 2-3 minutes for deployment

## Post-Deployment Testing

### 5. Authentication Testing (5 minutes)
- [ ] Visit your deployed URL
- [ ] Click "Sign Up"
- [ ] Enter email and password (min 6 characters)
- [ ] Check email for verification link
- [ ] Click verification link
- [ ] Return to app and sign in
- [ ] Verify you see the dashboard

### 6. Feature Testing (10 minutes)
- [ ] **Dashboard:**
  - [ ] Metrics cards display
  - [ ] Recent storms list shows
  - [ ] Lead pipeline visible
  - [ ] Quick actions work
  
- [ ] **Storm Map:**
  - [ ] Map loads successfully
  - [ ] Can navigate/zoom map
  - [ ] Storm markers visible (if data imported)
  - [ ] Legend displays correctly
  - [ ] Fullscreen control works
  
- [ ] **Leads Page:**
  - [ ] Table displays
  - [ ] Search bar functional
  - [ ] Filter button present
  - [ ] Export button visible
  
- [ ] **Navigation:**
  - [ ] Sidebar links work
  - [ ] Page transitions smooth
  - [ ] Back button works
  - [ ] Sign out works

### 7. Import Sample Data (Optional, 15 minutes)
- [ ] Go to Supabase Dashboard → Table Editor
- [ ] Select `storms` table
- [ ] Click "Insert" → "Insert row"
- [ ] Manually add 2-3 sample storms OR:
- [ ] Use Supabase SQL Editor to bulk import:

```sql
-- Example: Insert sample storm
INSERT INTO storms (event_id, event_name, event_date, state, county, severity, max_hail_size, geometry)
VALUES (
  '700001',
  'Milwaukee Hailstorm',
  '2024-01-15',
  'WI',
  'Milwaukee',
  3,
  1.75,
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-87.9,43.1],[-87.8,43.1],[-87.8,43.0],[-87.9,43.0],[-87.9,43.1]]]}')
);
```

## Production Optimization

### 8. Performance (Optional)
- [ ] Enable Vercel Analytics
- [ ] Add custom domain (if desired)
- [ ] Set up SSL certificate (automatic with Vercel)
- [ ] Configure caching headers

### 9. Monitoring (Optional)
- [ ] Set up error tracking (Sentry)
- [ ] Configure uptime monitoring
- [ ] Set up usage alerts in Supabase
- [ ] Monitor Mapbox API usage

### 10. Security Checklist
- [x] Row Level Security (RLS) enabled on all tables
- [x] Environment variables not committed to Git
- [x] HTTPS enforced by Vercel
- [x] Supabase auth email verification enabled
- [ ] Consider adding rate limiting
- [ ] Review Supabase RLS policies

## Common Issues & Solutions

### Issue: Map doesn't load
**Solution:** Check Mapbox token is correct and has public scope

### Issue: Authentication fails
**Solution:** Verify Supabase URL and anon key are correct

### Issue: Build fails on Vercel
**Solution:** Ensure all dependencies in package.json, check build logs

### Issue: Can't see any data
**Solution:** Import sample data from generated JSON files

### Issue: 404 on page refresh
**Solution:** vercel.json rewrites should handle this (already configured)

## Success Criteria

✅ All items checked above  
✅ App accessible at Vercel URL  
✅ Authentication working  
✅ All pages load without errors  
✅ Map displays correctly  
✅ No console errors in browser

## Next Steps After Deployment

1. **Share with team** - Send Vercel URL
2. **Gather feedback** - Note bugs and feature requests
3. **Plan Phase 2** - Data enrichment features
4. **Set up analytics** - Track user behavior
5. **Create documentation** - User guide for contractors

---

## Quick Reference

**Supabase Dashboard:** https://app.supabase.com  
**Mapbox Dashboard:** https://account.mapbox.com  
**Vercel Dashboard:** https://vercel.com/dashboard  
**GitHub Repo:** (your repository URL)

**Estimated Total Time:** 1-1.5 hours  
**Difficulty:** Beginner-friendly  
**Cost:** $0 (using free tiers)

---

## Support

If you encounter issues:
1. Check browser console for errors (F12)
2. Review Vercel deployment logs
3. Check Supabase logs
4. Verify environment variables are set correctly
5. Ensure database migrations ran successfully

**Status:** Ready for deployment! 🚀
