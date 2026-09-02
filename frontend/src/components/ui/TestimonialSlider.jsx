import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

export default function TestimonialSlider({ testimonials = [], autoPlay = true, interval = 5000 }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = testimonials.length;

  const next = useCallback(() => setCurrent(p => (p + 1) % count), [count]);
  const prev = () => setCurrent(p => (p - 1 + count) % count);

  useEffect(() => {
    if (!autoPlay || paused || count <= 1) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [autoPlay, paused, count, interval, next]);

  if (count === 0) return null;

  return (
    <div
      className="relative max-w-3xl mx-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {testimonials.map((t, i) => (
            <div key={i} className="w-full flex-shrink-0 px-4">
              <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 sm:p-8 text-center">
                <div className="flex justify-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className={`w-4 h-4 ${s < (t.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                  ))}
                </div>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-5 italic">
                  "{t.message || t.text || t.review}"
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
                    {(t.name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 text-sm">{t.name}</p>
                    {t.role && <p className="text-xs text-slate-400">{t.role}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute top-1/2 -left-2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all z-10"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <button
            onClick={next}
            className="absolute top-1/2 -right-2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all z-10"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex justify-center gap-1.5 mt-4">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${i === current ? 'bg-indigo-600 w-6' : 'bg-slate-300 w-2'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
