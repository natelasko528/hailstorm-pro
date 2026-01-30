/**
 * ArcGIS Service - Wisconsin Statewide Parcels API
 * 
 * Queries the free Wisconsin State Cartographer's Office parcel data
 * to find properties within storm path polygons.
 * 
 * API Endpoint: https://services3.arcgis.com/n6uYoouQZW75n5WI/arcgis/rest/services/Wisconsin_Statewide_Parcels/FeatureServer/0
 * 
 * Available Fields:
 * - OWNERNME1, OWNERNME2: Owner names
 * - SITEADRESS: Physical address
 * - PSTLADRESS: Mailing address
 * - LATITUDE, LONGITUDE: Coordinates
 * - CONAME: County name
 * - ESTFMKVALUE: Estimated fair market value
 * - CNTASSDVALUE: Total assessed value
 * - PROPCLASS: Property class
 */

const ARCGIS_BASE_URL = 'https://services3.arcgis.com/n6uYoouQZW75n5WI/arcgis/rest/services/Wisconsin_Statewide_Parcels/FeatureServer/0'

/**
 * Sanitize string for ArcGIS SQL queries to prevent SQL injection
 * Escapes single quotes and removes potentially dangerous characters
 */
function sanitizeForArcGIS(value: string): string {
  if (!value) return ''
  // Escape single quotes by doubling them (SQL standard)
  // Remove or escape other potentially dangerous characters
  return value
    .replace(/'/g, "''")           // Escape single quotes
    .replace(/;/g, '')             // Remove semicolons
    .replace(/--/g, '')            // Remove SQL comments
    .replace(/\/\*/g, '')          // Remove block comment start
    .replace(/\*\//g, '')          // Remove block comment end
    .replace(/\\/g, '')            // Remove backslashes
    .trim()
}

// Fields to retrieve from ArcGIS
const DEFAULT_OUT_FIELDS = [
  'OBJECTID',
  'STATEID',
  'OWNERNME1',
  'OWNERNME2', 
  'SITEADRESS',
  'PSTLADRESS',
  'PLACENAME',
  'ZIPCODE',
  'STATE',
  'CONAME',
  'LATITUDE',
  'LONGITUDE',
  'ESTFMKVALUE',
  'CNTASSDVALUE',
  'PROPCLASS',
  'GISACRES'
].join(',')

// Property data returned from ArcGIS
export interface ArcGISParcel {
  id: string           // OBJECTID
  stateId: string      // STATEID (unique parcel identifier)
  ownerName: string    // OWNERNME1
  ownerName2?: string  // OWNERNME2
  address: string      // SITEADRESS
  mailingAddress?: string // PSTLADRESS
  city: string         // PLACENAME
  state: string        // STATE
  zip: string          // ZIPCODE
  county: string       // CONAME
  latitude: number     // LATITUDE
  longitude: number    // LONGITUDE
  estimatedValue?: number // ESTFMKVALUE
  assessedValue?: number  // CNTASSDVALUE
  propertyClass?: string  // PROPCLASS
  acres?: number       // GISACRES
  geometry?: GeoJSON.Geometry // Parcel polygon
}

// Query options
export interface ParcelQueryOptions {
  // Spatial query - find parcels intersecting this geometry
  geometry?: GeoJSON.Geometry
  
  // Bounding box query [minX, minY, maxX, maxY]
  bbox?: [number, number, number, number]
  
  // Attribute filters
  county?: string
  propertyClass?: string  // 'Residential', 'Commercial', etc.
  minValue?: number
  maxValue?: number
  
  // Pagination
  limit?: number
  offset?: number
  
  // Return geometry
  returnGeometry?: boolean
}

// Convert ArcGIS feature to our format
function transformFeature(feature: {
  attributes: Record<string, unknown>
  geometry?: { rings?: number[][][] }
}): ArcGISParcel {
  const attrs = feature.attributes
  
  return {
    id: String(attrs.OBJECTID || ''),
    stateId: String(attrs.STATEID || ''),
    ownerName: String(attrs.OWNERNME1 || 'Unknown'),
    ownerName2: attrs.OWNERNME2 ? String(attrs.OWNERNME2) : undefined,
    address: String(attrs.SITEADRESS || 'No address'),
    mailingAddress: attrs.PSTLADRESS ? String(attrs.PSTLADRESS) : undefined,
    city: String(attrs.PLACENAME || ''),
    state: String(attrs.STATE || 'WI'),
    zip: String(attrs.ZIPCODE || ''),
    county: String(attrs.CONAME || ''),
    latitude: Number(attrs.LATITUDE) || 0,
    longitude: Number(attrs.LONGITUDE) || 0,
    estimatedValue: attrs.ESTFMKVALUE ? Number(attrs.ESTFMKVALUE) : undefined,
    assessedValue: attrs.CNTASSDVALUE ? Number(attrs.CNTASSDVALUE) : undefined,
    propertyClass: attrs.PROPCLASS ? String(attrs.PROPCLASS) : undefined,
    acres: attrs.GISACRES ? Number(attrs.GISACRES) : undefined,
    geometry: feature.geometry?.rings ? {
      type: 'Polygon',
      coordinates: feature.geometry.rings
    } as GeoJSON.Polygon : undefined
  }
}

// Build ArcGIS query URL
function buildQueryUrl(options: ParcelQueryOptions): string {
  const params = new URLSearchParams({
    f: 'json',
    outFields: DEFAULT_OUT_FIELDS,
    returnGeometry: String(options.returnGeometry ?? false),
    outSR: '4326', // WGS84
  })

  // Add result limit
  params.set('resultRecordCount', String(options.limit ?? 100))
  
  // Add offset for pagination
  if (options.offset) {
    params.set('resultOffset', String(options.offset))
  }

  // Build WHERE clause for attribute filters
  const whereClauses: string[] = []
  
  if (options.county) {
    // Sanitize county name to prevent SQL injection
    const sanitizedCounty = sanitizeForArcGIS(options.county.toUpperCase())
    whereClauses.push(`CONAME = '${sanitizedCounty}'`)
  }
  
  if (options.propertyClass) {
    // Sanitize property class to prevent SQL injection
    const sanitizedClass = sanitizeForArcGIS(options.propertyClass)
    whereClauses.push(`PROPCLASS LIKE '%${sanitizedClass}%'`)
  }
  
  if (options.minValue !== undefined) {
    whereClauses.push(`ESTFMKVALUE >= ${options.minValue}`)
  }
  
  if (options.maxValue !== undefined) {
    whereClauses.push(`ESTFMKVALUE <= ${options.maxValue}`)
  }

  // If no filters, use 1=1 (required by ArcGIS)
  params.set('where', whereClauses.length > 0 ? whereClauses.join(' AND ') : '1=1')

  // Spatial query
  if (options.geometry) {
    params.set('geometry', JSON.stringify(options.geometry))
    params.set('geometryType', 'esriGeometryPolygon')
    params.set('spatialRel', 'esriSpatialRelIntersects')
    params.set('inSR', '4326')
  } else if (options.bbox) {
    const [minX, minY, maxX, maxY] = options.bbox
    params.set('geometry', JSON.stringify({
      xmin: minX,
      ymin: minY,
      xmax: maxX,
      ymax: maxY,
      spatialReference: { wkid: 4326 }
    }))
    params.set('geometryType', 'esriGeometryEnvelope')
    params.set('spatialRel', 'esriSpatialRelIntersects')
    params.set('inSR', '4326')
  }

  return `${ARCGIS_BASE_URL}/query?${params.toString()}`
}

/**
 * Query parcels from Wisconsin ArcGIS service
 */
export async function queryParcels(options: ParcelQueryOptions = {}): Promise<{
  parcels: ArcGISParcel[]
  totalCount?: number
  exceededLimit: boolean
}> {
  const url = buildQueryUrl(options)
  
  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`ArcGIS API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (data.error) {
      throw new Error(`ArcGIS query error: ${data.error.message || JSON.stringify(data.error)}`)
    }
    
    const features = data.features || []
    const parcels = features.map(transformFeature)
    
    return {
      parcels,
      totalCount: data.count,
      exceededLimit: data.exceededTransferLimit ?? false
    }
  } catch (error) {
    console.error('ArcGIS query failed:', error)
    throw error
  }
}

/**
 * Find parcels within a storm path polygon
 * This is the main function for lead generation
 */
export async function findParcelsInStormPath(
  stormGeometry: GeoJSON.Geometry,
  options: Omit<ParcelQueryOptions, 'geometry'> = {}
): Promise<ArcGISParcel[]> {
  const result = await queryParcels({
    ...options,
    geometry: stormGeometry,
    returnGeometry: true,
    limit: options.limit ?? 500 // Default higher limit for storm queries
  })
  
  return result.parcels
}

/**
 * Get parcel details by state ID
 */
export async function getParcelByStateId(stateId: string): Promise<ArcGISParcel | null> {
  // Sanitize stateId to prevent SQL injection
  const sanitizedStateId = sanitizeForArcGIS(stateId)
  const url = `${ARCGIS_BASE_URL}/query?` + new URLSearchParams({
    f: 'json',
    outFields: DEFAULT_OUT_FIELDS,
    returnGeometry: 'true',
    outSR: '4326',
    where: `STATEID = '${sanitizedStateId}'`
  }).toString()
  
  try {
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.features && data.features.length > 0) {
      return transformFeature(data.features[0])
    }
    
    return null
  } catch (error) {
    console.error('Failed to get parcel by ID:', error)
    return null
  }
}

/**
 * Search parcels by address
 */
export async function searchParcelsByAddress(
  addressQuery: string,
  options: { limit?: number; county?: string } = {}
): Promise<ArcGISParcel[]> {
  // Sanitize address query and county to prevent SQL injection
  const sanitizedAddress = sanitizeForArcGIS(addressQuery.toUpperCase())
  const sanitizedCounty = options.county ? sanitizeForArcGIS(options.county.toUpperCase()) : ''
  
  const whereClause = sanitizedCounty 
    ? `SITEADRESS LIKE '%${sanitizedAddress}%' AND CONAME = '${sanitizedCounty}'`
    : `SITEADRESS LIKE '%${sanitizedAddress}%'`
  
  const params = new URLSearchParams({
    f: 'json',
    outFields: DEFAULT_OUT_FIELDS,
    returnGeometry: 'true',
    outSR: '4326',
    resultRecordCount: String(options.limit ?? 50),
    where: whereClause
  })
  
  const url = `${ARCGIS_BASE_URL}/query?${params.toString()}`
  
  try {
    const response = await fetch(url)
    const data = await response.json()
    
    return (data.features || []).map(transformFeature)
  } catch (error) {
    console.error('Address search failed:', error)
    return []
  }
}

/**
 * Get count of parcels in a geometry (for UI feedback)
 */
export async function countParcelsInGeometry(geometry: GeoJSON.Geometry): Promise<number> {
  const params = new URLSearchParams({
    f: 'json',
    returnCountOnly: 'true',
    geometry: JSON.stringify(geometry),
    geometryType: 'esriGeometryPolygon',
    spatialRel: 'esriSpatialRelIntersects',
    inSR: '4326',
    where: '1=1'
  })
  
  const url = `${ARCGIS_BASE_URL}/query?${params.toString()}`
  
  try {
    const response = await fetch(url)
    const data = await response.json()
    return data.count || 0
  } catch (error) {
    console.error('Count query failed:', error)
    return 0
  }
}

export const arcgisService = {
  queryParcels,
  findParcelsInStormPath,
  getParcelByStateId,
  searchParcelsByAddress,
  countParcelsInGeometry
}
