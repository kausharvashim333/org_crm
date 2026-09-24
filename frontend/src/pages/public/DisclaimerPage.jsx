import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOrgHomepagePublic } from '../../api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import {
  ShieldAlert, AlertTriangle, Scale, BookOpen, GraduationCap,
  ExternalLink, CheckCircle2, Info, ArrowRight, HelpCircle
} from 'lucide-react';

const DEFAULT_DISCLAIMER_DATA = {
  title: 'Disclaimer & Legal Notice',
  subtitle: 'Important disclosures regarding our educational guidance, allied health consultations, and financial training modules.',
  lastUpdated: 'September 2026',
  stockMarket: {
    title: 'Disclaimer for Stock Market Training',
    badge: 'SEBI & Investment Risk Notice',
    content: 'Disclaimer: The content shared here is strictly for educational, informational, and analytical purposes only and does not constitute financial advice, an endorsement, or a recommendation to buy or sell any securities. Investments in securities markets are subject to market risks; read all related documents carefully before investing. We are not a SEBI-registered Investment Adviser (IA) or Research Analyst (RA). Viewers must consult a certified financial professional before making any investment decisions.',
  },
  educationalConsultant: {
    title: 'Educational Consultant Disclaimer for Lili Organisation',
    badge: 'Educational & Healthcare Consulting Notice',
    organizationName: 'Lili Organisation',
    sections: [
      {
        number: '1',
        title: 'General Information Only',
        content: 'The information, guidance, and recommendations provided by Lili Organisation regarding allied health courses, institutions, and career paths are for educational and informational purposes only. While we strive to keep all details accurate and up to date, academic programs, admission requirements, and course availability can change frequently and without notice.',
      },
      {
        number: '2',
        title: 'No Guarantee of Admission or Outcomes',
        content: 'Enlisting the consulting services of Lili Organisation does not guarantee admission into any specific college, university, or allied health program. Final admission decisions rest entirely with the respective educational institutions. Furthermore, we do not guarantee employment, salary levels, or specific career outcomes upon graduation.',
      },
      {
        number: '3',
        title: 'Licensing, Accreditation, and Certification Standards',
        content: 'Allied health professions are heavily regulated. Lili Organisation provides general advice regarding common industry pathways. However, it is the sole responsibility of the student to independently verify that their chosen program maintains the proper institutional accreditation and meets the specific state, national, or regional licensing and certification requirements for their intended place of practice.',
      },
      {
        number: '4',
        title: 'External Links and Third-Party Entities',
        content: 'Our services, materials, or website may reference third-party universities, clinical sites, or professional testing bodies. Lili Organisation does not endorse, control, or assume liability for the policies, tuition rates, curriculum changes, or actions of these independent institutions.',
      },
      {
        number: '5',
        title: 'Limitation of Liability',
        content: 'By using our consulting services, you agree that Lili Organisation is not legally or financially liable for any academic, professional, or financial decisions you make based on our advice. Students are strongly encouraged to verify all tuition costs, clinical placement requirements, and prerequisite courses directly with the institution\'s official admissions office before enrolling.',
      },
    ],
  },
  footerNotice: 'Please ensure you thoroughly review all institution guidelines, government accreditation records, and fee structures before confirming admissions or investments.',
};

export default function DisclaimerPage() {
  const [hp, setHp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrgHomepagePublic()
      .then((res) => {
        setHp(res.data.homepage);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const themeColor = hp?.settings?.themeColor || '#2563eb';
  const orgName = hp?.settings?.orgName || 'Skill India';
  const rawDisclaimer = hp?.disclaimer || {};

  const disclaimer = {
    ...DEFAULT_DISCLAIMER_DATA,
    ...rawDisclaimer,
    stockMarket: {
      ...DEFAULT_DISCLAIMER_DATA.stockMarket,
      ...(rawDisclaimer.stockMarket || {}),
    },
    educationalConsultant: {
      ...DEFAULT_DISCLAIMER_DATA.educationalConsultant,
      ...(rawDisclaimer.educationalConsultant || {}),
      sections: (rawDisclaimer.educationalConsultant?.sections && rawDisclaimer.educationalConsultant.sections.length > 0)
        ? rawDisclaimer.educationalConsultant.sections
        : DEFAULT_DISCLAIMER_DATA.educationalConsultant.sections,
    },
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <div>
        <SEO
          title={`Disclaimer & Legal Policy - ${orgName}`}
          description="Read our legal disclaimers regarding stock market training modules and educational consultant advisory services."
        />
        <Navbar />

        {/* Hero Section */}
        <section
          className="relative py-16 md:py-20 px-6 text-white overflow-hidden"
          style={{ background: `linear-gradient(135deg, #090e17 0%, #1e1b4b 60%, ${themeColor} 100%)` }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, white 1.5px, transparent 1.5px)',
              backgroundSize: '28px 28px',
            }}
          />

          <div className="max-w-4xl mx-auto relative z-10 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 border border-white/20 backdrop-blur-md text-indigo-200">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Official Legal Policy</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              {disclaimer.title}
            </h1>

            <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              {disclaimer.subtitle}
            </p>

            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
              <span>{disclaimer.lastUpdated ? `Last updated: ${disclaimer.lastUpdated}` : 'Regularly reviewed'}</span>
            </div>
          </div>
        </section>

        {/* Main Content Body */}
        <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="#stock-market-disclaimer"
              className="p-5 rounded-2xl bg-white border border-amber-200/90 shadow-sm hover:shadow-md transition-all flex items-start gap-4 group"
            >
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform flex-shrink-0">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">Section 1</span>
                <h3 className="font-bold text-slate-800 text-base group-hover:text-amber-700 transition-colors">
                  Stock Market Training Disclaimer
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  SEBI compliance, educational scope & financial risk disclosure.
                </p>
              </div>
            </a>

            <a
              href="#educational-consultant-disclaimer"
              className="p-5 rounded-2xl bg-white border border-indigo-200/90 shadow-sm hover:shadow-md transition-all flex items-start gap-4 group"
            >
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform flex-shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">Section 2</span>
                <h3 className="font-bold text-slate-800 text-base group-hover:text-indigo-700 transition-colors">
                  Educational Consultant Disclaimer
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Admission terms, accreditation standards & liability limitations.
                </p>
              </div>
            </a>
          </div>

          {/* Section 1: Stock Market Training Disclaimer */}
          <section
            id="stock-market-disclaimer"
            className="p-8 rounded-3xl bg-white border-2 border-amber-200/90 shadow-sm relative overflow-hidden space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
                    {disclaimer.stockMarket.badge || 'Financial Market Risk Notice'}
                  </span>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
                    {disclaimer.stockMarket.title}
                  </h2>
                </div>
              </div>
            </div>

            {/* Content Callout Box */}
            <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-slate-800 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-3">
                  <p className="text-sm md:text-base leading-relaxed text-slate-800 font-medium">
                    {disclaimer.stockMarket.content}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Key Takeaways */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <p className="text-xs font-bold text-slate-700">Educational Purpose Only</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Not an offer, solicitation or personal investment advice.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <p className="text-xs font-bold text-slate-700">Not SEBI Registered</p>
                <p className="text-[11px] text-slate-500 mt-0.5">We are not SEBI Registered Investment Advisers (IA/RA).</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <p className="text-xs font-bold text-slate-700">Consult Certified Advisors</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Seek guidance from licensed financial planners before trading.</p>
              </div>
            </div>
          </section>

          {/* Section 2: Educational Consultant Disclaimer (Lili Organisation) */}
          <section
            id="educational-consultant-disclaimer"
            className="p-8 rounded-3xl bg-white border-2 border-indigo-200/90 shadow-sm relative overflow-hidden space-y-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-black uppercase tracking-wider">
                    {disclaimer.educationalConsultant.badge || 'Academic Advisory Policy'}
                  </span>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
                    {disclaimer.educationalConsultant.title}
                  </h2>
                </div>
              </div>
            </div>

            {/* Structured Points */}
            <div className="space-y-5">
              {disclaimer.educationalConsultant.sections?.map((sec, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-indigo-300 transition-all space-y-2 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-500/30">
                      {sec.number || idx + 1}
                    </span>
                    <h3 className="font-bold text-slate-800 text-base md:text-lg group-hover:text-indigo-700 transition-colors">
                      {sec.title}
                    </h3>
                  </div>
                  <p className="text-sm md:text-base text-slate-650 leading-relaxed pl-10 text-slate-700 font-normal">
                    {sec.content}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Advisory Notice Banner */}
          {disclaimer.footerNotice && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-indigo-300">Important Candidate Advisory</h4>
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-3xl">
                    {disclaimer.footerNotice}
                  </p>
                </div>
              </div>
              <Link
                to="/contact"
                className="px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors whitespace-nowrap self-stretch md:self-auto text-center"
              >
                Contact Support
              </Link>
            </div>
          )}

          {/* Questions Callout */}
          <div className="text-center py-6 border-t border-slate-200 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Have questions regarding our legal disclosures?</p>
            <p className="text-sm text-slate-700">
              Please feel free to reach out to our administration office via our{' '}
              <Link to="/contact" className="text-indigo-600 font-bold underline hover:text-indigo-800">
                Contact Page
              </Link>
              .
            </p>
          </div>
        </main>
      </div>

      <Footer homepageData={hp} />
    </div>
  );
}
