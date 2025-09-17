"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Head from 'next/head';

interface FeedbackPin {
  id: string;
  x: number;
  y: number;
  emoji?: string;
  severity?: string;
  comment?: string;
  timestamp: string;
}

interface FeedbackModalProps {
  x: number;
  y: number;
  onSubmit: (data: { emoji?: string; severity?: string; comment?: string }) => void;
  onCancel: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ x, y, onSubmit, onCancel }) => {
  const [emoji, setEmoji] = useState<string>('');
  const [severity, setSeverity] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const modalRef = useRef<HTMLDivElement>(null);

  const emojis = ['😀', '😐', '😢', '😡'];
  const severities = ['low', 'medium', 'high', 'critical'];

  // Calculate stable modal position with better edge handling
  const modalWidth = 350;
  const modalHeight = 400; // Increased height for delete button
  
  // Position modal above the click point by default
  let modalX = Math.max(10, Math.min(x - modalWidth / 2, window.innerWidth - modalWidth - 10));
  let modalY = Math.max(10, y - modalHeight - 15);
  
  // If modal would go above viewport, position it below the click point
  if (modalY < 10) {
    modalY = Math.min(y + 15, window.innerHeight - modalHeight - 10);
  }
  
  // Final bounds check for bottom edge
  if (modalY + modalHeight > window.innerHeight - 10) {
    modalY = window.innerHeight - modalHeight - 10;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ emoji, severity, comment });
  };

  // Prevent clicks inside modal from propagating
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-30 z-50"
      onClick={onCancel}
      data-modal="true"
    >
      <div
        ref={modalRef}
        className="absolute bg-white rounded-xl shadow-2xl border border-gray-200 p-6"
        style={{ 
          left: `${modalX}px`, 
          top: `${modalY}px`,
          width: `${modalWidth}px`,
          minHeight: `${modalHeight}px`
        }}
        onClick={handleModalClick}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Add Feedback</h3>
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Emoji Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Reaction</label>
            <div className="flex gap-2">
              {emojis.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(emoji === e ? '' : e)}
                  className={`text-2xl p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    emoji === e 
                      ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Severity Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">Select severity</option>
              {severities.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe the issue or suggestion..."
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200 text-sm"
            >
              🗑️ Delete
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Submit Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FeedbackPinDisplay: React.FC<{ pin: FeedbackPin; onClick: () => void }> = ({ pin, onClick }) => (
  <div
    data-pin="true"
    className="absolute w-8 h-8 bg-red-500 rounded-full border-3 border-white shadow-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform z-30 flex items-center justify-center"
    style={{ left: `${pin.x}px`, top: `${pin.y}px` }}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    title={`${pin.emoji || ''} ${pin.severity || ''} - ${pin.comment || 'No comment'}`}
  >
    <div className="text-white text-sm font-bold">
      {pin.emoji || '📍'}
    </div>
  </div>
);

export default function DemoPage() {
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);
  const [feedbackPins, setFeedbackPins] = useState<FeedbackPin[]>([]);
  const [selectedPin, setSelectedPin] = useState<FeedbackPin | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click events for pin placement
  const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!feedbackMode || !containerRef.current) return;
    
    // Check if the click is on a pin or modal (prevent placing pins on them)
    const target = e.target as HTMLElement;
    if (target.closest('[data-pin]') || target.closest('[data-modal]')) {
      return;
    }

    // Get precise coordinates relative to the container
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + window.scrollX;
    const y = e.clientY - rect.top + window.scrollY;
    
    setPendingPin({ x, y });
  }, [feedbackMode]);

  // Handle escape key to exit feedback mode
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFeedbackMode(false);
        setPendingPin(null);
        setSelectedPin(null);
      }
    };

    if (feedbackMode) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [feedbackMode]);

  const handleFeedbackSubmit = (data: { emoji?: string; severity?: string; comment?: string }) => {
    if (!pendingPin) return;

    const newPin: FeedbackPin = {
      id: `pin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: pendingPin.x,
      y: pendingPin.y,
      timestamp: new Date().toISOString(),
      ...data
    };

    setFeedbackPins(prev => [...prev, newPin]);
    setPendingPin(null);
    // Don't exit feedback mode - allow multiple pins
  };

  const handleFeedbackCancel = () => {
    setPendingPin(null);
  };

  const toggleFeedbackMode = () => {
    const newMode = !feedbackMode;
    setFeedbackMode(newMode);
    setPendingPin(null);
    setSelectedPin(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>FeedbackFlow Demo - Pin & Comment</title>
      </Head>

      {/* Demo Content */}
      <div
        ref={containerRef}
        className={`relative min-h-screen p-8 ${feedbackMode ? 'cursor-crosshair' : 'cursor-default'}`}
        style={{ userSelect: feedbackMode ? 'none' : 'auto' }}
        onClick={handleContainerClick}
      >
        {/* Header */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              FeedbackFlow Demo
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Experience the future of user feedback collection. Our intuitive platform allows you to gather precise, contextual feedback from your users with just a click.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Real-time feedback collection
              </div>
              <div className="flex items-center gap-2 text-blue-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Precise pin placement
              </div>
              <div className="flex items-center gap-2 text-purple-600">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Rich feedback data
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Click "Add Feedback" to enter pin mode, then click anywhere on this page to place feedback pins. You can place multiple pins and explore our feedback collection system.
            </p>
            
            {feedbackMode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 font-medium">
                  📍 Feedback Mode Active - Click anywhere on this page to place a feedback pin
                </p>
              </div>
            )}
          </div>

          {/* Sample UI Components */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Contact Form</h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    placeholder="Your message..."
                  />
                </div>
                <button
                  type="button"
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Product Features</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Easy Integration</h3>
                    <p className="text-gray-600">Quick setup with just a few lines of code</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Real-time Feedback</h3>
                    <p className="text-gray-600">Get instant feedback from your users</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Analytics Dashboard</h3>
                    <p className="text-gray-600">Track and analyze user feedback</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback History */}
          {feedbackPins.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Recent Feedback ({feedbackPins.length})
              </h2>
              <div className="space-y-3">
                {feedbackPins.slice(-5).map(pin => (
                  <div key={pin.id} className="border-l-4 border-indigo-500 pl-4 py-2 bg-gray-50 rounded-r">
                    <div className="flex items-center gap-2 mb-1">
                      {pin.emoji && <span className="text-xl">{pin.emoji}</span>}
                      {pin.severity && (
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          pin.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          pin.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          pin.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {pin.severity.toUpperCase()}
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        at ({Math.round(pin.x)}, {Math.round(pin.y)})
                      </span>
                    </div>
                    {pin.comment && (
                      <p className="text-gray-700">{pin.comment}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(pin.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Render Feedback Pins */}
        {feedbackPins.map(pin => (
          <FeedbackPinDisplay
            key={pin.id}
            pin={pin}
            onClick={() => setSelectedPin(pin)}
          />
        ))}

        {/* Feedback Modal */}
        {pendingPin && (
          <FeedbackModal
            x={pendingPin.x}
            y={pendingPin.y}
            onSubmit={handleFeedbackSubmit}
            onCancel={handleFeedbackCancel}
          />
        )}

        {/* Pin Details Modal */}
        {selectedPin && (
          <div className="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Feedback Details</h3>
                <button
                  onClick={() => setSelectedPin(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {selectedPin.emoji && <span className="text-3xl">{selectedPin.emoji}</span>}
                  {selectedPin.severity && (
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedPin.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      selectedPin.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      selectedPin.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedPin.severity.toUpperCase()}
                    </span>
                  )}
                </div>
                {selectedPin.comment && (
                  <div>
                    <p className="font-semibold text-gray-700 mb-1">Comment:</p>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedPin.comment}</p>
                  </div>
                )}
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <p className="mb-1">Position: ({Math.round(selectedPin.x)}, {Math.round(selectedPin.y)})</p>
                  <p>Created: {new Date(selectedPin.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPin(null)}
                className="w-full mt-6 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        {feedbackPins.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFeedbackPins([]);
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-700 transition-all text-sm font-medium"
          >
            Clear All ({feedbackPins.length})
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFeedbackMode();
          }}
          className={`px-6 py-3 rounded-full font-semibold transition-all transform hover:scale-105 shadow-lg ${
            feedbackMode
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {feedbackMode ? '✕ Cancel' : '📍 Add Feedback'}
        </button>
      </div>
    </div>
  );
}
