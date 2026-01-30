import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CloudRain, Target, Zap, TrendingUp, Shield, Users, CheckCircle2, ArrowRight, Menu, X, Star } from 'lucide-react'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-lg border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <CloudRain className="w-8 h-8 text-blue-400" />
              <span className="text-xl font-bold text-white">HailStorm Pro</span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-300 hover:text-white transition">Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition">How It Works</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition">Pricing</a>
              <Link to="/app" className="text-gray-300 hover:text-white transition">Sign In</Link>
              <Link to="/app" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition">
                Start Free Trial
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-800 border-t border-white/10">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-gray-300 hover:text-white transition">Features</a>
              <a href="#how-it-works" className="block text-gray-300 hover:text-white transition">How It Works</a>
              <a href="#pricing" className="block text-gray-300 hover:text-white transition">Pricing</a>
              <Link to="/app" className="block text-gray-300 hover:text-white transition">Sign In</Link>
              <Link to="/app" className="block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-center transition">
                Start Free Trial
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              Automated Lead Generation for Roofing Contractors
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Turn Storm Data Into
              <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Roofing Leads
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Automatically identify properties damaged by hail storms, score leads with AI, and close more deals. Get qualified leads delivered to your inbox daily.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link 
                to="/app" 
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition inline-flex items-center justify-center gap-2 group"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </Link>
              <a 
                href="#how-it-works" 
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold text-lg transition border border-white/20"
              >
                See How It Works
              </a>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>14-day free trial</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Stats */}
          <div className="mt-16 relative">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold text-white mb-2">10,000+</div>
                  <div className="text-gray-400">Properties Identified</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-white mb-2">85%</div>
                  <div className="text-gray-400">Lead Accuracy</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-white mb-2">3x</div>
                  <div className="text-gray-400">More Appointments</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need to Dominate Storm Season
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              From storm tracking to lead scoring, we automate the entire process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: CloudRain,
                title: 'Real-Time Storm Tracking',
                description: 'Automatic NOAA data integration tracks hail storms as they happen. Get alerts the moment a storm hits your territory.',
                color: 'blue'
              },
              {
                icon: Target,
                title: 'Property Identification',
                description: 'Our AI identifies every residential property within storm zones. No more manual searches or guesswork.',
                color: 'purple'
              },
              {
                icon: TrendingUp,
                title: 'AI Lead Scoring',
                description: 'Machine learning scores each lead 0-100 based on damage severity, roof age, property value, and more.',
                color: 'green'
              },
              {
                icon: Zap,
                title: 'Automated Outreach',
                description: 'Integrate with GoHighLevel for automatic SMS and email campaigns. Set it and forget it.',
                color: 'yellow'
              },
              {
                icon: Shield,
                title: 'Skip Tracing Built-In',
                description: 'Automatically find owner contact info with integrated skip tracing. Get phone numbers and emails instantly.',
                color: 'red'
              },
              {
                icon: Users,
                title: 'Team Collaboration',
                description: 'Assign leads to team members, track progress, and manage your entire sales pipeline in one place.',
                color: 'cyan'
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition group"
              >
                <div className={`w-12 h-12 bg-${feature.color}-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                  <feature.icon className={`w-6 h-6 text-${feature.color}-400`} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              From storm to sale in four simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Storm Detected',
                description: 'We track NOAA storm data 24/7 and alert you when hail hits your service area'
              },
              {
                step: '02',
                title: 'Properties Found',
                description: 'AI identifies all residential properties within the storm polygon boundaries'
              },
              {
                step: '03',
                title: 'Leads Scored',
                description: 'Machine learning scores each property based on damage likelihood and value'
              },
              {
                step: '04',
                title: 'Automatic Outreach',
                description: 'Leads are automatically contacted via SMS/email with your custom messaging'
              }
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-blue-500/20 mb-4">{step.step}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
                {index < 3 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-500/50 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Choose the plan that fits your business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: '$99',
                description: 'Perfect for solo contractors',
                features: [
                  '500 leads per month',
                  'Real-time storm tracking',
                  'AI lead scoring',
                  'Email support',
                  'Basic analytics'
                ],
                highlighted: false
              },
              {
                name: 'Professional',
                price: '$249',
                description: 'For growing roofing companies',
                features: [
                  '2,000 leads per month',
                  'Everything in Starter',
                  'Automated outreach',
                  'Skip tracing included',
                  'Priority support',
                  'Team collaboration',
                  'Advanced analytics'
                ],
                highlighted: true
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                description: 'For large operations',
                features: [
                  'Unlimited leads',
                  'Everything in Professional',
                  'White-label options',
                  'Dedicated account manager',
                  'Custom integrations',
                  'API access'
                ],
                highlighted: false
              }
            ].map((plan, index) => (
              <div 
                key={index}
                className={`relative rounded-2xl p-8 ${
                  plan.highlighted 
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-2 border-blue-400 transform scale-105' 
                    : 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-yellow-400 text-slate-900 text-sm font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className={`text-sm ${plan.highlighted ? 'text-blue-100' : 'text-gray-400'} mb-4`}>
                    {plan.description}
                  </p>
                  <div className="text-5xl font-bold text-white mb-2">
                    {plan.price}
                    {plan.price !== 'Custom' && <span className="text-lg font-normal text-gray-400">/mo</span>}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${plan.highlighted ? 'text-blue-200' : 'text-green-400'}`} />
                      <span className={plan.highlighted ? 'text-blue-100' : 'text-gray-300'}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/app"
                  className={`block w-full py-3 rounded-lg font-semibold text-center transition ${
                    plan.highlighted
                      ? 'bg-white text-blue-600 hover:bg-gray-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plan.price === 'Custom' ? 'Contact Sales' : 'Start Free Trial'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Loved by Roofing Contractors
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              See what our customers have to say
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Mike Thompson',
                company: 'Thompson Roofing',
                image: '👨‍💼',
                rating: 5,
                text: 'HailStorm Pro tripled our lead volume overnight. The AI scoring is incredibly accurate - we\'re closing deals faster than ever.'
              },
              {
                name: 'Sarah Chen',
                company: 'Elite Roofing Solutions',
                image: '👩‍💼',
                rating: 5,
                text: 'Best investment we\'ve made. The automated outreach saves us 20+ hours per week. Our ROI in month one was 5x.'
              },
              {
                name: 'David Rodriguez',
                company: 'Storm Chasers LLC',
                image: '👨',
                rating: 5,
                text: 'Game changer for storm season. We went from manually searching for leads to having qualified prospects calling us.'
              }
            ].map((testimonial, index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6">&ldquo;{testimonial.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-2xl">
                    {testimonial.image}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Lead Generation?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of roofing contractors who are closing more deals with HailStorm Pro
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/app" 
              className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition inline-flex items-center justify-center gap-2 group"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </Link>
          </div>
          <p className="text-blue-100 mt-6 text-sm">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Terms</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <CloudRain className="w-6 h-6 text-blue-400" />
              <span className="text-white font-semibold">HailStorm Pro</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2024 HailStorm Pro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
