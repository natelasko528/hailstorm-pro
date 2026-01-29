import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Home, Calendar, DollarSign, Ruler, Phone, Mail, MessageSquare, Star, Download, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PropertiesPage() {
  const { id } = useParams()
  const [selectedImage, setSelectedImage] = useState(0)

  // Mock property data
  const property = {
    id: id || '1',
    owner_name: 'John Smith',
    address: '123 Main St',
    city: 'Milwaukee',
    state: 'WI',
    zip: '53202',
    phone: '(414) 555-0123',
    email: 'john.smith@email.com',
    lead_score: 92,
    status: 'new',
    property_type: 'Single Family',
    year_built: 2006,
    roof_age: 18,
    roof_type: 'Asphalt Shingle',
    square_footage: 2400,
    property_value: 325000,
    storm_date: '2024-01-15',
    hail_size: 1.75,
    severity: 3,
    damage_probability: 85,
    estimated_repair_cost: 12500,
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    ],
    notes: [
      { date: '2024-01-16', text: 'Initial contact attempt - left voicemail', author: 'Agent' },
      { date: '2024-01-17', text: 'Owner called back, interested in inspection', author: 'Agent' },
    ]
  }

  const handleCall = () => {
    toast.success('Opening dialer...')
  }

  const handleEmail = () => {
    toast.success('Opening email client...')
  }

  const handleSMS = () => {
    toast.success('Opening SMS...')
  }

  const handleGenerateReport = () => {
    toast.success('Generating property report...')
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Back Button */}
      <Link 
        to="/app/leads"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Leads
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Images Gallery */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="relative h-96 bg-gray-900">
              <img 
                src={property.images[selectedImage]} 
                alt="Property view"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 px-3 py-1 bg-black/70 text-white rounded-lg text-sm font-medium">
                {selectedImage + 1} / {property.images.length}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 p-4 bg-gray-50">
              {property.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative h-20 rounded-lg overflow-hidden border-2 transition ${
                    selectedImage === idx ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Property Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Property Details</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Property Type</p>
                  <p className="text-base font-semibold text-gray-900">{property.property_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Year Built</p>
                  <p className="text-base font-semibold text-gray-900">{property.year_built}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Square Footage</p>
                  <p className="text-base font-semibold text-gray-900">{property.square_footage.toLocaleString()} sq ft</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Property Value</p>
                  <p className="text-base font-semibold text-gray-900">${property.property_value.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Roof Type</p>
                  <p className="text-base font-semibold text-gray-900">{property.roof_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Roof Age</p>
                  <p className="text-base font-semibold text-gray-900">{property.roof_age} years</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Storm Date</p>
                  <p className="text-base font-semibold text-gray-900">{property.storm_date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Hail Size</p>
                  <p className="text-base font-semibold text-gray-900">{property.hail_size}"</p>
                </div>
              </div>
            </div>
          </div>

          {/* Damage Assessment */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Damage Assessment</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Damage Probability</p>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-3xl font-bold text-red-600">{property.damage_probability}%</p>
                <p className="text-xs text-gray-600 mt-1">High likelihood</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Severity Level</p>
                  <Star className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-purple-600">{property.severity}/4</p>
                <p className="text-xs text-gray-600 mt-1">Severe storm</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Est. Repair Cost</p>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600">${(property.estimated_repair_cost / 1000).toFixed(1)}K</p>
                <p className="text-xs text-gray-600 mt-1">Average estimate</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-1">Inspection Recommended</h4>
                  <p className="text-sm text-yellow-800">
                    Based on the {property.hail_size}" hail size and {property.roof_age} year old roof, 
                    we highly recommend scheduling an in-person inspection to assess potential damage.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Activity Timeline</h2>
            
            <div className="space-y-4">
              {property.notes.map((note, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    {idx < property.notes.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-200 my-1"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900">{note.author}</p>
                      <p className="text-sm text-gray-500">{note.date}</p>
                    </div>
                    <p className="text-gray-600">{note.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-gray-600 hover:text-blue-600 font-medium">
              + Add Note
            </button>
          </div>
        </div>

        {/* Sidebar - Right Column (1/3) */}
        <div className="space-y-6">
          {/* Owner Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Owner Information</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Name</p>
                <p className="text-base font-semibold text-gray-900">{property.owner_name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Address</p>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-900">
                    {property.address}<br />
                    {property.city}, {property.state} {property.zip}
                  </p>
                </div>
              </div>

              {property.phone && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone</p>
                  <a href={`tel:${property.phone}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    {property.phone}
                  </a>
                </div>
              )}

              {property.email && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <a href={`mailto:${property.email}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium break-all">
                    {property.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Lead Score */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
            <h3 className="text-lg font-bold mb-2">Lead Score</h3>
            <div className="text-5xl font-bold mb-2">{property.lead_score}</div>
            <p className="text-blue-100 text-sm">High priority lead</p>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs text-blue-100 mb-2">Score Factors:</p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>High damage probability</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Older roof ({property.roof_age} years)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Large hail size ({property.hail_size}")</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>High property value</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button 
                onClick={handleCall}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Call Owner
              </button>

              <button 
                onClick={handleEmail}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Send Email
              </button>

              <button 
                onClick={handleSMS}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Send SMS
              </button>

              <button 
                onClick={handleGenerateReport}
                className="w-full px-4 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Generate Report
              </button>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address + ' ' + property.city + ' ' + property.state)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                View on Maps
              </a>
            </div>
          </div>

          {/* Status Update */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Update Status</h3>
            
            <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-3">
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="appointment">Appointment Set</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>

            <button 
              onClick={() => toast.success('Status updated successfully!')}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              Update Status
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
