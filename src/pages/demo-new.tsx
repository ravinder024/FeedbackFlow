"use client";
import React from 'react';
import Head from 'next/head';
import FeedbackCollector from '@/components/feedback/FeedbackCollector';

interface FeedbackData {
  x: number;
  y: number;
  emoji?: string;
  severity?: string;
  comment?: string;
  pageUrl?: string;
}

export default function DemoNew() {
  const handleFeedbackSubmit = (feedback: FeedbackData) => {
    console.log('Feedback submitted:', feedback);
    // Here you would typically send the feedback to your API
    // Removed the alert to improve user experience
  };

  return (
    <>
      <Head>
        <title>FeedbackFlow - Advanced Feedback Demo</title>
        <meta name="description" content="Experience our advanced feedback collection system" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Modern SaaS Landing Page */}
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        
        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">FF</span>
                </div>
                <span className="text-xl font-bold text-gray-900">FeedbackFlow</span>
              </div>
              
              <div className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-gray-600 hover:text-indigo-600 transition-colors">Features</a>
                <a href="#demo" className="text-gray-600 hover:text-indigo-600 transition-colors">Demo</a>
                <a href="#pricing" className="text-gray-600 hover:text-indigo-600 transition-colors">Pricing</a>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Collect Feedback
              <span className="block text-indigo-600">Like Never Before</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Empower your users to provide contextual feedback directly on your interface. 
              Get precise insights with visual annotations, comments, and collaborative discussions.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <button className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 transform hover:scale-105 transition-all shadow-lg">
                Try Interactive Demo
              </button>
              <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-indigo-600 hover:text-indigo-600 transition-all">
                Watch Demo Video
              </button>
            </div>
          </div>
        </section>

        {/* Interactive Demo Section */}
        <section id="demo" className="py-16 bg-white/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Interactive Demo</h2>
              <p className="text-xl text-gray-600">
                Click anywhere on this page to experience our feedback system in action!
              </p>
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-100 rounded-full">
                <span className="text-indigo-800 font-medium">
                  👆 Click the "Add Feedback" button to get started
                </span>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Precise Targeting</h3>
                <p className="text-gray-600">
                  Pin feedback directly to specific elements with pixel-perfect accuracy. 
                  No more guessing what users are talking about.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Rich Comments</h3>
                <p className="text-gray-600">
                  Threaded conversations like Figma and Jira. Add context, ask questions, 
                  and collaborate seamlessly with your team.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-time Sync</h3>
                <p className="text-gray-600">
                  Feedback updates instantly across all team members. Stay in sync 
                  and never miss important user insights.
                </p>
              </div>
            </div>

            {/* Demo Content Area */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 relative overflow-hidden">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                
                {/* Left Content */}
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">
                    Experience the Power of Visual Feedback
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-indigo-600 font-bold text-sm">1</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Click to Add Feedback</h4>
                        <p className="text-gray-600">Click the floating "Add Feedback" button to enter feedback mode.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-indigo-600 font-bold text-sm">2</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Pin Anywhere</h4>
                        <p className="text-gray-600">Click anywhere on the interface to place a feedback pin with precision.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-indigo-600 font-bold text-sm">3</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Rich Interactions</h4>
                        <p className="text-gray-600">Add emotions, severity levels, comments, and engage in threaded discussions.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-indigo-600 font-bold text-sm">4</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Edit & Collaborate</h4>
                        <p className="text-gray-600">Click existing pins to edit, add comments, or delete. Perfect for team collaboration.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Visual */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
                    <h4 className="text-2xl font-bold mb-4">Sample Interface</h4>
                    <p className="text-indigo-100 mb-6">
                      This represents any web application where you'd want to collect feedback. 
                      Try clicking anywhere in this demo area!
                    </p>
                    
                    <div className="space-y-4">
                      <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-4 h-4 bg-white/40 rounded"></div>
                          <div className="w-24 h-3 bg-white/40 rounded"></div>
                        </div>
                        <div className="w-full h-2 bg-white/30 rounded mb-2"></div>
                        <div className="w-3/4 h-2 bg-white/30 rounded"></div>
                      </div>

                      <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-4 h-4 bg-white/40 rounded"></div>
                          <div className="w-32 h-3 bg-white/40 rounded"></div>
                        </div>
                        <div className="w-full h-2 bg-white/30 rounded mb-2"></div>
                        <div className="w-2/3 h-2 bg-white/30 rounded"></div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-1 bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                          <div className="w-full h-8 bg-white/30 rounded"></div>
                        </div>
                        <div className="flex-1 bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                          <div className="w-full h-8 bg-white/30 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decorative elements */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-200 rounded-full opacity-20"></div>
                  <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-200 rounded-full opacity-20"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-indigo-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Feedback Process?
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              Join thousands of teams already using FeedbackFlow to build better products through visual collaboration.
            </p>
            <button className="bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transform hover:scale-105 transition-all shadow-lg">
              Start Free Trial
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">FF</span>
                  </div>
                  <span className="text-xl font-bold">FeedbackFlow</span>
                </div>
                <p className="text-gray-400">
                  Empowering teams with visual feedback collection and collaborative insights.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Product</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Support</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2024 FeedbackFlow. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Universal Feedback Widget */}
      <FeedbackCollector 
        onFeedbackSubmit={handleFeedbackSubmit}
        pageUrl={typeof window !== 'undefined' ? window.location.href : ''}
      />
    </>
  );
}
