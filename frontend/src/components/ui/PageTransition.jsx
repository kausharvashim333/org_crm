import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }) {
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitioning, setTransitioning] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== displayChildren?.props?.children?.props?.location?.pathname) {
      setTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setTransitioning(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location, children, displayChildren]);

  return (
    <div
      className={transitioning ? 'opacity-0 translate-y-2' : 'animate-fade-in-page'}
      style={{ transition: 'opacity 0.15s ease, transform 0.15s ease' }}
    >
      {displayChildren}
    </div>
  );
}
