const initFeedbackWidget = () => {
  let feedbackMode = false;

  // Handle messages from parent frame
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'ENABLE_FEEDBACK') {
      feedbackMode = true;
      document.body.style.cursor = 'crosshair';
    } else if (event.data?.type === 'DISABLE_FEEDBACK') {
      feedbackMode = false;
      document.body.style.cursor = 'default';
    }
  });

  const handleMouseMove = (e) => {
    if (!feedbackMode) return;
    
    // Send coordinates to parent
    window.parent.postMessage({
      type: 'MOUSE_MOVE',
      position: { x: e.clientX, y: e.clientY }
    }, '*');
  };

  const handleClick = (e) => {
    if (!feedbackMode) return;
    e.preventDefault();

    // Calculate viewport-relative percentages
    const xPercent = (e.clientX / window.innerWidth) * 100;
    const yPercent = (e.clientY / window.innerHeight) * 100;

    window.parent.postMessage({
      type: 'FEEDBACK_CLICK',
      coordinates: { xPercent, yPercent },
      pageUrl: window.location.pathname
    }, '*');

    feedbackMode = false;
    document.body.style.cursor = '';
  };

  const handleMessage = (event) => {
    if (event.data.type === 'START_FEEDBACK') {
      feedbackMode = true;
      document.body.style.cursor = 'crosshair';
      if (!markerElement) {
        markerElement = createMarker();
      }
    } else if (event.data.type === 'STOP_FEEDBACK') {
      feedbackMode = false;
      if (markerElement) {
        markerElement.remove();
        markerElement = null;
      }
      document.body.style.cursor = '';
    }
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('click', handleClick);
  window.addEventListener('message', handleMessage);
};

// Initialize when the page loads
window.addEventListener('load', initFeedbackWidget);
