# HailStorm Pro - Repository Structure

```
hailstorm-pro/
├── .github/
│   └── workflows/
│       └── deploy.yml           # Vercel deployment pipeline
├── public/
│   ├── favicon.ico
│   └── logo.png
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignupForm.tsx
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── MetricsCard.tsx
│   │   │   └── LeadPipeline.tsx
│   │   ├── map/
│   │   │   ├── StormMap.tsx
│   │   │   ├── StormPolygon.tsx
│   │   │   └── PropertyMarker.tsx
│   │   ├── leads/
│   │   │   ├── LeadList.tsx
│   │   │   ├── LeadCard.tsx
│   │   │   ├── LeadDetails.tsx
│   │   │   └── LeadFilters.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       └── Card.tsx
│   ├── pages/
│   │   ├── index.tsx            # Dashboard
│   │   ├── storms.tsx           # Storm map view
│   │   ├── leads.tsx            # Lead management
│   │   ├── properties.tsx       # Property details
│   │   ├── campaigns.tsx        # Marketing campaigns
│   │   └── settings.tsx         # User settings
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client
│   │   ├── api.ts               # API helpers
│   │   └── utils.ts             # Utility functions
│   ├── hooks/
│   │   ├── useStorms.ts
│   │   ├── useLeads.ts
│   │   └── useAuth.ts
│   ├── types/
│   │   ├── storm.ts
│   │   ├── lead.ts
│   │   └── property.ts
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   └── main.tsx
├── agents/
│   ├── storm-data-agent/
│   │   ├── fetch-noaa-data.py
│   │   ├── process-polygons.py
│   │   └── requirements.txt
│   ├── property-intelligence-agent/
│   │   ├── geocode-properties.py
│   │   ├── skip-trace.py
│   │   └── lead-scoring.py
│   └── roof-measurement-agent/
│       ├── satellite-analysis.py
│       └── measurement-report.py
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
├── .env.example
└── README.md
```

## Key Design Decisions

1. **React + Vite**: Fast dev server, optimal build performance
2. **TypeScript**: Type safety for complex data structures
3. **Tailwind CSS**: Rapid UI development with utility classes
4. **Supabase**: Backend-as-a-service (auth, database, storage)
5. **Agent System**: Python scripts for data processing tasks
6. **Vercel**: Zero-config deployment with GitHub integration

## Next Steps
1. Initialize React app with Vite
2. Install dependencies (Tailwind, Mapbox, Supabase client)
3. Set up Supabase project
4. Create agents
