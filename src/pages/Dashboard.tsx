import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Calendar, DollarSign, CloudRain, MapPin, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { stormService } from '../lib/stormService'
import { leadService } from '../lib/leadService'

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalLeads: 0,
    activeStorms: 0,
    appointments: 0,
    revenue: 0
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [leadsByStatus, setLeadsByStatus] = useState<Record<string, number>>({})
  const [stormsByMonth, setStormsByMonth] = useState<{ month: string; count: number }[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch real data from Supabase
      const [stormStats, leadStats, recentLeads, recentStorms] = await Promise.all([
        stormService.getStats(),
        leadService.getStats(),
        leadService.getLeads({ limit: 10 }),
        stormService.getStorms({ limit: 5 })
      ])

      // Calculate revenue (avg $15k per won deal)
      const avgDeal = 15000
      const revenue = leadStats.won * avgDeal

      setStats({
        totalLeads: leadStats.total,
        activeStorms: stormStats.recent,
        appointments: Math.floor(leadStats.qualified * 0.6), // Estimate
        revenue
      })

      // Build activity feed
      const activities: any[] = []
      
      recentLeads.slice(0, 5).forEach(lead => {
        activities.push({
          type: 'lead',
          title: `New lead: ${lead.owner_name}`,
          subtitle: `${lead.city}, ${lead.state} - Score: ${lead.lead_score}`,
          time: new Date(lead.created_at).toLocaleString(),
          icon: Users
        })
      })

      recentStorms.slice(0, 3).forEach(storm => {
        activities.push({
          type: 'storm',
          title: storm.name,
          subtitle: `${storm.county}, ${storm.state} - ${storm.magnitude || 'N/A'}" hail`,
          time: new Date(storm.date).toLocaleDateString(),
          icon: CloudRain
        })
      })

      // Aggregate leads by status
      const allLeads = await leadService.getLeads({ limit: 1000 })
      const statusCounts: Record<string, number> = {}
      allLeads.forEach((lead: any) => {
        const status = lead.status || 'new'
        statusCounts[status] = (statusCounts[status] || 0) + 1
      })
      setLeadsByStatus(statusCounts)

      // Aggregate storms by month
      const monthCounts: Record<string, number> = {}
      const allStorms = await stormService.getStorms({ limit: 1000 })
      allStorms.forEach((storm: any) => {
        const date = new Date(storm.date)
        const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1
      })
      const sortedMonths = Object.entries(monthCounts)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      setStormsByMonth(sortedMonths)

      setRecentActivity(activities.slice(0, 8))
      setLoading(false)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard data. Check Supabase connection.')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const statCards = [
    { 
      label: 'Total Leads', 
      value: stats.totalLeads.toLocaleString(), 
      change: '+12%', 
      trend: 'up',
      icon: Users, 
      color: 'blue',
      bgColor: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    { 
      label: 'Active Storms', 
      value: stats.activeStorms.toString(), 
      change: '+3', 
      trend: 'up',
      icon: CloudRain, 
      color: 'orange',
      bgColor: 'bg-orange-500',
      lightBg: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    { 
      label: 'Appointments', 
      value: stats.appointments.toString(), 
      change: '+8%', 
      trend: 'up',
      icon: Calendar, 
      color: 'green',
      bgColor: 'bg-green-500',
      lightBg: 'bg-green-50',
      textColor: 'text-green-600'
    },
    { 
      label: 'Est. Revenue', 
      value: `$${(stats.revenue / 1000).toFixed(1)}K`, 
      change: '+15%', 
      trend: 'up',
      icon: DollarSign, 
      color: 'emerald',
      bgColor: 'bg-emerald-500',
      lightBg: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's what's happening.</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          const TrendIcon = stat.trend === 'up' ? ArrowUp : ArrowDown
          
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.lightBg} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                <span className={`flex items-center text-sm font-semibold ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendIcon className="w-4 h-4 mr-1" />
                  {stat.change}
                </span>
              </div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">{stat.label}</h3>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Pipeline Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Lead Pipeline</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              layout="vertical"
              data={[
                { status: 'New', count: leadsByStatus['new'] || 0, fill: '#3B82F6' },
                { status: 'Contacted', count: leadsByStatus['contacted'] || 0, fill: '#8B5CF6' },
                { status: 'Qualified', count: leadsByStatus['qualified'] || 0, fill: '#F59E0B' },
                { status: 'Appointment', count: leadsByStatus['appointment'] || 0, fill: '#10B981' },
                { status: 'Won', count: leadsByStatus['won'] || 0, fill: '#22C55E' },
                { status: 'Lost', count: leadsByStatus['lost'] || 0, fill: '#EF4444' },
              ]}
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="status" type="category" width={90} />
              <Tooltip />
              <Bar dataKey="count" name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Storm Activity Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Storm Activity</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stormsByMonth} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="count" name="Storms" stroke="#F97316" fill="#FDBA74" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <Link to="/leads" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View all
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => {
                const Icon = activity.icon
                return (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`${activity.type === 'lead' ? 'bg-blue-100' : 'bg-orange-100'} p-2 rounded-lg`}>
                      <Icon className={`w-5 h-5 ${activity.type === 'lead' ? 'text-blue-600' : 'text-orange-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.subtitle}</p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{activity.time}</span>
                  </div>
                )
              })
            ) : (
              <p className="text-center text-gray-500 py-8">No recent activity</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/storms"
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <CloudRain className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                <span className="font-medium text-gray-900">View Storms</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
            </Link>
            
            <Link
              to="/leads"
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                <span className="font-medium text-gray-900">Manage Leads</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
            </Link>
            
            <Link
              to="/properties"
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                <span className="font-medium text-gray-900">View Properties</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
