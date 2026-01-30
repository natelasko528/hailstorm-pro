/**
 * Import Hail Shapefiles to Supabase
 * 
 * This script reads NOAA/SPC hail storm path shapefiles and imports them
 * into the Supabase storm_paths table.
 * 
 * Usage:
 *   node scripts/import-shapefiles.js [options]
 * 
 * Options:
 *   --state=WI       Filter by state (default: all states)
 *   --year=2024      Filter by year (default: all years)
 *   --dry-run        Don't actually insert, just show what would be inserted
 *   --limit=100      Limit number of records to import
 */

const shapefile = require('shapefile');
const path = require('path');
const fs = require('fs');

// Configuration
const SHAPEFILE_PATH = path.join(__dirname, '../database/hail_shapefiles/1955-2024-hail-aspath/1955-2024-hail-aspath.shp');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace('--', '').split('=');
  acc[key] = value || true;
  return acc;
}, {});

const STATE_FILTER = args.state?.toUpperCase() || null;
const YEAR_FILTER = args.year ? parseInt(args.year) : null;
const DRY_RUN = args['dry-run'] || false;
const LIMIT = args.limit ? parseInt(args.limit) : null;
const BATCH_SIZE = 50;

// Calculate severity from magnitude
function getSeverity(magnitude) {
  if (!magnitude) return 'moderate';
  const mag = parseFloat(magnitude);
  if (mag >= 2.0) return 'extreme';
  if (mag >= 1.5) return 'severe';
  if (mag >= 1.0) return 'moderate';
  return 'light';
}

// Convert shapefile properties to our schema
function transformFeature(feature) {
  const props = feature.properties || {};
  
  // Parse date fields - SPC uses various formats
  let beginDate = null;
  let year = props.yr || props.YEAR || props.year;
  let month = props.mo || props.MONTH || props.month;
  let day = props.dy || props.DAY || props.day;
  
  if (year && month && day) {
    // Handle time if available
    const time = props.time || props.TIME || '0000';
    const hour = time ? Math.floor(parseInt(time) / 100) : 0;
    const minute = time ? parseInt(time) % 100 : 0;
    beginDate = new Date(year, month - 1, day, hour, minute);
  }

  // Get magnitude (hail size in inches)
  const magnitude = props.mag || props.MAG || props.magnitude || props.sz || props.SZ || null;
  
  // Get state
  const state = props.st || props.ST || props.state || props.STATE || null;
  
  // Get county
  const county = props.cty || props.CTY || props.county || props.COUNTY || props.cou || null;

  // Calculate centroid for point queries
  let centroidLat = null;
  let centroidLon = null;
  
  if (feature.geometry && feature.geometry.coordinates) {
    try {
      // Simple centroid calculation for polygon
      const coords = feature.geometry.type === 'Polygon' 
        ? feature.geometry.coordinates[0]
        : feature.geometry.type === 'MultiPolygon'
          ? feature.geometry.coordinates[0][0]
          : [];
      
      if (coords.length > 0) {
        const sumLon = coords.reduce((sum, c) => sum + c[0], 0);
        const sumLat = coords.reduce((sum, c) => sum + c[1], 0);
        centroidLon = sumLon / coords.length;
        centroidLat = sumLat / coords.length;
      }
    } catch (e) {
      // Ignore centroid calculation errors
    }
  }

  return {
    om_id: props.om || props.OM || null,
    event_id: props.event_id || `SPC_${props.om || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    begin_date: beginDate ? beginDate.toISOString() : null,
    end_date: null, // SPC data typically doesn't have end time
    year: year ? parseInt(year) : null,
    month: month ? parseInt(month) : null,
    day: day ? parseInt(day) : null,
    state: state,
    state_fips: props.stf || props.STF || null,
    county: county,
    county_fips: props.ctf || props.CTF || null,
    magnitude: magnitude ? parseFloat(magnitude) : null,
    severity: getSeverity(magnitude),
    geometry: feature.geometry,
    centroid_lat: centroidLat,
    centroid_lon: centroidLon,
    properties: props,
    source: 'SPC_SVRGIS'
  };
}

// Insert batch to Supabase
async function insertBatch(records) {
  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would insert ${records.length} records`);
    return { success: records.length, errors: 0 };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/storm_paths`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(records.map(r => ({
        ...r,
        geometry: r.geometry ? JSON.stringify(r.geometry) : null
      })))
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`  Error inserting batch: ${error}`);
      return { success: 0, errors: records.length };
    }

    return { success: records.length, errors: 0 };
  } catch (error) {
    console.error(`  Error inserting batch: ${error.message}`);
    return { success: 0, errors: records.length };
  }
}

// Main import function
async function importShapefiles() {
  console.log('='.repeat(60));
  console.log('HailStorm Pro - Shapefile Import');
  console.log('='.repeat(60));
  console.log('');
  console.log('Configuration:');
  console.log(`  Shapefile: ${SHAPEFILE_PATH}`);
  console.log(`  State filter: ${STATE_FILTER || 'All states'}`);
  console.log(`  Year filter: ${YEAR_FILTER || 'All years'}`);
  console.log(`  Dry run: ${DRY_RUN}`);
  console.log(`  Limit: ${LIMIT || 'No limit'}`);
  console.log('');

  // Check if shapefile exists
  if (!fs.existsSync(SHAPEFILE_PATH)) {
    console.error(`ERROR: Shapefile not found at ${SHAPEFILE_PATH}`);
    process.exit(1);
  }

  // Check Supabase configuration
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('ERROR: Missing Supabase configuration.');
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    console.error('');
    console.error('Example:');
    console.error('  $env:SUPABASE_URL="https://xxx.supabase.co"');
    console.error('  $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
    process.exit(1);
  }

  console.log('Reading shapefile...');
  
  let totalRead = 0;
  let totalFiltered = 0;
  let totalInserted = 0;
  let totalErrors = 0;
  let batch = [];

  try {
    const source = await shapefile.open(SHAPEFILE_PATH);
    
    while (true) {
      const result = await source.read();
      if (result.done) break;
      
      totalRead++;
      
      const feature = result.value;
      const transformed = transformFeature(feature);
      
      // Apply filters
      if (STATE_FILTER && transformed.state !== STATE_FILTER) {
        continue;
      }
      
      if (YEAR_FILTER && transformed.year !== YEAR_FILTER) {
        continue;
      }
      
      totalFiltered++;
      batch.push(transformed);
      
      // Check limit
      if (LIMIT && totalFiltered >= LIMIT) {
        console.log(`  Reached limit of ${LIMIT} records`);
        break;
      }
      
      // Insert batch
      if (batch.length >= BATCH_SIZE) {
        process.stdout.write(`\r  Processing... ${totalFiltered} records filtered (${totalInserted} inserted)`);
        const { success, errors } = await insertBatch(batch);
        totalInserted += success;
        totalErrors += errors;
        batch = [];
      }
    }
    
    // Insert remaining batch
    if (batch.length > 0) {
      const { success, errors } = await insertBatch(batch);
      totalInserted += success;
      totalErrors += errors;
    }
    
    console.log('\n');
    console.log('='.repeat(60));
    console.log('Import Complete');
    console.log('='.repeat(60));
    console.log(`  Total read from shapefile: ${totalRead}`);
    console.log(`  After filtering: ${totalFiltered}`);
    console.log(`  Successfully inserted: ${totalInserted}`);
    console.log(`  Errors: ${totalErrors}`);
    
  } catch (error) {
    console.error(`\nERROR: ${error.message}`);
    process.exit(1);
  }
}

// Run the import
importShapefiles().catch(console.error);
