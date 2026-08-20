import { useState, useEffect } from 'react';
import { getBatches, getStudentAttendance, markStudentAttendance } from '../../api';
import { useToast } from '../../context/ToastContext';
import { Calendar, Check, X, Clock } from 'lucide-react';

export default function PartnerAttendance() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [batch, setBatch] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    getBatches({ status: 'active' }).then(res => { setBatches(res.data.batches); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      getBatches().then(res => {
        const b = res.data.batches.find(x => x._id === selectedBatch);
        setBatch(b);
        const init = {};
        b?.enrolledStudents?.forEach(s => { init[s._id] = 'present'; });
        setAttendance(init);
      });
      getStudentAttendance({ batchId: selectedBatch, date: selectedDate }).then(res => {
        if (res.data.records[0]) {
          const existing = {};
          res.data.records[0].records.forEach(r => { existing[r.studentId] = r.status; });
          setAttendance(existing);
        }
      }).catch(() => {});
    }
  }, [selectedBatch, selectedDate]);

  const handleMark = async () => {
    const records = Object.entries(attendance).map(([studentId, status]) => ({ studentId, status }));
    try {
      await markStudentAttendance({ batchId: selectedBatch, date: selectedDate, records });
      showSuccess('Attendance saved');
    } catch (error) { showError('Failed'); }
  };

  const setStatus = (studentId, status) => {
    setAttendance({ ...attendance, [studentId]: status });
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">Attendance</h1><p className="text-gray-500">Mark student attendance</p></div>
      <div className="card">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><label className="block text-sm font-medium mb-1">Batch</label><select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} className="input-field"><option value="">Select Batch...</option>{batches.map(b => <option key={b._id} value={b._id}>{b.name} ({b.courseId?.name})</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">Date</label><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="input-field" /></div>
        </div>
        {selectedBatch && batch && (
          <>
            <div className="space-y-2">
              {batch.enrolledStudents?.map(s => (
                <div key={s._id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div><p className="text-sm font-medium">{s.fullName}</p><p className="text-xs text-gray-500">{s.phone}</p></div>
                  <div className="flex gap-1">
                    <button onClick={() => setStatus(s._id, 'present')} className={`p-2 rounded-lg ${attendance[s._id] === 'present' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}><Check className="w-4 h-4" /></button>
                    <button onClick={() => setStatus(s._id, 'absent')} className={`p-2 rounded-lg ${attendance[s._id] === 'absent' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}><X className="w-4 h-4" /></button>
                    <button onClick={() => setStatus(s._id, 'late')} className={`p-2 rounded-lg ${attendance[s._id] === 'late' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-400'}`}><Clock className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              {(!batch.enrolledStudents || batch.enrolledStudents.length === 0) && <p className="text-center text-gray-400 py-4">No students enrolled</p>}
            </div>
            {batch.enrolledStudents?.length > 0 && <button onClick={handleMark} className="btn-primary w-full mt-4 flex items-center justify-center gap-2"><Calendar className="w-4 h-4" /> Save Attendance</button>}
          </>
        )}
        {!selectedBatch && <p className="text-center text-gray-400 py-8">Select a batch to mark attendance</p>}
      </div>
    </div>
  );
}
