import { useState } from "react";
import { useLocation } from "wouter";
import { Crosshair } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();

  const onTryForFree = () => {
    // Temporarily bypass login - go directly to dashboard
    setLocation("/dashboard");
    // setLocation("/login"); // Uncomment to re-enable login
  };

  const onLearnMore = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const onBookDemo = () => {
    // Add your demo booking logic here
    console.log('Book demo clicked');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md z-50 border-b border-blue-500/20 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center">
              <Crosshair className="h-8 w-8" style={{ color: '#486D8D' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#486D8D' }}>GameScope</h1>
              <p className="text-xs text-slate-400">AI Video Analysis</p>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-300 hover:text-blue-400 font-medium transition-colors">Features</a>
            <a href="#pricing" className="text-slate-300 hover:text-blue-400 font-medium transition-colors">Pricing</a>
            <a href="#testimonials" className="text-slate-300 hover:text-blue-400 font-medium transition-colors">Testimonials</a>
            <a href="#contact" className="text-slate-300 hover:text-blue-400 font-medium transition-colors">Contact</a>
            <button onClick={onBookDemo} className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-blue-500/40 transform hover:-translate-y-0.5 transition-all duration-300">
              Book Demo
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center relative bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
        {/* Background Effect */}
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-radial from-blue-500/10 to-transparent pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 grid md:grid-cols-2 gap-8 items-center relative z-10">
          {/* Hero Content */}
          <div className="text-center md:text-left">
            <div className="text-blue-400 font-semibold text-lg tracking-[0.2em] uppercase mb-4">
              Sports Technology
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent leading-tight">
              Where Every Player Gets Premier League Analysis
            </h1>
            <p className="text-slate-300 text-lg sm:text-xl mb-8 leading-relaxed">
              GameScope's AI platform transforms raw match footage into comprehensive performance analytics in minutes, not hours. 
              Already trusted by 10+ Premier League teams, we're democratizing professional-grade analysis.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-500/10 p-6 rounded-xl border border-blue-500/20 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">10+</div>
                <div className="text-slate-400 text-sm">Premier League Teams</div>
              </div>
              <div className="bg-blue-500/10 p-6 rounded-xl border border-blue-500/20 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">500K+</div>
                <div className="text-slate-400 text-sm">Hours Saved</div>
              </div>
              <div className="bg-blue-500/10 p-6 rounded-xl border border-blue-500/20 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">2M+</div>
                <div className="text-slate-400 text-sm">Players Analyzed</div>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button 
                onClick={onTryForFree} 
                className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl hover:shadow-blue-500/40 transform hover:-translate-y-1 transition-all duration-300"
                data-testid="button-try-free"
              >
                Try for Free
              </button>
              <button 
                onClick={onLearnMore} 
                className="border-2 border-blue-500 text-blue-400 px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-500 hover:text-white transform hover:-translate-y-1 transition-all duration-300"
                data-testid="button-learn-more"
              >
                Learn More
              </button>
            </div>
          </div>
          
          {/* Hero Visual */}
          <div className="flex flex-col items-center gap-8">
            <div className="bg-blue-500/10 p-8 rounded-3xl border-2 border-blue-500/30 text-center min-w-[200px] hover:scale-105 transition-transform duration-300">
              <div className="text-4xl mb-4">📹</div>
              <div className="text-xl font-bold text-blue-400 mb-2">CAPTURE</div>
              <p className="text-slate-300">Upload any match footage</p>
            </div>
            <div className="text-blue-400 text-3xl animate-bounce">↓</div>
            <div className="bg-blue-500/10 p-8 rounded-3xl border-2 border-blue-500/30 text-center min-w-[200px] hover:scale-105 transition-transform duration-300">
              <div className="text-4xl mb-4">🤖</div>
              <div className="text-xl font-bold text-blue-400 mb-2">ANALYZE</div>
              <p className="text-slate-300">Our AI does the rest</p>
            </div>
            <div className="text-blue-400 text-3xl animate-bounce">↓</div>
            <div className="bg-blue-500/10 p-8 rounded-3xl border-2 border-blue-500/30 text-center min-w-[200px] hover:scale-105 transition-transform duration-300">
              <div className="text-4xl mb-4">📊</div>
              <div className="text-xl font-bold text-blue-400 mb-2">DELIVER</div>
              <p className="text-slate-300">Instant insights & clips</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-gradient-to-br from-slate-800 to-slate-900 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Revolutionary AI Analysis
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Transform your team's performance with cutting-edge technology that sees what human eyes miss
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <div className="bg-blue-500/5 p-8 rounded-2xl border border-blue-500/20 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
              <div className="w-15 h-15 bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-2xl mb-6">⚽</div>
              <h3 className="text-2xl font-bold text-white mb-4">Smart Video Clipping</h3>
              <p className="text-slate-400 mb-6 leading-relaxed">
                Our AI automatically identifies and clips every significant moment in your match footage.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start text-slate-300">
                  <span className="text-blue-400 mr-3 font-bold">→</span>
                  Automatically clips every pass, shot, tackle, and key moment
                </li>
                <li className="flex items-start text-slate-300">
                  <span className="text-blue-400 mr-3 font-bold">→</span>
                  Records which foot was used for every touch
                </li>
                <li className="flex items-start text-slate-300">
                  <span className="text-blue-400 mr-3 font-bold">→</span>
                  Tracks player positioning and movement patterns
                </li>
              </ul>
            </div>
            
            <div className="bg-blue-500/5 p-8 rounded-2xl border border-blue-500/20 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
              <div className="w-15 h-15 bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-2xl mb-6">📊</div>
              <h3 className="text-2xl font-bold text-white mb-4">Advanced Analytics</h3>
              <p className="text-slate-400 mb-6 leading-relaxed">
                Get Premier League-level statistics and insights for every player and team performance.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start text-slate-300">
                  <span className="text-blue-400 mr-3 font-bold">→</span>
                  Heat maps and player movement tracking
                </li>
                <li className="flex items-start text-slate-300">
                  <span className="text-blue-400 mr-3 font-bold">→</span>
                  Pass completion rates and accuracy zones
                </li>
                <li className="flex items-start text-slate-300">
                  <span className="text-blue-400 mr-3 font-bold">→</span>
                  Possession statistics and tactical formations
                </li>
              </ul>
            </div>
            
            <div className="bg-blue-500/5 p-8 rounded-2xl border border-blue-500/20 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
              <div className="w-15 h-15 bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-2xl mb-6">⚡</div>
              <h3 className="text-2xl font-bold text-white mb-4">Instant Reports</h3>
              <p className="text-slate-400 mb-6 leading-relaxed">
                Generate comprehensive match reports in minutes, not hours of manual analysis.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start text-slate-300">
                  <span className="text-blue-400 mr-3 font-bold">→</span>
                  Automated highlight reels for social media
                </li>
                <li className="flex items-start text-slate-300">
                  <span className="text-blue-400 mr-3 font-bold">→</span>
                  Player performance summaries and ratings
                </li>
                <li className="flex items-start text-slate-300">
                  <span className="text-blue-400 mr-3 font-bold">→</span>
                  Tactical insights and improvement recommendations
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-r from-blue-500 to-blue-700 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Ready to Transform Your Team's Performance?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of coaches already using GameScope to unlock their team's potential
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={onTryForFree} 
              className="bg-white text-blue-700 px-8 py-4 rounded-full text-lg font-bold hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              data-testid="button-get-started"
            >
              Get Started Free
            </button>
            <button 
              onClick={onBookDemo} 
              className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-white hover:text-blue-700 transform hover:-translate-y-1 transition-all duration-300"
              data-testid="button-schedule-demo"
            >
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-16 border-t border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center">
          <div className="flex justify-center items-center gap-4 mb-8">
            <div className="w-12 h-12 flex items-center justify-center">
              <Crosshair className="h-8 w-8" style={{ color: '#486D8D' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#486D8D' }}>GameScope</h1>
              <p className="text-xs text-slate-400">AI Video Analysis</p>
            </div>
          </div>
          <p className="text-slate-400 mb-8">
            Democratizing professional-grade sports analysis with AI technology
          </p>
          <div className="flex justify-center gap-8 flex-wrap mb-8">
            <a href="mailto:info@gamescope.ai" className="text-blue-400 hover:text-blue-300 font-medium">info@gamescope.ai</a>
            <a href="tel:+1234567890" className="text-blue-400 hover:text-blue-300 font-medium">+1 (234) 567-890</a>
          </div>
          <p className="text-slate-500 text-sm">
            Powered by AI • Trusted by professionals • Built for teams of all levels
          </p>
        </div>
      </footer>

    </div>
  );
}