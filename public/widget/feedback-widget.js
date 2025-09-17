;(function(window, document) {
  'use strict';

  // Prevent multiple initializations
  if (window.FeedbackFlowWidget) {
    return;
  }

  // Widget configuration
  let config = {
    testGroupId: null,
    memberToken: null,
    apiUrl: 'http://localhost:3000',
    theme: {
      primaryColor: '#4F46E5',
      borderRadius: '12px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }
  };

  // Widget state
  let isActive = false;
  let existingPins = [];
  let widgetContainer = null;
  let overlay = null;
  let currentModal = null;

  // Utility functions
  function generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  function formatTimestamp(date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return diffMins + 'm ago';
    if (diffHours < 24) return diffHours + 'h ago';
    if (diffDays < 7) return diffDays + 'd ago';
    return date.toLocaleDateString();
  }

  // Create floating action button
  function createFloatingButton() {
    const button = document.createElement('button');
    button.id = 'feedbackflow-fab';
    button.innerHTML = isActive ? '✕ Cancel' : '📍 Add Feedback';
    button.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: ${isActive ? '#EF4444' : config.theme.primaryColor};
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: ${config.theme.borderRadius};
      font-family: ${config.theme.fontFamily};
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
      user-select: none;
    `;

    button.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.05)';
    });

    button.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
    });

    button.addEventListener('click', function() {
      if (isActive) {
        deactivateFeedbackMode();
      } else {
        activateFeedbackMode();
      }
    });

    return button;
  }

  // Create clear all button
  function createClearButton() {
    if (existingPins.length === 0 || isActive) return null;

    const button = document.createElement('button');
    button.id = 'feedbackflow-clear';
    button.innerHTML = '🗑️ Clear All';
    button.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 24px;
      background: #EF4444;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: ${config.theme.borderRadius};
      font-family: ${config.theme.fontFamily};
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 4px 15px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
      user-select: none;
    `;

    button.addEventListener('click', function() {
      existingPins = [];
      renderPins();
      updateButtons();
    });

    return button;
  }

  // Create feedback modal
  function createModal(x, y, pin = null) {
    const modal = document.createElement('div');
    modal.className = 'feedbackflow-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.3);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const modalWidth = 400;
    const modalHeight = pin ? 500 : 350;
    let left = x - modalWidth / 2;
    let top = y - modalHeight - 20;

    // Keep modal in viewport
    const padding = 15;
    if (left < padding) left = padding;
    if (left + modalWidth > window.innerWidth - padding) {
      left = window.innerWidth - modalWidth - padding;
    }
    if (top < padding) top = y + 30;
    if (top + modalHeight > window.innerHeight - padding) {
      top = Math.max(padding, window.innerHeight - modalHeight - padding);
    }

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      position: absolute;
      left: ${left}px;
      top: ${top}px;
      width: ${modalWidth}px;
      max-height: ${modalHeight}px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      border: 1px solid #E5E7EB;
      overflow: hidden;
      font-family: ${config.theme.fontFamily};
    `;

    // Modal header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #E5E7EB;
      background: #F9FAFB;
    `;

    const title = document.createElement('h3');
    title.textContent = pin ? 'Edit Feedback' : 'Add Feedback';
    title.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6B7280;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
    `;
    closeBtn.addEventListener('click', closeModal);

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Modal body
    const body = document.createElement('div');
    body.style.cssText = `
      padding: 16px;
      max-height: 350px;
      overflow-y: auto;
    `;

    // Emoji selector
    const emojiSection = document.createElement('div');
    emojiSection.style.marginBottom = '16px';

    const emojiLabel = document.createElement('label');
    emojiLabel.textContent = 'How do you feel?';
    emojiLabel.style.cssText = `
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 8px;
    `;

    const emojiContainer = document.createElement('div');
    emojiContainer.style.cssText = `
      display: flex;
      gap: 8px;
    `;

    const emojis = ['😀', '😐', '😢', '😡'];
    let selectedEmoji = pin?.emoji || '';

    emojis.forEach(emoji => {
      const btn = document.createElement('button');
      btn.textContent = emoji;
      btn.type = 'button';
      btn.style.cssText = `
        font-size: 24px;
        padding: 12px;
        border: 2px solid ${selectedEmoji === emoji ? config.theme.primaryColor : '#E5E7EB'};
        border-radius: 8px;
        background: ${selectedEmoji === emoji ? config.theme.primaryColor + '10' : 'white'};
        cursor: pointer;
        transition: all 0.2s ease;
      `;

      btn.addEventListener('click', function() {
        document.querySelectorAll('.emoji-btn').forEach(b => {
          b.style.border = '2px solid #E5E7EB';
          b.style.background = 'white';
        });
        if (selectedEmoji === emoji) {
          selectedEmoji = '';
        } else {
          selectedEmoji = emoji;
          this.style.border = `2px solid ${config.theme.primaryColor}`;
          this.style.background = config.theme.primaryColor + '10';
        }
      });

      btn.className = 'emoji-btn';
      emojiContainer.appendChild(btn);
    });

    emojiSection.appendChild(emojiLabel);
    emojiSection.appendChild(emojiContainer);

    // Severity selector
    const severitySection = document.createElement('div');
    severitySection.style.marginBottom = '16px';

    const severityLabel = document.createElement('label');
    severityLabel.textContent = 'Severity';
    severityLabel.style.cssText = `
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 8px;
    `;

    const severitySelect = document.createElement('select');
    severitySelect.style.cssText = `
      width: 100%;
      padding: 12px;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      font-size: 14px;
      background: white;
    `;

    const severityOptions = ['', 'low', 'medium', 'high', 'critical'];
    severityOptions.forEach(option => {
      const opt = document.createElement('option');
      opt.value = option;
      opt.textContent = option ? option.charAt(0).toUpperCase() + option.slice(1) : 'Select severity';
      if (pin?.severity === option) opt.selected = true;
      severitySelect.appendChild(opt);
    });

    severitySection.appendChild(severityLabel);
    severitySection.appendChild(severitySelect);

    // Comment textarea
    const commentSection = document.createElement('div');
    commentSection.style.marginBottom = '16px';

    const commentLabel = document.createElement('label');
    commentLabel.textContent = 'Comments';
    commentLabel.style.cssText = `
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 8px;
    `;

    const commentTextarea = document.createElement('textarea');
    commentTextarea.placeholder = 'Describe the issue or suggestion...';
    commentTextarea.value = pin?.comment || '';
    commentTextarea.rows = 3;
    commentTextarea.style.cssText = `
      width: 100%;
      padding: 12px;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      font-size: 14px;
      font-family: ${config.theme.fontFamily};
      resize: none;
    `;

    commentSection.appendChild(commentLabel);
    commentSection.appendChild(commentTextarea);

    body.appendChild(emojiSection);
    body.appendChild(severitySection);
    body.appendChild(commentSection);

    // Modal footer
    const footer = document.createElement('div');
    footer.style.cssText = `
      display: flex;
      gap: 12px;
      padding: 16px;
      border-top: 1px solid #E5E7EB;
      background: #F9FAFB;
    `;

    if (pin) {
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete Pin';
      deleteBtn.style.cssText = `
        padding: 8px 16px;
        background: #FEF2F2;
        color: #DC2626;
        border: 1px solid #FECACA;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
      `;
      deleteBtn.addEventListener('click', function() {
        existingPins = existingPins.filter(p => p.id !== pin.id);
        renderPins();
        closeModal();
        updateButtons();
      });
      footer.appendChild(deleteBtn);
    }

    const spacer = document.createElement('div');
    spacer.style.flex = '1';
    footer.appendChild(spacer);

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `
      padding: 8px 16px;
      background: #F3F4F6;
      color: #374151;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
    `;
    cancelBtn.addEventListener('click', closeModal);

    const submitBtn = document.createElement('button');
    submitBtn.textContent = pin ? 'Update' : 'Submit';
    submitBtn.style.cssText = `
      padding: 8px 16px;
      background: ${config.theme.primaryColor};
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
    `;

    submitBtn.addEventListener('click', function() {
      const feedbackData = {
        emoji: selectedEmoji,
        severity: severitySelect.value,
        comment: commentTextarea.value
      };

      if (pin) {
        // Update existing pin
        const pinIndex = existingPins.findIndex(p => p.id === pin.id);
        if (pinIndex !== -1) {
          existingPins[pinIndex] = { ...existingPins[pinIndex], ...feedbackData };
        }
      } else {
        // Create new pin
        const newPin = {
          id: generateId(),
          x: x,
          y: y,
          timestamp: new Date(),
          comments: [],
          ...feedbackData
        };
        existingPins.push(newPin);

        // Submit to API
        submitFeedback({ x, y, ...feedbackData });
      }

      renderPins();
      closeModal();
      deactivateFeedbackMode();
      updateButtons();
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(submitBtn);

    modalContent.appendChild(header);
    modalContent.appendChild(body);
    modalContent.appendChild(footer);
    modal.appendChild(modalContent);

    return modal;
  }

  // Submit feedback to API
  function submitFeedback(data) {
    if (!config.testGroupId || !config.memberToken) {
      console.warn('FeedbackFlow: Missing configuration');
      return;
    }

    fetch(`${config.apiUrl}/api/feedback/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.memberToken}`
      },
      body: JSON.stringify({
        testGroupId: config.testGroupId,
        url: window.location.href,
        ...data
      })
    }).catch(err => {
      console.error('FeedbackFlow: Failed to submit feedback', err);
    });
  }

  // Render feedback pins
  function renderPins() {
    // Remove existing pins
    document.querySelectorAll('.feedbackflow-pin').forEach(pin => pin.remove());

    // Render current pins
    existingPins.forEach(pin => {
      const pinElement = document.createElement('div');
      pinElement.className = 'feedbackflow-pin';
      pinElement.style.cssText = `
        position: fixed;
        left: ${pin.x - 12}px;
        top: ${pin.y - 12}px;
        width: 24px;
        height: 24px;
        background: ${config.theme.primaryColor};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        z-index: 9998;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        transition: transform 0.2s ease;
      `;

      const icon = document.createElement('span');
      icon.textContent = pin.emoji || '📍';
      icon.style.color = 'white';
      pinElement.appendChild(icon);

      pinElement.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.25)';
      });

      pinElement.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
      });

      pinElement.addEventListener('click', function(e) {
        e.stopPropagation();
        showModal(pin.x, pin.y, pin);
      });

      document.body.appendChild(pinElement);
    });
  }

  // Show modal
  function showModal(x, y, pin = null) {
    closeModal();
    currentModal = createModal(x, y, pin);
    document.body.appendChild(currentModal);
  }

  // Close modal
  function closeModal() {
    if (currentModal) {
      currentModal.remove();
      currentModal = null;
    }
  }

  // Activate feedback mode
  function activateFeedbackMode() {
    isActive = true;
    document.body.style.cursor = 'crosshair';

    // Create overlay
    overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 9997;
      cursor: crosshair;
    `;

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        showModal(e.clientX, e.clientY);
      }
    });

    document.body.appendChild(overlay);
    updateButtons();
  }

  // Deactivate feedback mode
  function deactivateFeedbackMode() {
    isActive = false;
    document.body.style.cursor = '';
    
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
    
    closeModal();
    updateButtons();
  }

  // Update buttons
  function updateButtons() {
    // Remove existing buttons
    document.querySelectorAll('#feedbackflow-fab, #feedbackflow-clear').forEach(btn => btn.remove());

    // Add floating action button
    const fabButton = createFloatingButton();
    document.body.appendChild(fabButton);

    // Add clear button if needed
    const clearButton = createClearButton();
    if (clearButton) {
      document.body.appendChild(clearButton);
    }
  }

  // Initialize widget
  function init(userConfig = {}) {
    config = { ...config, ...userConfig };
    
    if (!config.testGroupId) {
      console.error('FeedbackFlow: testGroupId is required');
      return;
    }

    updateButtons();
    renderPins();
  }

  // Destroy widget
  function destroy() {
    deactivateFeedbackMode();
    document.querySelectorAll('.feedbackflow-pin, #feedbackflow-fab, #feedbackflow-clear').forEach(el => el.remove());
    existingPins = [];
  }

  // Global widget object
  window.FeedbackFlowWidget = {
    init: init,
    destroy: destroy,
    config: config
  };

  // Auto-initialize if config is provided
  const script = document.querySelector('script[data-testgroup-id]');
  if (script) {
    const autoConfig = {
      testGroupId: script.getAttribute('data-testgroup-id'),
      memberToken: script.getAttribute('data-member-token'),
      apiUrl: script.getAttribute('data-api-url') || config.apiUrl
    };
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => init(autoConfig));
    } else {
      init(autoConfig);
    }
  }

})(window, document);
