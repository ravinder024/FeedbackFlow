'use client';

import React, { useState } from 'react';
// import Image from 'next/image'; // No longer needed
import EmotionSelector from './EmotionSelector';
import { Severity } from './types';

interface FeedbackFormProps {
  onSubmit: (comment: string, emotion: string, severity: Severity) => void;
  onClose: () => void;
  onDelete: () => void;
  initialComment?: string;
  initialEmotion?: string;
  initialSeverity?: Severity;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({
  onSubmit,
  onClose,
  onDelete,
  initialComment = '',
  initialEmotion = '😊',
  initialSeverity = 'Low',
}) => {
  const [comment, setComment] = useState(initialComment);
  const [emotion, setEmotion] = useState(initialEmotion);
  const [severity, setSeverity] = useState<Severity>(initialSeverity);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      onSubmit(comment, emotion, severity);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '0.5rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        width: '20rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'rgb(17 24 39)',
          }}
        >
          Add Feedback
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgb(107 114 128)',
            cursor: 'pointer',
            fontSize: '1.25rem',
          }}
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'rgb(55 65 81)',
              marginBottom: '0.5rem',
            }}
          >
            How do you feel about this?
          </label>
          <EmotionSelector selectedEmotion={emotion} onSelect={setEmotion} />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label
            htmlFor="severity"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'rgb(55 65 81)',
              marginBottom: '0.5rem',
            }}
          >
            Severity
          </label>
          <select
            id="severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as Severity)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid rgb(209 213 219)',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              backgroundColor: 'white',
            }}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label
            htmlFor="comment"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'rgb(55 65 81)',
              marginBottom: '0.5rem',
            }}
          >
            Your feedback
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid rgb(209 213 219)',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              minHeight: '6rem',
              resize: 'vertical',
            }}
            placeholder="What's on your mind?"
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <button
            type="button"
            onClick={onDelete}
            style={{
              padding: '0.5rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              backgroundColor: 'rgb(254 226 226)',
              color: 'rgb(220 38 38)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Delete feedback"
          >
            🗑️
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                backgroundColor: 'rgb(243 244 246)',
                color: 'rgb(55 65 81)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!comment.trim()}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                backgroundColor: comment.trim() ? 'rgb(79 70 229)' : 'rgb(156 163 175)',
                color: 'white',
                border: 'none',
                cursor: comment.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Submit
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm; 