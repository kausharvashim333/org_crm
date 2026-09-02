import { useState, useEffect } from 'react';

export default function TypingText({ texts, speed = 80, deleteSpeed = 40, pause = 1800, className = '' }) {
  const [display, setDisplay] = useState('');
  const [idx, setIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[idx % texts.length];
    let timer;

    if (!deleting && display === current) {
      timer = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && display === '') {
      setDeleting(false);
      setIdx(prev => prev + 1);
    } else {
      timer = setTimeout(() => {
        setDisplay(prev => {
          if (deleting) return current.substring(0, prev.length - 1);
          return current.substring(0, prev.length + 1);
        });
      }, deleting ? deleteSpeed : speed);
    }

    return () => clearTimeout(timer);
  }, [display, deleting, idx, texts, speed, deleteSpeed, pause]);

  return (
    <span className={`typing-cursor ${className}`}>
      {display}
    </span>
  );
}
