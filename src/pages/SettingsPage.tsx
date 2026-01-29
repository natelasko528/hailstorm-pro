import { useState } from 'react'
import { User, Bell, Lock, CreditCard, Mail, MapPin, Building, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [newStormAlerts, setNewStormAlerts] = useState(true)
  const [leadUpdates, setLeadUpdates] = useState(true)

  const handleSave = () => {
    toast.success('Settings saved successfully!')
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'integrations', label: 'Integrations', icon: Mail },
  ]

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account preferences and settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                      JS
                    </div>
                    <div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                        Change Photo
                      </button>
                      <p className="text-sm text-gray-500 mt-2">JPG, PNG or GIF. Max size 2MB</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        defaultValue="John"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        defaultValue="Smith"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        defaultValue="john.smith@email.com"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        defaultValue="(414) 555-0123"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        defaultValue="Smith Roofing LLC"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Address
                      </label>
                      <input
                        type="text"
                        defaultValue="456 Oak Ave, Milwaukee, WI 53202"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button onClick={handleSave} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Notification Preferences</h2>
                
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">New Storm Alerts</p>
                          <p className="text-sm text-gray-500">Get notified when a hail storm is detected in your area</p>
                        </div>
                        <button
                          onClick={() => setNewStormAlerts(!newStormAlerts)}
                          className={`relative w-12 h-6 rounded-full transition ${
                            newStormAlerts ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition ${
                            newStormAlerts ? 'right-0.5' : 'left-0.5'
                          }`}></span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Lead Updates</p>
                          <p className="text-sm text-gray-500">Receive updates when lead status changes</p>
                        </div>
                        <button
                          onClick={() => setLeadUpdates(!leadUpdates)}
                          className={`relative w-12 h-6 rounded-full transition ${
                            leadUpdates ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition ${
                            leadUpdates ? 'right-0.5' : 'left-0.5'
                          }`}></span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Weekly Reports</p>
                          <p className="text-sm text-gray-500">Get a weekly summary of your leads and activity</p>
                        </div>
                        <button
                          onClick={() => setEmailNotifications(!emailNotifications)}
                          className={`relative w-12 h-6 rounded-full transition ${
                            emailNotifications ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition ${
                            emailNotifications ? 'right-0.5' : 'left-0.5'
                          }`}></span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">SMS Notifications</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Urgent Storm Alerts</p>
                          <p className="text-sm text-gray-500">Text messages for severe storms only</p>
                        </div>
                        <button
                          onClick={() => setSmsNotifications(!smsNotifications)}
                          className={`relative w-12 h-6 rounded-full transition ${
                            smsNotifications ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition ${
                            smsNotifications ? 'right-0.5' : 'left-0.5'
                          }`}></span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={handleSave} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Settings</h2>
                
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                    
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>

                      <button onClick={handleSave} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
                        Update Password
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>
                    <p className="text-gray-600 mb-4">Add an extra layer of security to your account</p>
                    <button className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Billing & Subscription</h2>
                
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Professional Plan</h3>
                        <p className="text-gray-600">$249/month</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Active
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>✓ 2,000 leads per month</p>
                      <p>✓ Automated outreach</p>
                      <p>✓ Skip tracing included</p>
                      <p>✓ Priority support</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <p className="text-sm text-gray-600">Next billing date: February 15, 2024</p>
                    </div>
                  </div>

                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-6 h-6 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
                            <p className="text-sm text-gray-500">Expires 12/2025</p>
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                          Update
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h3>
                    
                    <div className="space-y-3">
                      {[
                        { date: 'Jan 15, 2024', amount: '$249.00', status: 'Paid' },
                        { date: 'Dec 15, 2023', amount: '$249.00', status: 'Paid' },
                        { date: 'Nov 15, 2023', amount: '$249.00', status: 'Paid' },
                      ].map((invoice, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{invoice.date}</p>
                            <p className="text-sm text-gray-500">Professional Plan</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-gray-900">{invoice.amount}</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                              {invoice.status}
                            </span>
                            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Integrations</h2>
                
                <div className="space-y-4">
                  {[
                    { name: 'GoHighLevel', description: 'CRM and marketing automation', connected: true, logo: '🚀' },
                    { name: 'Mailchimp', description: 'Email marketing platform', connected: false, logo: '📧' },
                    { name: 'Zapier', description: 'Connect with 3,000+ apps', connected: false, logo: '⚡' },
                    { name: 'Stripe', description: 'Payment processing', connected: true, logo: '💳' },
                  ].map((integration, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                          {integration.logo}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{integration.name}</h4>
                          <p className="text-sm text-gray-500">{integration.description}</p>
                        </div>
                      </div>
                      <button
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          integration.connected
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {integration.connected ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
