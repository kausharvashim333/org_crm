import { useState, useEffect } from 'react';

export default function ScrollProgress({ color = '#6366f1' }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handler = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div
      className="scroll-progress"
      style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${color}, #a855f7)` }}
    />
  );
}
