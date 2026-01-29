# HailStorm Pro - Automated Roofing Lead Generation

> Transform storm data into qualified roofing leads automatically

## Features

- **Storm Intelligence** - Real-time hail storm tracking with NOAA data
- **Interactive Maps** - Visualize storm polygons with Mapbox GL JS
- **Property Identification** - Find affected properties within storm zones
- **Lead Scoring** - AI-powered lead qualification (0-100 score)
- **Automated Outreach** - GoHighLevel integration for SMS/email campaigns
- **Roof Measurement** - Satellite imagery analysis for instant estimates

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Maps**: Mapbox GL JS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Vercel
- **APIs**: NOAA, Geoapify, Google Earth Engine

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Mapbox account

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/hailstorm-pro.git
cd hailstorm-pro

# Install dependencies
npm install

# Copy environment variables
cp env.example .env

# Add your API keys to .env
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
# VITE_MAPBOX_TOKEN=your_mapbox_token
```

### Database Setup

```bash
# Run migrations in Supabase SQL Editor
# Execute the SQL in supabase/migrations/001_initial_schema.sql
```

### Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
hailstorm-pro/
├── src/
│   ├── components/      # React components
│   │   ├── layout/      # Layout components (Header, Sidebar)
│   │   ├── map/         # Map components (StormMap)
│   │   └── ui/          # Reusable UI components
│   ├── pages/           # Page components
│   ├── lib/             # Utilities and API clients
│   ├── store/           # State management (Zustand)
│   ├── types/           # TypeScript types
│   └── styles/          # Global styles
├── agents/              # Python data processing agents
│   └── storm-data-agent/
├── supabase/            # Database migrations
└── public/              # Static assets
```

## Features Roadmap

### Phase 1: MVP (Complete)
- ✅ Authentication
- ✅ Storm map visualization
- ✅ Dashboard with metrics
- ✅ Basic lead management

### Phase 2: Enrichment
- ⏳ Property data enrichment
- ⏳ Skip tracing integration
- ⏳ AI lead scoring

### Phase 3: Automation
- ⏳ GoHighLevel integration
- ⏳ Automated campaigns
- ⏳ Calendar sync

### Phase 4: Roof Measurement
- ⏳ Satellite imagery analysis
- ⏳ Automated measurements
- ⏳ PDF report generation

### Phase 5: Advanced
- ⏳ Voice AI calls
- ⏳ Team collaboration
- ⏳ White-label options

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables

Set these in your Vercel project settings:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MAPBOX_TOKEN`

## Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## License

MIT License - see LICENSE file for details

## Support

For support, email support@hailstormpro.com or join our Slack community.

---

Built with ❤️ by the HailStorm Pro team
