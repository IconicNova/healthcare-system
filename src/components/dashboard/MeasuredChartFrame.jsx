'use client';

import { useEffect, useRef, useState } from 'react';

export default function MeasuredChartFrame({ children, className, height = 250, style }) {
  const frameRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height });

  useEffect(() => {
    const node = frameRef.current;
    if (!node) {
      return undefined;
    }

    const updateSize = () => {
      setSize({
        width: Math.max(0, Math.floor(node.clientWidth)),
        height: Math.max(0, Math.floor(node.clientHeight || height)),
      });
    };

    updateSize();

    if (typeof ResizeObserver === 'undefined') {
      const handleResize = () => updateSize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(node);

    return () => observer.disconnect();
  }, [height]);

  return (
    <div ref={frameRef} className={className} style={{ width: '100%', height, ...style }}>
      {size.width > 0 && size.height > 0 ? children(size) : null}
    </div>
  );
}
