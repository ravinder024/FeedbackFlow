import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';

export default function TestingGuide() {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: 'Access Your Test Group',
      description: 'Navigate to the Test Groups page and select the test group you want to provide feedback for.',
      icon: '🔍'
    },
    {
      id: 2,
      title: 'Start a Testing Session',
      description: 'Click on "Start Testing" to begin a new testing session. This will activate the feedback collection tool.',
      icon: '▶️'
    },
    {
      id: 3,
      title: 'Navigate the Website',
      description: 'Browse the website you are testing as you normally would. Look for areas that could be improved or features that stand out.',
      icon: '🖱️'
    },
    {
      id: 4,
      title: 'Provide Feedback',
      description: 'When you find something to comment on, click the feedback button in the corner of your screen, select the element, and provide your comments.',
      icon: '💬'
    },
    {
      id: 5,
      title: 'Rate Your Experience',
      description: 'For each piece of feedback, rate your experience using the emotion selector to indicate how the feature made you feel.',
      icon: '😊'
    },
    {
      id: 6,
      title: 'Submit Multiple Feedback',
      description: 'Continue exploring the site and submit feedback for different elements and pages throughout your session.',
      icon: '🔄'
    },
    {
      id: 7,
      title: 'End Your Session',
      description: 'When you\'re finished testing, click the "End Session" button to complete your testing session.',
      icon: '✅'
    }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-indigo-600 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold">Testing Guide</h1>
            <p className="mt-2 text-indigo-100">
              Learn how to provide effective feedback to improve products and websites
            </p>
          </div>

          <div className="p-6">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Step-by-Step Testing Process</h2>
              
              <div className="flex flex-col space-y-4">
                {steps.map((step) => (
                  <div 
                    key={step.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      activeStep === step.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                    }`}
                    onClick={() => setActiveStep(step.id)}
                  >
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                        activeStep === step.id ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <span className="text-lg">{step.icon}</span>
                      </div>
                      <div className="ml-4">
                        <h3 className={`text-lg font-medium ${
                          activeStep === step.id ? 'text-indigo-700' : 'text-gray-900'
                        }`}>
                          {step.id}. {step.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">{step.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Feedback Best Practices</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800">Be Specific</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Describe exactly what you experienced and provide details about the context.
                  </p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800">Be Constructive</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Suggest improvements rather than just pointing out problems.
                  </p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800">Be Objective</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Focus on facts rather than personal opinions when possible.
                  </p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800">Be Thorough</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Test multiple paths and scenarios to provide comprehensive feedback.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Try a Demo Test</h2>
              <p className="text-gray-600 mb-6">
                Ready to practice? Try our demo testing environment to get familiar with the feedback tool before your first real testing session.
              </p>
              
              <Link 
                href="/demo-test"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Start Demo Test
              </Link>
            </div>

            {/* ── Event Tracking Sandbox ───────────────────────────────── */}
            <div className="mt-10 border-t border-gray-200 pt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Event Tracking Sandbox</h2>
              <p className="text-sm text-gray-500 mb-6">
                Use these buttons to verify dead click and rage click detection. Check the browser console for generated issues.
              </p>

              <div className="flex flex-wrap gap-4">
                {/* Dead click: no onClick — ClickTracker detects no DOM response after 400ms */}
                <button
                  data-testid="test-dead-click"
                  type="button"
                  className="px-6 py-3 rounded-md border-2 border-red-400 bg-red-50 text-red-700 font-medium hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  Test Dead Click
                </button>

                {/* Rage click: no onClick — click 3+ times quickly to trigger rage_click */}
                <button
                  data-testid="test-rage-click"
                  type="button"
                  className="px-6 py-3 rounded-md border-2 border-orange-400 bg-orange-50 text-orange-700 font-medium hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  Test Rage Click
                </button>
              </div>

              <p className="mt-4 text-xs text-gray-400">
                Dead Click: click once and wait ~400 ms — a <code>dead_click</code> event should appear in the console.
                Rage Click: click 3+ times rapidly — a <code>rage_click</code> event should appear in the console.
              </p>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 