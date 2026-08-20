import { useState } from 'react';
import { broadcastNotification } from '../../api';
import { useToast } from '../../context/ToastContext';
import { Bell, Send } from 'lucide-react';

export default function AdminNotifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const { showSuccess, showError } = useToast();

  const handleSend = async (e) => {
    e.preventDefault();
    try { await broadcastNotification({ title, message }); showSuccess('Notification sent to all partners'); setTitle(''); setMessage(''); }
    catch (error) { showError('Failed to send'); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">Notifications</h1><p className="text-gray-500">Send broadcast to all partners</p></div>
      <div className="card max-w-2xl">
        <form onSubmit={handleSend} className="space-y-4">
          <div className="flex items-center gap-2 text-gray-700 mb-2"><Bell className="w-5 h-5" /><span className="font-medium">Broadcast Notice</span></div>
          <div><label className="block text-sm font-medium mb-1">Title *</label><input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" /></div>
          <div><label className="block text-sm font-medium mb-1">Message *</label><textarea rows="4" required value={message} onChange={(e) => setMessage(e.target.value)} className="input-field" /></div>
          <button type="submit" className="btn-primary flex items-center gap-2"><Send className="w-4 h-4" /> Send to All Partners</button>
        </form>
      </div>
    </div>
  );
}
