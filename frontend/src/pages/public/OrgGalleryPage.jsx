import { useState, useEffect } from 'react';
import { getOrgHomepagePublic } from '../../api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import { Image as ImageIcon } from 'lucide-react';

export default function OrgGalleryPage() {
  const [hp, setHp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    getOrgHomepagePublic()
      .then(res => { setHp(res.data.homepage); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{ backgroundColor: '#0f172a' }}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
    </div>
  );

  const themeColor = hp?.settings?.themeColor || '#2563eb';
  const gallery = hp?.gallery || {};
  const photos = gallery.photos || [];

  const fixUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('/uploads/')) return `/api${url}`;
    return url;
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col justify-between">
      <div>
        <SEO title="Gallery - Campus Life & Events" description="Browse photos from our training centers, events, and student activities" />
        <Navbar />

        {/* Hero Banner */}
        <section className="py-16 px-6 relative overflow-hidden text-center text-white" style={{ background: `linear-gradient(135deg, #0f172a 0%, ${themeColor} 100%)` }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 2px, transparent 2px)', backgroundSize: '32px 32px' }} />
          <div className="max-w-4xl mx-auto relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/15 border border-white/20 backdrop-blur-md text-white">
              <ImageIcon className="w-4 h-4" />
              <span>Campus Life</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">{gallery.title || 'Gallery'}</h1>
            <p className="text-sm md:text-lg text-white/80 max-w-3xl mx-auto font-light leading-relaxed">
              Glimpses from our training centers, events, and student activities
            </p>
          </div>
        </section>

        {/* Pinterest-style Masonry Gallery */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {photos.length === 0 ? (
              <div className="text-center py-20">
                <ImageIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-400 text-lg">No photos available yet.</p>
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                {photos.map((photo, i) => (
                  <div
                    key={i}
                    className="break-inside-avoid relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => setSelectedImage(photo)}
                  >
                    <img
                      src={fixUrl(photo.url)}
                      alt={photo.caption || `Gallery ${i + 1}`}
                      className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    {photo.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-semibold">{photo.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img
              src={fixUrl(selectedImage.url)}
              alt={selectedImage.caption || 'Gallery image'}
              className="max-w-full max-h-[90vh] rounded-xl object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            {selectedImage.caption && (
              <p className="text-white text-center mt-4 text-sm font-semibold">{selectedImage.caption}</p>
            )}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-xl font-bold transition-all"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <Footer homepageData={hp} />
    </div>
  );
}
