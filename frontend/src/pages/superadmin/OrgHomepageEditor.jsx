import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getOrgHomepage, updateOrgHomepageSection, publishOrgHomepage,
  addOrgTestimonial, deleteOrgTestimonial, updateOrgTestimonial,
  addOrgGalleryPhoto, deleteOrgGalleryPhoto, toggleOrgGalleryFeatured,
  addOrgStat, deleteOrgStat,
  addOrgFeature, deleteOrgFeature,
  updateOrgHomepage,
  addOrgNotice, deleteOrgNotice, updateOrgNotice,
  addOrgCertification, deleteOrgCertification,
  addOrgService, deleteOrgService,
  addOrgVertical, deleteOrgVertical, updateOrgVertical,
  addOrgCustomSection, updateOrgCustomSection, deleteOrgCustomSection,
  addOrgCustomCard, deleteOrgCustomCard,
  updateOrgCentersStrip, addOrgCenter, deleteOrgCenter,
} from '../../api';
import { useToast } from '../../context/ToastContext';
import { ExternalLink } from 'lucide-react';
import {
  HeroEditor, AboutEditor, StatsEditor, FranchiseEditor,
  CertificationsEditor, GalleryEditor, TestimonialsEditor,
  NoticesEditor, CtaEditor, ContactEditor, SettingsEditor,
  ServicesEditor, AnnouncementEditor, EnquiryConfigEditor,
  CodeSeriesEditor, VerticalsEditor, CustomSectionsEditor, CentersStripEditor,
  LayoutOrderEditor, VerifyWidgetEditor, CategoriesEditor,
} from './websiteEditors';

const tabs = [
  { key: 'hero', label: 'Hero & CTA' },
  { key: 'content', label: 'About & Stats' },
  { key: 'verticals', label: 'Verticals' },
  { key: 'franchise', label: '⭐ Franchise & Partnership Plans' },
  { key: 'services', label: 'Services' },
  { key: 'custom', label: 'Custom Sections' },
  { key: 'media', label: 'Media' },
  { key: 'layout', label: 'Section Order' },
  { key: 'settings', label: 'Settings' },
];

// Map sidebar deep-link section keys to our grouped tabs
const sectionToTab = {
  hero: 'hero', cta: 'hero',
  about: 'content', stats: 'content', certifications: 'content',
  verticals: 'verticals',
  franchise: 'franchise',
  services: 'services',
  custom: 'custom',
  gallery: 'media', testimonials: 'media', notices: 'media',
  announcement: 'settings', enquiryConfig: 'settings', contact: 'settings', settings: 'settings',
  verifyWidget: 'custom', categories: 'custom', layoutOrder: 'layout',
};

export default function OrgHomepageEditor() {
  const [searchParams] = useSearchParams();
  const [homepage, setHomepage] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  // Resolve initial tab from ?section= query param
  const initialSection = searchParams.get('section') || 'hero';
  const [activeTab, setActiveTab] = useState(sectionToTab[initialSection] || 'hero');

  useEffect(() => {
    const section = searchParams.get('section');
    if (section && sectionToTab[section]) setActiveTab(sectionToTab[section]);
  }, [searchParams]);

  useEffect(() => {
    getOrgHomepage()
      .then(res => { setHomepage(res.data.homepage); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const save = async (section, data) => {
    try {
      const res = await updateOrgHomepageSection(section, { [section]: data });
      setHomepage(res.data.homepage);
      showSuccess('Saved');
    } catch { showError('Failed to save'); }
  };

  const handlePublish = async () => {
    try {
      const res = await publishOrgHomepage(!homepage.isPublished);
      setHomepage(res.data.homepage);
      showSuccess(homepage.isPublished ? 'Unpublished' : 'Published');
    } catch { showError('Failed'); }
  };

  const add = async (fn, data, msg) => { try { const res = await fn(data); setHomepage(res.data.homepage); showSuccess(msg); } catch { showError('Failed'); } };
  const del = async (fn, i, msg) => { try { const res = await fn(i); setHomepage(res.data.homepage); showSuccess(msg); } catch { showError('Failed'); } };
  const update = async (fn, i, data, msg) => { try { const res = await fn(i, data); setHomepage(res.data.homepage); showSuccess(msg); } catch { showError('Failed'); } };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!homepage) return <div className="text-center py-8 text-gray-400">Website data not found</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Edit Website</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Customize your organization website</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <a href="/" target="_blank" rel="noreferrer" className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs sm:text-sm"><ExternalLink className="w-4 h-4" /> View Live</a>
          <button onClick={handlePublish} className={`flex-1 sm:flex-none text-xs sm:text-sm ${homepage.isPublished ? 'btn-danger' : 'btn-primary'}`}>{homepage.isPublished ? 'Unpublish' : 'Publish'}</button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === t.key
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === 'hero' && <>
          <HeroEditor homepage={homepage} onSave={(d) => save('hero', d)} />
          <CtaEditor homepage={homepage} onSave={(d) => save('cta', d)} />
        </>}

        {activeTab === 'content' && <>
          <AboutEditor homepage={homepage} onSave={(d) => save('about', d)} onAddFeature={(d) => add(addOrgFeature, d, 'Feature added')} onDeleteFeature={(i) => del(deleteOrgFeature, i, 'Deleted')} />
          <StatsEditor homepage={homepage} onSave={(d) => save('stats', d)} onAdd={(d) => add(addOrgStat, d, 'Stat added')} onDelete={(i) => del(deleteOrgStat, i, 'Deleted')} />
          <CertificationsEditor homepage={homepage} onSave={(d) => save('certifications', d)} onAdd={(d) => add(addOrgCertification, d, 'Certification added')} onDelete={(i) => del(deleteOrgCertification, i, 'Deleted')} />
        </>}

        {activeTab === 'verticals' && (
          <VerticalsEditor homepage={homepage} onSave={(d) => save('verticals', d)} onAdd={(d) => add(addOrgVertical, d, 'Vertical added')} onDelete={(i) => del(deleteOrgVertical, i, 'Deleted')} onUpdate={(i, d) => update(updateOrgVertical, i, d, 'Vertical updated')} />
        )}

        {activeTab === 'franchise' && (
          <FranchiseEditor homepage={homepage} onSave={(d) => save('franchise', d)} />
        )}

        {activeTab === 'services' && (
          <ServicesEditor homepage={homepage} onSave={(d) => save('services', d)} onAdd={(d) => add(addOrgService, d, 'Service added')} onDelete={(i) => del(deleteOrgService, i, 'Deleted')} />
        )}

        {activeTab === 'custom' && <>
          <CategoriesEditor homepage={homepage} onSave={(d) => save('categories', d)} />
          <VerifyWidgetEditor homepage={homepage} onSave={(d) => save('verifyWidget', d)} />
          <CentersStripEditor
            homepage={homepage}
            onUpdate={(d) => add(updateOrgCentersStrip, d, 'Centers strip saved')}
          />
          <CustomSectionsEditor
            homepage={homepage}
            onAddSection={(d) => add(addOrgCustomSection, d, 'Section created')}
            onUpdateSection={(id, d) => add(updateOrgCustomSection.bind(null, id), d, 'Section updated')}
            onDeleteSection={(id) => del(deleteOrgCustomSection.bind(null, id), null, 'Section deleted')}
            onAddCard={(sectionId, d) => add(addOrgCustomCard.bind(null, sectionId), d, 'Card added')}
            onDeleteCard={(sectionId, cardIndex) => del(deleteOrgCustomCard.bind(null, sectionId), cardIndex, 'Card deleted')}
          />
        </>}

        {activeTab === 'media' && <>
          <GalleryEditor homepage={homepage} onAdd={(d) => add(addOrgGalleryPhoto, d, 'Photo added')} onDelete={(i) => del(deleteOrgGalleryPhoto, i, 'Deleted')} onToggleFeatured={(i) => update(toggleOrgGalleryFeatured, i, null, 'Featured status updated')} />
          <TestimonialsEditor homepage={homepage} onSave={(d) => save('testimonials', d)} onAdd={(d) => add(addOrgTestimonial, d, 'Testimonial added')} onDelete={(i) => del(deleteOrgTestimonial, i, 'Deleted')} onUpdate={(i, d) => update(updateOrgTestimonial, i, d, 'Testimonial updated')} />
          <NoticesEditor homepage={homepage} onSave={(d) => save('notices', d)} onAdd={(d) => add(addOrgNotice, d, 'Notice added')} onDelete={(i) => del(deleteOrgNotice, i, 'Deleted')} onUpdate={(i, d) => update(updateOrgNotice, i, d, 'Notice updated')} />
        </>}

        {activeTab === 'layout' && <>
          <LayoutOrderEditor homepage={homepage} onSave={(d) => save('layoutOrder', d)} />
        </>}

        {activeTab === 'settings' && <>
          <CodeSeriesEditor homepage={homepage} onSave={(d) => save('codeSeriesConfig', d)} />
          <AnnouncementEditor homepage={homepage} onSave={(d) => save('announcement', d)} />
          <EnquiryConfigEditor homepage={homepage} onSave={(d) => save('enquiryConfig', d)} />
          <ContactEditor homepage={homepage} onSave={(d) => save('contact', d)} />
          <SettingsEditor homepage={homepage} onSave={async (d) => { try { const res = await updateOrgHomepage({ settings: d }); setHomepage(res.data.homepage); showSuccess('Settings saved'); } catch { showError('Failed'); } }} onHomepageUpdate={(hp) => setHomepage(hp)} />
        </>}
      </div>
    </div>
  );
}
