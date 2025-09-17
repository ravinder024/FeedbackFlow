import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalContainerProps {
  children: React.ReactNode;
  containerId?: string;
}

export const PortalContainer: React.FC<PortalContainerProps> = ({
  children,
  containerId = 'feedback-flow-widget'
}) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let element = document.getElementById(containerId);
    if (!element) {
      element = document.createElement('div');
      element.id = containerId;
      document.body.appendChild(element);
    }
    setContainer(element);
    
    return () => {
      if (element && element.parentElement) {
        element.parentElement.removeChild(element);
      }
    };
  }, [containerId]);

  return container ? createPortal(children, container) : null;
};
