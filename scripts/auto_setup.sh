#!/bin/bash
set -e  # Exit on any error

echo "=============================================="
echo "🚀 HailStorm Pro - Automated Setup"
echo "=============================================="
echo ""

# Navigate to project directory
cd "$(dirname "$0")"
PROJECT_DIR=$(pwd)

echo "📁 Project directory: $PROJECT_DIR"
echo ""

# Step 1: Check for .env file
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Checking environment configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo ""
    echo "Creating .env from template..."
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "✅ Created .env file"
        echo ""
        echo "⚠️  IMPORTANT: You must edit .env with your credentials:"
        echo "   1. Go to https://supabase.com"
        echo "   2. Create a project (or use existing)"
        echo "   3. Get your Project URL and anon key from Settings → API"
        echo "   4. Edit .env file and replace the placeholder values"
        echo ""
        echo "📝 Opening .env for editing..."
        echo ""
        cat .env
        echo ""
        echo "❌ Setup cannot continue without credentials."
        echo "   Please edit .env and run this script again."
        exit 1
    else
        echo "❌ env.example not found!"
        exit 1
    fi
else
    echo "✅ .env file exists"
    
    # Check if credentials are configured
    if grep -q "your-project-url" .env || grep -q "your-anon-key" .env; then
        echo "❌ .env still has placeholder values!"
        echo ""
        echo "Please edit .env and replace:"
        echo "  - your-project-url.supabase.co → your actual Supabase URL"
        echo "  - your-anon-key → your actual anon key"
        echo ""
        echo "Get these from: Supabase dashboard → Settings → API"
        exit 1
    else
        echo "✅ Credentials appear to be configured"
    fi
fi

echo ""

# Step 2: Install dependencies
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Installing npm dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies (this may take a minute)..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
    echo "   (run 'npm install' to update if needed)"
fi

echo ""

# Step 3: Check database schema
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Database setup check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "⚠️  IMPORTANT: Before starting, ensure you've run the database schema!"
echo ""
echo "In Supabase dashboard:"
echo "  1. Go to SQL Editor"
echo "  2. Create new query"
echo "  3. Paste contents of 'simplified_schema.sql'"
echo "  4. Click Run"
echo ""
read -p "Have you run the database schema? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please run the schema first, then restart this script"
    exit 1
fi

echo "✅ Database schema confirmed"
echo ""

# Step 4: Offer to seed data
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Seed database with 7,420 NOAA storms"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

read -p "Would you like to seed the database now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📊 Seeding database..."
    echo ""
    echo "⚠️  You'll need your SUPABASE_SERVICE_ROLE_KEY"
    echo "   (from Supabase dashboard → Settings → API → service_role key)"
    echo ""
    
    # Check if Python script exists
    if [ -f "setup_supabase.py" ]; then
        # Load .env variables
        export $(cat .env | grep VITE_SUPABASE_URL | xargs)
        
        echo "Enter your SUPABASE_SERVICE_ROLE_KEY:"
        read -s SERVICE_KEY
        export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_KEY"
        
        echo ""
        echo "Running seeding script..."
        python3 setup_supabase.py
        
        if [ $? -eq 0 ]; then
            echo "✅ Database seeded with 7,420 storms!"
        else
            echo "❌ Seeding failed - check the error above"
            echo "   You can run 'python3 setup_supabase.py' manually later"
        fi
    else
        echo "❌ setup_supabase.py not found"
    fi
else
    echo "⏭️  Skipping database seeding"
    echo "   (You can run 'python3 setup_supabase.py' later)"
fi

echo ""

# Step 5: Start dev server
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5: Starting development server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Setup complete!"
echo ""
echo "Starting dev server on http://localhost:5173"
echo "Press Ctrl+C to stop the server"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the dev server
npm run dev
