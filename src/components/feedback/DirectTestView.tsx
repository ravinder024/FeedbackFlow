import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { FeedbackCollector } from './FeedbackCollector';

interface DirectTestViewProps {
  url: string;
  onFeedbackClick: (feedback: {
    coordinates: { x: number; y: number };
    pageUrl: string;
  }) => void;
}

export const DirectTestView: React.FC<DirectTestViewProps> = ({
  url,
  onFeedbackClick,
}) => {
  const { data: session } = useSession();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportDimensions, setViewportDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [canvasRect, setCanvasRect] = useState<{ left: number; top: number; width: number; height: number }>({ left: 0, top: 0, width: 0, height: 0 });
  const scaleRef = useRef(scale);
  const panRef = useRef(pan);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Canvas context not found');
      return;
    }

    // Set canvas size to match viewport and device pixel ratio for crisp rendering
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) {
        console.error('Canvas container not found');
        return;
      }
      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width = container.clientWidth + 'px';
      canvas.style.height = container.clientHeight + 'px';
      setViewportDimensions({
        width: container.clientWidth,
        height: container.clientHeight
      });
      renderChatGPTUI(); // Always re-render after resize
    };

    // ChatGPT-style UI rendering
    const renderChatGPTUI = () => {
      ctx.save();
      // Use device pixel ratio for crisp fonts and shapes
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr * scaleRef.current, 0, 0, dpr * scaleRef.current, panRef.current.x * dpr, panRef.current.y * dpr);

      // Background
      ctx.fillStyle = '#1a2332'; // dark blue
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      // Sidebar
      ctx.fillStyle = '#232e47';
      ctx.fillRect(0, 0, 220, canvas.height / dpr);

      // Top bar
      ctx.fillStyle = '#232e47';
      ctx.fillRect(220, 0, (canvas.width / dpr) - 220, 60);

      // Chat area
      ctx.fillStyle = '#222c3a';
      ctx.fillRect(220, 60, (canvas.width / dpr) - 220, (canvas.height / dpr) - 60);

      // Sidebar menu options
      ctx.fillStyle = '#b3c7f9';
      ctx.font = `bold ${18 * dpr}px sans-serif`;
      ctx.fillText('ChatGPT', 30, 40);
      ctx.font = `${16 * dpr}px sans-serif`;
      const menu = [
        'New Chat', 'History', 'Settings', 'Upgrade', 'Help', 'Logout'
      ];
      menu.forEach((item, i) => {
        ctx.fillText(item, 30, 80 + i * 40);
      });

      // Top bar text
      ctx.font = `bold ${20 * dpr}px sans-serif`;
      ctx.fillStyle = '#b3c7f9';
      ctx.fillText('Welcome to ChatGPT Demo', 240, 40);

      // Chat bubbles (sample)
      ctx.font = `${16 * dpr}px sans-serif`;
      ctx.fillStyle = '#3b4a67';
      ctx.fillRect(240, 80, 400, 40);
      ctx.fillStyle = '#b3c7f9';
      ctx.fillText('How can I help you today?', 250, 105);

      ctx.fillStyle = '#2e3a55';
      ctx.fillRect(240, 140, 400, 40);
      ctx.fillStyle = '#b3c7f9';
      ctx.fillText('Show me today\'s weather.', 250, 165);

      ctx.restore();
    };

    renderChatGPTUI();

    // Handle zooming
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.01;
        const newScale = Math.min(Math.max(0.1, scaleRef.current + delta), 4);
        setScale(newScale);
      }
    };

    canvas.addEventListener('wheel', handleWheel);
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [scale, pan]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const updateRect = () => {
      const rect = canvas.getBoundingClientRect();
      setCanvasRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, []);

  return (
    <div className="flex flex-col min-h-screen w-full bg-gradient-to-br from-[#232e47] via-[#1a2332] to-[#232e47]">
      <div
        ref={containerRef}
        className="relative flex-1 w-full min-h-screen h-full"
        style={{ minHeight: '100vh', width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}
      >
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
          style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none', background: 'transparent', zIndex: 1 }}
        />
        {/* Sample UI overlays for demo */}
        <div className="absolute left-8 top-16 w-64 bg-white/90 rounded-lg shadow-lg p-6 flex flex-col gap-4 z-10">
          <h2 className="text-xl font-bold text-indigo-700">Demo Sidebar</h2>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Sample Button</button>
          <input type="text" placeholder="Demo Input" className="border border-gray-300 rounded px-2 py-1" />
          <textarea placeholder="Demo Message" className="border border-gray-300 rounded px-2 py-1 resize-none" rows={2} />
        </div>
        <div className="absolute right-8 bottom-16 w-80 bg-white/90 rounded-lg shadow-lg p-6 flex flex-col gap-2 z-10">
          <h2 className="text-lg font-semibold text-gray-800">Demo Chat Area</h2>
          <div className="bg-indigo-50 rounded p-2 mb-2 text-gray-700">How can I help you today?</div>
          <div className="bg-gray-100 rounded p-2 text-gray-700">Show me today's weather.</div>
        </div>
        <FeedbackCollector
          url={url}
          onFeedbackClick={(feedback) => {
            const canvasCoords = {
              x: (feedback.coordinates.x - pan.x) / scale,
              y: (feedback.coordinates.y - pan.y) / scale
            };
            onFeedbackClick({
              ...feedback,
              coordinates: canvasCoords
            });
          }}
          scale={scale}
          pan={pan}
          viewport={viewportDimensions}
          canvasRect={canvasRect}
          containerRef={containerRef}
        />
      </div>
    </div>
  );
};