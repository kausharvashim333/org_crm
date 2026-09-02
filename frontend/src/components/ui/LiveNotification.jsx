import { useState, useEffect } from 'react';
import { GraduationCap, X } from 'lucide-react';

const DEFAULT_NOTIFICATIONS = [
  { name: 'Rahul', action: 'enrolled in DCA', course: 'DCA', time: '2 min ago' },
  { name: 'Priya', action: 'completed admission', course: 'Tally Prime', time: '5 min ago' },
  { name: 'Amit', action: 'joined Web Development', course: 'Web Dev', time: '8 min ago' },
  { name: 'Sneha', action: 'registered for ADCA Pro', course: 'ADCA Pro', time: '12 min ago' },
  { name: 'Vikas', action: 'enrolled in Python AI', course: 'Python AI', time: '15 min ago' },
  { name: 'Anjali', action: 'completed DMLT admission', course: 'DMLT', time: '20 min ago' },
];

export default function LiveNotification({ notifications = DEFAULT_NOTIFICATIONS, interval = 8000, themeColor = '#6366f1' }) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const showTimer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(showTimer);
  }, [dismissed]);

  useEffect(() => {
    if (dismissed || !visible) return;
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent(p => (p + 1) % notifications.length);
        setVisible(true);
      }, 400);
    }, interval);
    return () => clearInterval(cycle);
  }, [visible, dismissed, notifications.length, interval]);

  if (dismissed || !visible) return null;

  const n = notifications[current];

  return (
    <div className="fixed bottom-4 left-4 z-[997] max-w-[300px] animate-slide-in-bottom">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-100 p-3 flex items-center gap-3 relative">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-1 right-1 w-5 h-5 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
        >
          <X className="w-3 h-3 text-slate-400" />
        </button>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${themeColor}15` }}
        >
          <GraduationCap className="w-5 h-5" style={{ color: themeColor }} />
        </div>
        <div className="pr-3">
          <p className="text-xs text-slate-700 font-semibold leading-tight">
            {n.name} {n.action}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
        </div>
      </div>
    </div>
  );
}
