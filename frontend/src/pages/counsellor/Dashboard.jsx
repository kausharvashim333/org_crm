import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCounsellorPortal, updateCounsellingBooking, createCounsellingSlot, deleteCounsellingSlot,
  sendCounsellingRecording, resendCounsellingJoin,
} from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LogOut, Calendar, Users } from 'lucide-react';

export default function CounsellorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [data, setData] = useState({ sessions: [], bookings: [], slots: [], services: [] });
  const [slotForm, setSlotForm] = useState({ serviceId: '', startAt: '' });
  const [recUrl, setRecUrl] = useState({});

  const load = () => getCounsellorPortal().then((res) => setData(res.data)).catch(() => showError('Failed to load'));
  useEffect(() => { load(); }, []);

  const patch = async (id, body, msg) => {
    try {
      await updateCounsellingBooking(id, body);
      showSuccess(msg);
      load();
    } catch (e) {
      showError(e.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">Counsellor portal</p>
          <h1 className="font-black text-slate-800">{user?.name}</h1>
        </div>
        <button
          type="button"
          className="text-sm flex items-center gap-1 text-slate-600"
          onClick={() => { logout(); navigate('/counsellor/login'); }}
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </header>
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <section className="card space-y-3">
          <h2 className="font-bold flex items-center gap-2"><Calendar className="w-4 h-4" /> Assigned group sessions</h2>
          {data.sessions.length === 0 && <p className="text-sm text-slate-400">None assigned.</p>}
          {data.sessions.map((s) => (
            <div key={s._id} className="border rounded-xl p-3 text-sm space-y-2">
              <p className="font-semibold">{s.title} · {s.date ? new Date(s.date).toLocaleDateString() : ''} {s.startTime}</p>
              <div className="flex gap-2">
                <input className="input-field text-xs" placeholder="Recording URL" value={recUrl[s._id] || s.recordingUrl || ''} onChange={(e) => setRecUrl({ ...recUrl, [s._id]: e.target.value })} />
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={async () => {
                    try {
                      await sendCounsellingRecording(s._id, { recordingUrl: recUrl[s._id] || s.recordingUrl });
                      showSuccess('Recording emailed to paid attendees');
                    } catch (e) { showError(e.response?.data?.message || 'Failed'); }
                  }}
                >
                  Email recording
                </button>
              </div>
            </div>
          ))}
        </section>

        <section className="card space-y-3">
          <h2 className="font-bold">1-on-1 slots</h2>
          <form
            className="flex flex-wrap gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await createCounsellingSlot(slotForm);
                showSuccess('Slot added');
                setSlotForm({ serviceId: data.services[0]?._id || '', startAt: '' });
                load();
              } catch (err) { showError(err.response?.data?.message || 'Failed'); }
            }}
          >
            <select required className="input-field text-xs" value={slotForm.serviceId} onChange={(e) => setSlotForm({ ...slotForm, serviceId: e.target.value })}>
              <option value="">Service</option>
              {data.services.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <input required type="datetime-local" className="input-field text-xs" value={slotForm.startAt} onChange={(e) => setSlotForm({ ...slotForm, startAt: e.target.value })} />
            <button className="btn-primary text-xs">Add slot</button>
          </form>
          {data.slots.map((sl) => (
            <div key={sl._id} className="flex justify-between text-xs border rounded-lg p-2">
              <span>{new Date(sl.startAt).toLocaleString()} · {sl.status}</span>
              {sl.status !== 'booked' && (
                <button type="button" className="text-red-600" onClick={async () => { await deleteCounsellingSlot(sl._id); load(); }}>Delete</button>
              )}
            </div>
          ))}
        </section>

        <section className="card space-y-3">
          <h2 className="font-bold flex items-center gap-2"><Users className="w-4 h-4" /> Paid bookings</h2>
          {data.bookings.map((b) => (
            <div key={b._id} className="border rounded-xl p-3 text-xs space-y-1">
              <p className="font-bold">{b.bookingCode} · {b.name} · {b.phone}</p>
              <p>{b.itemTitle} · {b.status}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="text-emerald-700" onClick={() => patch(b._id, { attended: true }, 'Attended')}>Attended</button>
                <button type="button" className="text-amber-700" onClick={() => patch(b._id, { status: 'no_show' }, 'No-show')}>No-show</button>
                <button type="button" className="text-indigo-700" onClick={() => {
                  const course = window.prompt('Admission course', b.convertedCourse || '');
                  if (course === null) return;
                  patch(b._id, { convertedToAdmission: true, convertedCourse: course }, 'Converted');
                }}>Converted</button>
                <button type="button" className="text-slate-700" onClick={async () => {
                  try { await resendCounsellingJoin(b._id); showSuccess('Join email sent'); }
                  catch (e) { showError(e.response?.data?.message || 'Failed'); }
                }}>Resend join email</button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
