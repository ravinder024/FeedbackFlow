"use client";
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

interface Comment {
  id: string;
  text: string;
  timestamp: Date;
  author?: string;
}

interface FeedbackPin {
  id: string;
  x: number;
  y: number;
  emoji?: string;
  severity?: string;
  comment?: string; // Keep as comment for backward compatibility
  comments: Comment[];
  pageUrl?: string;
  testGroupId?: string;
  domain?: string;
  timestamp: Date;
}

interface FeedbackData {
  x: number;
  y: number;
  emoji?: string;
  severity?: string;
  comment?: string; // Keep as comment for backward compatibility
  pageUrl?: string;
  testGroupId?: string;
  domain?: string;
}

interface FeedbackCollectorProps {
  onFeedbackSubmit: (feedback: FeedbackData) => void;
  pageUrl?: string;
  testGroupId?: string;
  domain?: string;
}

interface FeedbackModalProps {
  x: number;
  y: number;
  pin?: FeedbackPin;
  onSubmit: (data: { emoji?: string; severity?: string; comment?: string }) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onAddComment?: (comment: string) => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ 
  x, y, pin, onSubmit, onCancel, onDelete, onAddComment 
}) => {
  const [emoji, setEmoji] = useState<string>(pin?.emoji || '');
  const [severity, setSeverity] = useState<string>(pin?.severity || '');
  const [comment, setComment] = useState<string>(pin?.comment || ''); // Internal state for description
  const [newComment, setNewComment] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'feedback' | 'comments'>('feedback');

  const emojis = ['😀', '😐', '😢', '😡'];
  const severities = ['low', 'medium', 'high', 'critical'];

  // Enhanced responsive positioning with better viewport handling
  const [modalDimensions, setModalDimensions] = useState({ width: 400, height: pin ? 600 : 400 });
  
  useEffect(() => {
    const updateDimensions = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Responsive width based on viewport
      let width = 400;
      if (viewportWidth < 480) width = viewportWidth - 32; // Mobile: full width minus padding
      else if (viewportWidth < 768) width = Math.min(380, viewportWidth - 64); // Tablet: constrained
      
      // Responsive height
      let height = pin ? 600 : 400;
      if (viewportHeight < 700) height = Math.min(height, viewportHeight - 100);
      
      setModalDimensions({ width, height });
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [pin]);

  const { width: modalWidth, height: modalHeight } = modalDimensions;
  
  // Convert document coordinates to viewport coordinates for modal positioning
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;
  
  let left = (x - scrollX) - modalWidth / 2;
  let top = (y - scrollY) - modalHeight - 20;

  // Keep modal in viewport with better boundary detection
  const padding = 20;
  if (left < padding) left = padding;
  if (left + modalWidth > window.innerWidth - padding) {
    left = window.innerWidth - modalWidth - padding;
  }
  
  // If modal would go off top, position it below the click point
  if (top < padding) {
    top = (y - scrollY) + 30;
  }
  
  // If still doesn't fit, position it optimally
  if (top + modalHeight > window.innerHeight - padding) {
    top = Math.max(padding, window.innerHeight - modalHeight - padding);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ emoji, severity, comment });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && onAddComment) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50">
      <div
        className="absolute bg-white rounded-xl shadow-2xl border border-gray-200"
        style={{ 
          left: `${left}px`, 
          top: `${top}px`, 
          width: `${modalWidth}px`,
          maxHeight: `${modalHeight}px`,
          minWidth: '320px' // Ensure minimum usable width
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800">
              {pin ? 'Edit Feedback' : 'Add Feedback'}
            </h3>
            {pin && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {formatTimestamp(pin.timestamp)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        {/* Tabs for existing pins - always at the top of the modal */}
        {pin && (
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('feedback')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'feedback'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Feedback
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'comments'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Comments ({pin.comments.length})
            </button>
          </div>
        )}

        <div className="overflow-y-auto" style={{ maxHeight: `${modalHeight - 120}px` }}>
          {/* Feedback Tab */}
          {(!pin || activeTab === 'feedback') && (
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Emoji Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">How do you feel?</label>
                <div className="flex gap-2">
                  {emojis.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(emoji === e ? '' : e)}
                      className={`text-2xl p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                        emoji === e 
                          ? 'border-indigo-500 bg-indigo-50 transform scale-105' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="">Select severity</option>
                  <option value="low">🟡 Low</option>
                  <option value="medium">🟠 Medium</option>
                  <option value="high">🔴 High</option>
                  <option value="critical">🔴 Critical</option>
                </select>
                {severity && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                    <div className={`w-3 h-3 rounded-full ${
                      severity === 'low' ? 'bg-yellow-500' :
                      severity === 'medium' ? 'bg-orange-500' :
                      severity === 'high' ? 'bg-red-500' :
                      severity === 'critical' ? 'bg-red-700' : 'bg-gray-400'
                    }`}></div>
                    <span>Pin will appear in this color</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Describe the issue or suggestion..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
              </div>
            </form>
          )}

          {/* Comments Tab */}
          {pin && activeTab === 'comments' && (
            <div className="p-4 space-y-4">
              {/* Existing Comments */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {pin.comments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No comments yet</p>
                ) : (
                  pin.comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {comment.author || 'Anonymous'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(comment.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">{comment.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment */}
              <form onSubmit={handleAddComment} className="pt-3 border-t border-gray-200">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  Add Comment
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-4 border-t border-gray-200">
          {pin && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
            >
              Delete Pin
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            Cancel
          </button>
          {(!pin || activeTab === 'feedback') && (
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
            >
              {pin ? 'Update' : 'Submit'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const FeedbackCollector = forwardRef<
  { activatePinMode: () => void; placePinAt: (x: number, y: number) => void },
  FeedbackCollectorProps
>(({ onFeedbackSubmit, pageUrl, testGroupId, domain }, ref) => {
  const [isActive, setIsActive] = useState(false);
  const [pendingPin, setPendingPin] = useState<{ x: number, y: number } | null>(null);
  const [existingPins, setExistingPins] = useState<FeedbackPin[]>([]);
  const [editingPin, setEditingPin] = useState<FeedbackPin | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // localStorage utility functions for pin persistence
  const getStorageKey = () => {
    // Create a composite key using testGroupId, domain, and pageUrl for precise scoping
    const keyParts = [];
    if (testGroupId) keyParts.push(`group-${testGroupId}`);
    if (domain) keyParts.push(`domain-${domain.replace(/[^a-zA-Z0-9]/g, '-')}`);
    if (pageUrl) keyParts.push(`page-${pageUrl.replace(/[^a-zA-Z0-9]/g, '-')}`);
    
    const compositeKey = keyParts.length > 0 ? keyParts.join('_') : 'default';
    return `feedback-pins-${compositeKey}`;
  };

  const saveToLocalStorage = (pins: FeedbackPin[]) => {
    try {
      const key = getStorageKey();
      localStorage.setItem(key, JSON.stringify(pins));
      console.log(`Saved ${pins.length} pins to localStorage with key: ${key}`);
    } catch (error) {
      console.warn('Failed to save pins to localStorage:', error);
    }
  };

  const loadFromLocalStorage = (): FeedbackPin[] => {
    try {
      const key = getStorageKey();
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        const pins = parsed.map((pin: any) => ({
          ...pin,
          timestamp: new Date(pin.timestamp),
          comments: pin.comments.map((comment: any) => ({
            ...comment,
            timestamp: new Date(comment.timestamp)
          }))
        }));
        console.log(`Loaded ${pins.length} pins from localStorage with key: ${key}`);
        return pins;
      }
    } catch (error) {
      console.warn('Failed to load pins from localStorage:', error);
    }
    return [];
  };

  // Load pins on component mount
  useEffect(() => {
    const loadPins = async () => {
      try {
        // First try to load from backend with enhanced query parameters
        const queryParams = new URLSearchParams();
        if (pageUrl) queryParams.append('pageUrl', pageUrl);
        if (testGroupId) queryParams.append('testGroupId', testGroupId);
        if (domain) queryParams.append('domain', domain);
        
        const response = await fetch(`/api/pins?${queryParams.toString()}`);
        if (response.ok) {
          const backendPins = await response.json();
          if (backendPins.length > 0) {
            console.log(`Loaded ${backendPins.length} pins from backend for testGroup: ${testGroupId}, domain: ${domain}`);
            setExistingPins(backendPins);
            return;
          }
        }
      } catch (error) {
        console.warn('Failed to load pins from backend, falling back to localStorage:', error);
      }
      
      // Fallback to localStorage
      const localPins = loadFromLocalStorage();
      if (localPins.length > 0) {
        setExistingPins(localPins);
      }
    };

    loadPins();
  }, [pageUrl, testGroupId, domain]);

  // Update localStorage whenever pins change
  useEffect(() => {
    saveToLocalStorage(existingPins);
  }, [existingPins]);

  // Expose methods for external control
  useImperativeHandle(ref, () => ({
    activatePinMode: () => setIsActive(true),
    placePinAt: (x: number, y: number) => {
      setIsActive(true);
      setPendingPin({ x, y });
    }
  }), []);

  // Handle overlay clicks when active
  useEffect(() => {
    if (!isActive || !overlayRef.current) return;

    const handleClick = (e: MouseEvent) => {
      if (e.button !== 0) return; // Only left click
      
      // Don't place pin if clicking on modal or existing pin
      if ((e.target as Element).closest('.feedback-modal') || 
          (e.target as Element).closest('.feedback-pin')) return;
      
      // Calculate position relative to document (accounting for scroll)
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      
      setPendingPin({ 
        x: e.clientX + scrollX, 
        y: e.clientY + scrollY 
      });
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsActive(false);
        setPendingPin(null);
        setEditingPin(null);
      }
    };

    const overlay = overlayRef.current;
    overlay.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEscape);
    overlay.style.cursor = 'crosshair';

    return () => {
      overlay.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEscape);
      overlay.style.cursor = '';
    };
  }, [isActive]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleModalSubmit = async (modalData: { emoji?: string; severity?: string; comment?: string }) => {
    if (editingPin) {
      // Update existing pin
      try {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'PIN_UPDATED',
            pinId: editingPin.id,
            data: {
              pageUrl,
              testGroupId: testGroupId || 'default-group',
              domain,
              x: editingPin.x,
              y: editingPin.y,
              ...modalData
            }
          })
        });

        setExistingPins(pins => pins.map(pin => 
          pin.id === editingPin.id 
            ? { ...pin, ...modalData }
            : pin
        ));
        setEditingPin(null);
      } catch (error) {
        console.error('Failed to update pin:', error);
        // Update localStorage even if API fails
        setExistingPins(pins => pins.map(pin => 
          pin.id === editingPin.id 
            ? { ...pin, ...modalData }
            : pin
        ));
        setEditingPin(null);
      }
    } else if (pendingPin) {
      // Create new pin
      const newPin: FeedbackPin = {
        id: generateId(),
        x: pendingPin.x,
        y: pendingPin.y,
        pageUrl,
        testGroupId: testGroupId || 'default-group',
        domain,
        timestamp: new Date(),
        comments: [],
        ...modalData
      };

      try {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'PIN_CREATED',
            pinId: newPin.id,
            data: {
              pageUrl,
              testGroupId: testGroupId || 'default-group',
              domain,
              x: pendingPin.x,
              y: pendingPin.y,
              ...modalData
            }
          })
        });
        
        setExistingPins(pins => [...pins, newPin]);
        
        // Submit to parent
        onFeedbackSubmit({
          x: pendingPin.x,
          y: pendingPin.y,
          pageUrl,
          testGroupId: testGroupId || 'default-group',
          domain,
          ...modalData
        });
      } catch (error) {
        console.error('Failed to create pin:', error);
        // Save to state and localStorage even if API fails
        setExistingPins(pins => [...pins, newPin]);
        
        // Submit to parent
        onFeedbackSubmit({
          x: pendingPin.x,
          y: pendingPin.y,
          pageUrl,
          testGroupId: testGroupId || 'default-group',
          domain,
          ...modalData
        });
      }
    }

    // Reset pending pin but keep active mode for multiple pin placement
    setPendingPin(null);
    // Don't reset isActive - allow placing multiple pins
  };

  const handleModalCancel = () => {
    setPendingPin(null);
    setEditingPin(null);
    // Don't reset isActive - allow placing multiple pins
  };

  const handlePinClick = (pin: FeedbackPin) => {
    setEditingPin(pin);
  };

  const handlePinDelete = async () => {
    if (editingPin) {
      try {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'PIN_DELETED',
            pinId: editingPin.id,
            data: {
              pageUrl,
              testGroupId: testGroupId || 'default-group',
              domain,
              x: editingPin.x,
              y: editingPin.y
            }
          })
        });

        setExistingPins(pins => pins.filter(pin => pin.id !== editingPin.id));
        setEditingPin(null);
      } catch (error) {
        console.error('Failed to delete pin:', error);
        // Delete from localStorage even if API fails
        setExistingPins(pins => pins.filter(pin => pin.id !== editingPin.id));
        setEditingPin(null);
      }
    }
  };

  const handleAddComment = async (commentText: string) => {
    if (editingPin) {
      const newComment: Comment = {
        id: generateId(),
        text: commentText,
        timestamp: new Date(),
        author: 'Anonymous' // Could be replaced with actual user data
      };

      try {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'COMMENT_ADDED',
            pinId: editingPin.id,
            data: {
              pageUrl,
              testGroupId: testGroupId || 'default-group',
              domain,
              comment: commentText
            }
          })
        });

        setExistingPins(pins => pins.map(pin => 
          pin.id === editingPin.id 
            ? { ...pin, comments: [...pin.comments, newComment] }
            : pin
        ));
        
        // Update the editing pin state as well
        setEditingPin(prev => prev ? {
          ...prev,
          comments: [...prev.comments, newComment]
        } : null);
      } catch (error) {
        console.error('Failed to add comment:', error);
        // Update localStorage even if API fails
        setExistingPins(pins => pins.map(pin => 
          pin.id === editingPin.id 
            ? { ...pin, comments: [...pin.comments, newComment] }
            : pin
        ));
        
        // Update the editing pin state as well
        setEditingPin(prev => prev ? {
          ...prev,
          comments: [...prev.comments, newComment]
        } : null);
      }
    }
  };

  const clearAllPins = () => {
    setExistingPins([]);
    // Also clear from localStorage
    try {
      const key = getStorageKey();
      localStorage.removeItem(key);
      console.log(`Cleared pins from localStorage with key: ${key}`);
    } catch (error) {
      console.warn('Failed to clear pins from localStorage:', error);
    }
  };

  // Get pin color based on severity
  const getPinColor = (severity?: string) => {
    switch (severity) {
      case 'low':
        return 'bg-yellow-500';
      case 'medium':
        return 'bg-orange-500';
      case 'high':
        return 'bg-red-500';
      case 'critical':
        return 'bg-red-700';
      default:
        return 'bg-indigo-600'; // Default color for no severity
    }
  };

  return (
    <>
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
        {existingPins.length > 0 && !isActive && (
          <button
            onClick={clearAllPins}
            className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-red-600 hover:scale-105 transition-all font-medium text-sm"
          >
            🗑️ Clear All
          </button>
        )}
        
        <button
          onClick={() => setIsActive(!isActive)}
          className={`px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-all font-medium ${
            isActive 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isActive ? '✕ Cancel' : '📍 Add Feedback'}
        </button>
      </div>

      {/* Existing Pins */}
      {existingPins.map((pin) => (
        <div
          key={pin.id}
          className="feedback-pin absolute z-30 cursor-pointer"
          style={{ left: `${pin.x - 12}px`, top: `${pin.y - 12}px` }}
          onClick={() => handlePinClick(pin)}
        >
          <div className={`w-6 h-6 ${getPinColor(pin.severity)} border-2 border-white rounded-full shadow-lg hover:scale-125 transition-transform flex items-center justify-center`}>
            <span className="text-white text-xs font-bold">{pin.emoji || '📍'}</span>
          </div>
        </div>
      ))}

      {/* Full-document overlay when active - covers entire scrollable area */}
      {isActive && !editingPin && (
        <div
          ref={overlayRef}
          className="absolute inset-0 z-30 bg-transparent"
          style={{ 
            cursor: 'crosshair',
            top: 0,
            left: 0,
            width: '100%',
            height: `${Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)}px`,
            position: 'absolute'
          }}
        />
      )}

      {/* Feedback Modal for new pins */}
      {pendingPin && !editingPin && (
        <div className="feedback-modal">
          <FeedbackModal
            x={pendingPin.x}
            y={pendingPin.y}
            onSubmit={handleModalSubmit}
            onCancel={handleModalCancel}
          />
        </div>
      )}

      {/* Feedback Modal for editing existing pins */}
      {editingPin && (
        <div className="feedback-modal">
          <FeedbackModal
            x={editingPin.x}
            y={editingPin.y}
            pin={editingPin}
            onSubmit={handleModalSubmit}
            onCancel={handleModalCancel}
            onDelete={handlePinDelete}
            onAddComment={handleAddComment}
          />
        </div>
      )}
    </>
  );
});




export default FeedbackCollector;
