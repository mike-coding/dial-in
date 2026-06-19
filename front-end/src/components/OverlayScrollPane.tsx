import React, { useCallback, useEffect, useRef, useState } from 'react';

interface OverlayScrollPaneProps {
  children: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
}

const OverlayScrollPane: React.FC<OverlayScrollPaneProps> = ({ children, className = '', wrapperClassName = '' }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [thumbStyle, setThumbStyle] = useState({ height: 0, top: 0 });
  const [hasOverflow, setHasOverflow] = useState(false);

  const updateThumb = useCallback(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const { clientHeight, scrollHeight, scrollTop } = element;
    const nextHasOverflow = scrollHeight > clientHeight + 1;
    setHasOverflow(nextHasOverflow);

    if (!nextHasOverflow) {
      setThumbStyle({ height: 0, top: 0 });
      return;
    }

    const thumbHeight = Math.max(32, (clientHeight / scrollHeight) * clientHeight);
    const maxThumbTop = clientHeight - thumbHeight;
    const maxScrollTop = scrollHeight - clientHeight;
    const thumbTop = maxScrollTop > 0 ? (scrollTop / maxScrollTop) * maxThumbTop : 0;
    setThumbStyle({ height: thumbHeight, top: thumbTop });
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    updateThumb();
    element.addEventListener('scroll', updateThumb, { passive: true });

    const resizeObserver = new ResizeObserver(updateThumb);
    resizeObserver.observe(element);
    resizeObserver.observe(element.firstElementChild || element);

    return () => {
      element.removeEventListener('scroll', updateThumb);
      resizeObserver.disconnect();
    };
  }, [updateThumb]);

  return (
    <div className={`relative min-h-0 flex-1 ${wrapperClassName}`}>
      <div ref={scrollRef} className={`overlay-scroll-pane h-full overflow-y-auto ${className}`}>
        {children}
      </div>
      {hasOverflow && (
        <div className="pointer-events-none absolute right-1 top-0 h-full w-1.5 py-1">
          <div
            className="w-full rounded-full bg-gray-500/35"
            style={{ height: thumbStyle.height, transform: `translateY(${thumbStyle.top}px)` }}
          />
        </div>
      )}
    </div>
  );
};

export default OverlayScrollPane;
