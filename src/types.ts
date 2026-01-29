export interface Storm {
  id: number;
  name: string;
  date: string;
  hail_size: number;
  affected_properties: number;
  estimated_damage: number;
  latitude: number;
  longitude: number;
  severity: 'low' | 'medium' | 'high' | 'severe';
}

export interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  roof_age: number;
  roof_type: string;
  square_footage: number;
  estimated_damage: number;
  status: 'pending' | 'contacted' | 'qualified' | 'converted';
}

export interface Lead {
  id: number;
  property_id: number;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source: string;
  created_at: string;
  notes: string;
}
