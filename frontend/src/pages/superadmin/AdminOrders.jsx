import { useState, useEffect } from 'react';
import { getAdminOrders, updateAdminOrderStatus } from '../../api';
import { useToast } from '../../context/ToastContext';
import { Table, TableRow, TableCell } from '../../components/Table';
import Modal from '../../components/Modal';
import {
  ShoppingBag, IndianRupee, Search, Filter, CheckCircle2, Clock,
  AlertCircle, Eye, RefreshCw, FileText, Download, User, Phone, Mail, MapPin
} from 'lucide-react';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, completedOrders: 0, pendingOrders: 0, totalOrders: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  const { showSuccess, showError } = useToast();

  const fetchOrders = () => {
    setLoading(true);
    getAdminOrders({ search, status: statusFilter })
      .then((res) => {
        setOrders(res.data.orders || []);
        setStats(res.data.stats || { totalRevenue: 0, completedOrders: 0, pendingOrders: 0, totalOrders: 0 });
        setLoading(false);
      })
      .catch((err) => {
        showError('Failed to load orders');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(true);
    try {
      await updateAdminOrderStatus(orderId, { paymentStatus: newStatus });
      showSuccess(`Order status updated to ${newStatus}`);
      if (selectedOrder) {
        setSelectedOrder({ ...selectedOrder, paymentStatus: newStatus });
      }
      fetchOrders();
      setUpdating(false);
    } catch (err) {
      showError('Failed to update status');
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Stats Cards */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ShoppingBag className="w-7 h-7 text-indigo-600" /> Course Sales & Orders
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Monitor all course store purchases, revenue, invoices, and student enrollments.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sales Revenue</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              ₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Enrollments</div>
            <div className="text-2xl font-black text-indigo-600 mt-1">{stats.completedOrders || 0}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Orders</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{stats.pendingOrders || 0}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Store Transactions</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{stats.totalOrders || 0}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Order #, Name, Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <button
            onClick={fetchOrders}
            className="p-2 text-slate-500 hover:text-slate-700 bg-slate-50 border border-slate-200 rounded-xl"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Pending Orders Notice Banner */}
      {stats.pendingOrders > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-base shadow-xs animate-pulse flex-shrink-0">
              {stats.pendingOrders}
            </div>
            <div>
              <p className="font-bold text-amber-950 text-sm">{stats.pendingOrders} Course Order(s) Awaiting Payment Verification</p>
              <p className="text-xs text-amber-700">Review offline UPI QR / Direct orders and click 'Approve' to instantly activate student course LMS access.</p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('pending')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all self-start sm:self-auto"
          >
            Show Pending Orders
          </button>
        </div>
      )}

      {/* Orders Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading course orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">No course orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table headers={['Order & Invoice', 'Customer', 'Course', 'Amount', 'Date', 'Status', 'Actions']}>
              {orders.map((o) => (
                <TableRow key={o._id}>
                  <TableCell>
                    <div className="font-mono font-bold text-xs text-indigo-900">{o.orderNumber}</div>
                    <div className="font-mono text-[10px] text-slate-400">{o.invoiceNumber || 'No Invoice'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-xs text-slate-800">{o.customerName}</div>
                    <div className="text-[11px] text-slate-500">{o.customerPhone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-xs text-slate-800 line-clamp-1 max-w-[200px]">
                      {o.courseId?.name || 'Course'}
                    </div>
                    <span className="text-[10px] text-slate-400 capitalize">{o.learningMode?.replace('_', ' ') || 'Online'}</span>
                  </TableCell>
                  <TableCell>
                    <div className="font-black text-xs text-slate-900">₹{o.finalAmount?.toLocaleString('en-IN')}</div>
                    {o.couponCode && (
                      <div className="text-[10px] text-emerald-600 font-semibold">{o.couponCode} applied</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-slate-600">
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      o.paymentStatus === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : o.paymentStatus === 'pending'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {o.paymentStatus}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {o.paymentStatus === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(o._id, 'completed')}
                          disabled={updating}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                          title="Approve Order & Activate Student LMS Access"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          title={`Order Details: ${selectedOrder.orderNumber}`}
        >
          <div className="space-y-5 text-xs text-slate-700">
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <div className="text-slate-400 font-bold uppercase text-[10px]">Invoice Number</div>
                <div className="font-mono font-black text-sm text-indigo-900">{selectedOrder.invoiceNumber || 'INV-PENDING'}</div>
              </div>
              <div className="text-right">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Payment Status</div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  selectedOrder.paymentStatus === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedOrder.paymentStatus}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-bold text-slate-800 mb-1">Student / Buyer Details</div>
                <div>Name: <span className="font-semibold">{selectedOrder.customerName}</span></div>
                <div>Email: <span className="font-semibold">{selectedOrder.customerEmail}</span></div>
                <div>Phone: <span className="font-semibold">{selectedOrder.customerPhone}</span></div>
                {selectedOrder.customerCity && (
                  <div>City: {selectedOrder.customerCity}, {selectedOrder.customerState}</div>
                )}
              </div>

              <div>
                <div className="font-bold text-slate-800 mb-1">Transaction Details</div>
                <div>Amount Paid: <span className="font-bold text-sm text-emerald-600">₹{selectedOrder.finalAmount}</span></div>
                <div>Original Fee: ₹{selectedOrder.originalPrice}</div>
                {selectedOrder.discountAmount > 0 && (
                  <div>Discount: -₹{selectedOrder.discountAmount} ({selectedOrder.couponCode || 'Promo'})</div>
                )}
                <div>Gateway: <span className="font-mono uppercase">{selectedOrder.paymentGateway}</span></div>
              </div>
            </div>

            {selectedOrder.preferredFranchiseCenter && (
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <div className="font-bold text-indigo-950 mb-0.5">Assigned Hybrid Franchise Lab</div>
                <div>{selectedOrder.preferredFranchiseCenter.instituteName} ({selectedOrder.preferredFranchiseCenter.city})</div>
              </div>
            )}

            {/* Quick Status Action */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>Update Status:</span>
                <button
                  disabled={updating}
                  onClick={() => handleStatusChange(selectedOrder._id, 'completed')}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  Mark Completed
                </button>
                <button
                  disabled={updating}
                  onClick={() => handleStatusChange(selectedOrder._id, 'refunded')}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                >
                  Refund
                </button>
              </div>

              <a
                href={`/order-success/${selectedOrder._id}`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline font-bold"
              >
                Open Tax Invoice ↗
              </a>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
}
