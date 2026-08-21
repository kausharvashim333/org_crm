import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { verifyCertificate, getOrgHomepagePublic } from '../../api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import { GraduationCap, Award, Search, CheckCircle, XCircle, Menu, X } from 'lucide-react';

export default function CertificateVerify() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orgData, setOrgData] = useState(null);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!code) return;
    setLoading(true);
    try {
      const res = await verifyCertificate(code);
      setResult(res.data.certificate);
    } catch (error) {
      setResult(null);
    }
    setSearched(true);
    setLoading(false);
  };

  useEffect(() => {
    if (searchParams.get('code')) handleVerify();
    getOrgHomepagePublic().then(res => setOrgData(res.data.homepage)).catch(() => {});
  }, []);

  const themeColor = orgData?.settings?.themeColor || '#2563eb';
  const orgName = orgData?.settings?.orgName || 'Skill India';
  const logo = orgData?.settings?.logo;

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO title="Verify Certificate - Training Institute" description="Verify the authenticity of your certificate online" />
      <Navbar />

      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="text-center mb-8">
          <Award className="w-16 h-16 mx-auto mb-4" style={{ color: themeColor }} />
          <h1 className="text-3xl font-bold mb-2" style={{ color: themeColor }}>Verify Certificate</h1>
          <p className="text-gray-500">Enter the certificate verification code to verify authenticity</p>
        </div>

        <form onSubmit={handleVerify} className="flex gap-2 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Enter verification code..." value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="input-field pl-10 uppercase" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary" style={{ backgroundColor: themeColor }}>{loading ? 'Verifying...' : 'Verify'}</button>
        </form>

        {searched && (
          <div className="card">
            {result ? (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-green-600 mb-4">Certificate Verified!</h2>
                <div className="text-left space-y-2 max-w-md mx-auto">
                  <div className="flex justify-between border-b py-2"><span className="text-gray-500">Certificate No:</span><span className="font-medium">{result.certificateNo}</span></div>
                  <div className="flex justify-between border-b py-2"><span className="text-gray-500">Student Name:</span><span className="font-medium">{result.studentId?.fullName}</span></div>
                  <div className="flex justify-between border-b py-2"><span className="text-gray-500">Course:</span><span className="font-medium">{result.courseId?.name}</span></div>
                  <div className="flex justify-between border-b py-2"><span className="text-gray-500">Institute:</span><span className="font-medium">{result.partnerId?.instituteName}</span></div>
                  <div className="flex justify-between border-b py-2"><span className="text-gray-500">Grade:</span><span className="font-medium">{result.grade || 'N/A'}</span></div>
                  <div className="flex justify-between border-b py-2"><span className="text-gray-500">Percentage:</span><span className="font-medium">{result.percentage || 'N/A'}%</span></div>
                  <div className="flex justify-between py-2"><span className="text-gray-500">Issue Date:</span><span className="font-medium">{result.issueDate ? new Date(result.issueDate).toLocaleDateString() : 'N/A'}</span></div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-red-600 mb-2">Certificate Not Found</h2>
                <p className="text-gray-500">The verification code is invalid or the certificate has not been issued.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer homepageData={orgData} />
    </div>
  );
}
