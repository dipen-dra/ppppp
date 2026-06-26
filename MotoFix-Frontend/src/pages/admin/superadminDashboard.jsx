import React, { useState, useEffect, useRef } from 'react';
import { 
    Users, 
    Database, 
    Shield, 
    Search, 
    Plus, 
    Edit, 
    Trash2, 
    ChevronLeft, 
    ChevronRight, 
    X, 
    AlertTriangle, 
    LogOut, 
    Menu, 
    Activity, 
    RefreshCw, 
    CheckCircle, 
    XCircle, 
    Info 
} from 'lucide-react';
import { toast } from 'react-toastify';

const API_BASE_URL = "http://localhost:5050/api/admin";

// API helper utility
const apiFetch = async (endpoint, options = {}) => {
    const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        ...options.headers
    };
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'An error occurred with the API request.');
    }
    return response;
};

// UI Components
const Card = ({ children, className = '' }) => (
    <div className={`bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-6 transition-all duration-200 ${className}`}>
        {children}
    </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl shadow-[0_16px_64px_rgba(0,0,0,0.18)] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-[scaleIn_0.2s_ease]">
                <div className="px-6 py-5 border-b border-[rgba(0,0,0,0.07)] flex justify-between items-center flex-shrink-0">
                    <h3 className="text-base font-bold text-[#111118] tracking-tight">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg bg-[#F5F3E7] hover:bg-[#EDE9D5] text-[#4A4A65] hover:text-[#111118] transition-colors">
                        <X size={17} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

const Button = ({ children, onClick, className = '', variant = 'primary', ...props }) => {
    const baseClasses = "px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-sm cursor-pointer";
    const variants = {
        primary: "bg-gradient-to-r from-[#F5C000] to-[#E6B000] text-[#0D0D14] shadow-[0_4px_14px_rgba(245,192,0,0.3)] hover:shadow-[0_6px_20px_rgba(245,192,0,0.45)] hover:-translate-y-0.5",
        secondary: "bg-[#FDFDF8] text-[#4A4A65] hover:text-[#111118] border border-[rgba(0,0,0,0.1)] hover:border-[rgba(0,0,0,0.2)] hover:bg-[#F5F3E7]",
        danger: "bg-[rgba(220,38,38,0.1)] text-[#DC2626] border border-[rgba(220,38,38,0.2)] hover:bg-[rgba(220,38,38,0.18)] hover:border-[rgba(220,38,38,0.4)]",
    };
    return (<button onClick={onClick} className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>{children}</button>);
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmButtonVariant = 'danger' }) => {
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div className="text-center py-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-xl border border-[rgba(0,0,0,0.08)] bg-[rgba(220,38,38,0.08)]">
                    <AlertTriangle className="h-6 w-6 text-[#DC2626]" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#111118] tracking-tight">{title}</h3>
                <div className="mt-2 px-4 py-2"><p className="text-sm text-[#4A4A65]">{message}</p></div>
                <div className="flex justify-center gap-3 mt-6">
                    <Button variant="secondary" onClick={onClose} className="!px-6">Cancel</Button>
                    <Button variant={confirmButtonVariant} onClick={onConfirm} className="!px-6">{confirmText}</Button>
                </div>
            </div>
        </Modal>
    );
};

const Input = ({ id, label, className = '', ...props }) => (
    <div className="space-y-1.5 w-full">
        {label && <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-widest text-[#4A4A65]">{label}</label>}
        <input id={id} {...props} className={`w-full px-4 py-2.5 bg-[#FDFDF8] border border-[rgba(0,0,0,0.1)] rounded-xl text-sm text-[#111118] placeholder-[#8A8AA8] focus:outline-none focus:border-[#F5C000] focus:shadow-[0_0_0_3px_rgba(245,192,0,0.12)] disabled:bg-[#F5F3E7] disabled:text-[#8A8AA8] disabled:cursor-not-allowed transition-all duration-200 hover:border-[rgba(0,0,0,0.18)] ${className}`} />
    </div>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-between pt-4 mt-auto border-t border-[rgba(0,0,0,0.06)]">
            <Button variant="secondary" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="!px-3 !py-2 !text-xs">
                <ChevronLeft size={13} /> Prev
            </Button>
            <span className="text-xs font-semibold text-[#4A4A65]">Page {currentPage} / {totalPages}</span>
            <Button variant="secondary" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="!px-3 !py-2 !text-xs">
                Next <ChevronRight size={13} />
            </Button>
        </div>
    );
};

// Sidebar link helper
const NavLink = ({ page, icon: Icon, activePage, onLinkClick, children }) => {
    const isActive = activePage === page;
    return (
        <a
            href={`#/superadmin/${page}`}
            onClick={onLinkClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                isActive 
                    ? 'bg-[#F5C000] text-[#0D0D14] shadow-[0_4px_12px_rgba(245,192,0,0.25)]' 
                    : 'text-[#4A4A65] hover:text-[#111118] hover:bg-[#EDE9D5]'
            }`}
        >
            <Icon size={17} className={isActive ? 'text-[#0D0D14]' : 'text-[#8A8AA8]'} />
            <span>{children}</span>
        </a>
    );
};

// --- Page 1: Overview Dashboard ---
const OverviewPage = () => {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStats = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch('/audit-logs/stats');
            const data = await res.json();
            setStats(data.data);
        } catch (e) {
            toast.error("Failed to load audit statistics.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (isLoading) {
        return <div className="text-center py-20 text-[#8A8AA8] animate-pulse">Loading system statistics...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#111118] tracking-tight">Superadmin Security Center 🛡️</h1>
                <p className="text-sm text-[#4A4A65] mt-1">Global platform activity, lockouts, and security event distribution.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex items-center gap-4 bg-red-50/50 border-red-100">
                    <div className="p-3 bg-red-100 rounded-xl text-red-600"><AlertTriangle size={24} /></div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8AA8]">Failed Logins (24h)</p>
                        <h3 className="text-2xl font-bold text-red-600 mt-1">{stats?.last24h?.failedLogins || 0}</h3>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 bg-orange-50/50 border-orange-100">
                    <div className="p-3 bg-orange-100 rounded-xl text-orange-600"><Shield size={24} /></div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8AA8]">Locked Accounts (24h)</p>
                        <h3 className="text-2xl font-bold text-orange-600 mt-1">{stats?.last24h?.lockedAccounts || 0}</h3>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 bg-green-50/50 border-green-100">
                    <div className="p-3 bg-green-100 rounded-xl text-green-600"><Activity size={24} /></div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8AA8]">Active Security Monitoring</p>
                        <h3 className="text-lg font-bold text-green-700 mt-1">Healthy (100% SLA)</h3>
                    </div>
                </Card>
            </div>

            <Card>
                <h3 className="text-base font-bold text-[#111118] tracking-tight mb-4">Log Event Types (Last 7 Days)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[rgba(0,0,0,0.06)] text-xs font-semibold text-[#8A8AA8] uppercase tracking-wider bg-[#FAFAF5]">
                                <th className="py-3 px-4">Event Action</th>
                                <th className="py-3 px-4 text-center">Occurrences</th>
                                <th className="py-3 px-4 text-center">Failed Occurrences</th>
                                <th className="py-3 px-4 text-center">Risk Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.stats && stats.stats.length > 0 ? stats.stats.map(row => {
                                const isRisk = ['login_failed', 'account_locked', 'suspicious_activity', '2fa_verify_failed'].includes(row._id);
                                return (
                                    <tr key={row._id} className="border-b border-[rgba(0,0,0,0.04)] hover:bg-[#FAFAF5]">
                                        <td className="py-3 px-4 font-mono text-xs text-[#111118]">{row._id}</td>
                                        <td className="py-3 px-4 text-center text-sm font-semibold text-[#4A4A65]">{row.count}</td>
                                        <td className="py-3 px-4 text-center text-sm text-red-500">{row.failures || 0}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                                isRisk ? 'bg-red-50 text-red-600 border border-red-200/50' : 'bg-green-50 text-green-600 border border-green-200/50'
                                            }`}>
                                                {isRisk ? 'Elevated' : 'Standard'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-sm text-[#8A8AA8]">No events recorded in the last 7 days.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

// --- Page 2: Users Management ---
const UserFormModal = ({ isOpen, onClose, onSave, user }) => {
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', role: 'user', phone: '' });

    useEffect(() => {
        if (user) {
            setFormData({ fullName: user.fullName, email: user.email, role: user.role, phone: user.phone || '', password: '' });
        } else {
            setFormData({ fullName: '', email: '', password: '', role: 'user', phone: '' });
        }
    }, [user, isOpen]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = { ...formData };
        if (user && !data.password) {
            delete data.password;
        }
        onSave(data);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Edit User Role & Account' : 'Add New Crew Member'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input id="fullName" name="fullName" label="Full Name" value={formData.fullName} onChange={handleChange} required />
                <Input id="email" name="email" label="Email Address" type="email" value={formData.email} onChange={handleChange} required />
                <Input id="phone" name="phone" label="Phone Number" type="text" value={formData.phone} onChange={handleChange} />
                <Input id="password" name="password" label="Password" type="password" value={formData.password} onChange={handleChange} placeholder={user ? "Leave blank to keep current" : ""} required={!user} />
                
                <div>
                    <label htmlFor="role" className="block text-xs font-semibold uppercase tracking-widest text-[#4A4A65] mb-1.5">Security Role</label>
                    <select id="role" name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2.5 bg-[#FDFDF8] border border-[rgba(0,0,0,0.1)] rounded-xl text-sm focus:outline-none focus:border-[#F5C000]">
                        <option value="normal">Standard User (Customer)</option>
                        <option value="admin">Administrator (Workshop Staff)</option>
                        <option value="superadmin">Superadmin (Security Lead)</option>
                    </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary">{user ? 'Save Changes' : 'Create User'}</Button>
                </div>
            </form>
        </Modal>
    );
};

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [editingUser, setEditingUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const LIMIT = 10;

    const fetchUsers = async () => {
        try {
            const res = await apiFetch(`/users?page=${currentPage}&limit=${LIMIT}&search=${searchTerm}`);
            const data = await res.json();
            setUsers(data.data || []);
            setTotalPages(data.totalPages || 0);
        } catch (e) {
            toast.error("Failed to load user accounts.");
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [currentPage, searchTerm]);

    const handleSave = async (formData) => {
        try {
            if (editingUser) {
                // Update User Info & Role (promotions)
                await apiFetch(`/users/${editingUser._id}`, { method: 'PUT', body: JSON.stringify(formData) });
                // If promotion endpoint is separate:
                await apiFetch(`/users/${editingUser._id}/promote`, { method: 'PUT', body: JSON.stringify({ role: formData.role }) });
                toast.success('User updated successfully!');
            } else {
                await apiFetch('/users/create', { method: 'POST', body: JSON.stringify(formData) });
                toast.success('User created successfully!');
            }
            fetchUsers();
            setIsModalOpen(false);
        } catch (e) {
            toast.error(e.message || 'Failed to save user.');
        }
    };

    const confirmDelete = async () => {
        try {
            await apiFetch(`/users/${itemToDelete}`, { method: 'DELETE' });
            toast.success('User deleted successfully (cascade bookings purged).');
            fetchUsers();
        } catch (e) {
            toast.error(e.message || 'Failed to delete user.');
        } finally {
            setConfirmOpen(false);
            setItemToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#111118] tracking-tight">Identity & Access Control</h1>
                    <p className="text-sm text-[#4A4A65] mt-1">Audit credentials, assign roles, and handle account closures.</p>
                </div>
                <Button onClick={() => { setEditingUser(null); setIsModalOpen(true); }}><Plus size={16} />Add User Account</Button>
            </div>

            <Card className="p-0 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-[rgba(0,0,0,0.06)] bg-[#FAFAF5]">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8AA8]" size={15} />
                        <input 
                            type="text" 
                            placeholder="Search user email or name..." 
                            value={searchTerm} 
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[rgba(0,0,0,0.1)] focus:border-[#F5C000] focus:shadow-[0_0_0_3px_rgba(245,192,0,0.12)] focus:outline-none rounded-xl text-sm placeholder-[#8A8AA8] transition-all" 
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[rgba(0,0,0,0.06)] text-xs font-semibold text-[#8A8AA8] uppercase tracking-wider bg-[#FAFAF5]">
                                <th className="py-3.5 px-4">Name</th>
                                <th className="py-3.5 px-4">Email</th>
                                <th className="py-3.5 px-4">Role</th>
                                <th className="py-3.5 px-4">Created Date</th>
                                <th className="py-3.5 px-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? users.map(u => (
                                <tr key={u._id} className="border-b border-[rgba(0,0,0,0.04)] hover:bg-[#FAFAF5]">
                                    <td className="py-3 px-4 font-semibold text-sm text-[#111118]">{u.fullName}</td>
                                    <td className="py-3 px-4 text-sm text-[#4A4A65]">{u.email}</td>
                                    <td className="py-3 px-4">
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                                            u.role === 'superadmin' 
                                                ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                                : u.role === 'admin' 
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-xs font-mono text-[#8A8AA8]">{new Date(u.createdAt).toLocaleDateString()}</td>
                                    <td className="py-3 px-4">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => { setEditingUser(u); setIsModalOpen(true); }} className="p-1.5 rounded-lg border border-gray-200 hover:border-[#B8860B]/30 hover:bg-[#F5F3E7] text-[#4A4A65] hover:text-[#B8860B] transition-colors"><Edit size={13} /></button>
                                            <button onClick={() => { setItemToDelete(u._id); setConfirmOpen(true); }} className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"><Trash2 size={13} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-10 text-sm text-[#8A8AA8]">No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="p-4 bg-[#FAFAF5] border-t border-[rgba(0,0,0,0.06)]">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                )}
            </Card>

            <UserFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} user={editingUser} />
            <ConfirmationModal isOpen={isConfirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={confirmDelete} title="Delete Account" message="Permanently delete this account? Standard bookings linked to this email will be cascadingly purged." />
        </div>
    );
};

// --- Page 3: Audit Logs Viewer ---
const LogDetailModal = ({ isOpen, onClose, log }) => {
    if (!log) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Inspect Audit Event [${log.action}]`}>
            <div className="space-y-4 text-sm font-sans">
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                    <div>
                        <p className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider">Event ID</p>
                        <p className="font-mono text-xs text-[#111118] mt-1">{log._id}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider">Timestamp</p>
                        <p className="text-xs text-[#111118] mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                    <div>
                        <p className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider">Operator ID</p>
                        <p className="font-mono text-xs text-[#111118] mt-1">{log.userId || 'Guest / Unauthenticated'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider">Operator Email</p>
                        <p className="text-xs text-[#111118] mt-1">{log.userEmail || 'N/A'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                    <div>
                        <p className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider">IP Address</p>
                        <p className="font-mono text-xs text-[#111118] mt-1">{log.ip || '127.0.0.1'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider">Status</p>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-1 text-xs font-semibold rounded-full ${
                            log.status === 'success' ? 'bg-green-50 text-green-700' : log.status === 'failure' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                        }`}>
                            {log.status}
                        </span>
                    </div>
                </div>

                <div>
                    <p className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider mb-1.5">User Agent (Browser Metadata)</p>
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 font-mono text-xs text-gray-600 leading-normal max-h-20 overflow-y-auto">
                        {log.userAgent || 'Unknown/Local Client'}
                    </div>
                </div>

                <div>
                    <p className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider mb-1.5">Context Metadata Payload (Secure Redacted)</p>
                    <pre className="bg-gray-900 border border-gray-800 rounded-xl p-4 font-mono text-xs text-green-400 overflow-x-auto max-h-40">
                        {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                </div>

                <div className="flex justify-end pt-4">
                    <Button variant="secondary" onClick={onClose}>Close Inspector</Button>
                </div>
            </div>
        </Modal>
    );
};

const AuditLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [filterAction, setFilterAction] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const LIMIT = 15;

    const fetchLogs = async () => {
        try {
            const query = `/audit-logs?page=${currentPage}&limit=${LIMIT}&action=${filterAction}&status=${filterStatus}`;
            const res = await apiFetch(query);
            const data = await res.json();
            setLogs(data.data || []);
            setTotalPages(data.pagination?.totalPages || 0);
        } catch (e) {
            toast.error("Failed to load audit logs.");
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [currentPage, filterAction, filterStatus]);

    const handleInspect = (log) => {
        setSelectedLog(log);
        setIsDetailOpen(true);
    };

    const actionOptions = [
        "login_success", "login_failed", "login_otp_sent", "login_otp_verified", 
        "login_otp_failed", "account_locked", "account_unlocked", "logout", 
        "register", "password_changed", "password_reset_requested", "password_reset_completed", 
        "profile_updated", "profile_picture_updated", "2fa_setup_initiated", "2fa_enabled", 
        "2fa_disabled", "2fa_verify_failed", "data_exported", "booking_created", 
        "booking_updated", "booking_deleted", "suspicious_activity"
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#111118] tracking-tight">Security Audit Logs</h1>
                <p className="text-sm text-[#4A4A65] mt-1">Immutable platform access ledger. Records security actions, rate limit locks, and authentication state transitions.</p>
            </div>

            <Card className="p-0 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-[rgba(0,0,0,0.06)] bg-[#FAFAF5] flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                        <select 
                            value={filterAction} 
                            onChange={(e) => { setFilterAction(e.target.value); setCurrentPage(1); }}
                            className="px-3 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-xl text-xs focus:outline-none"
                        >
                            <option value="">Filter Action (All)</option>
                            {actionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>

                        <select 
                            value={filterStatus} 
                            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                            className="px-3 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-xl text-xs focus:outline-none"
                        >
                            <option value="">Filter Status (All)</option>
                            <option value="success">Success</option>
                            <option value="failure">Failure</option>
                            <option value="warning">Warning</option>
                        </select>
                    </div>

                    <button 
                        onClick={fetchLogs}
                        className="text-xs font-semibold text-[#B8860B] hover:text-[#E6B000] flex items-center gap-1.5 cursor-pointer bg-transparent border-0"
                    >
                        <RefreshCw size={13} /> Refresh logs
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[rgba(0,0,0,0.06)] text-xs font-semibold text-[#8A8AA8] uppercase tracking-wider bg-[#FAFAF5]">
                                <th className="py-3.5 px-4">Timestamp</th>
                                <th className="py-3.5 px-4">Operator Email</th>
                                <th className="py-3.5 px-4">Action</th>
                                <th className="py-3.5 px-4">IP Address</th>
                                <th className="py-3.5 px-4 text-center">Status</th>
                                <th className="py-3.5 px-4 text-center">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length > 0 ? logs.map(l => (
                                <tr key={l._id} className="border-b border-[rgba(0,0,0,0.04)] hover:bg-[#FAFAF5]">
                                    <td className="py-3.5 px-4 text-xs text-[#4A4A65]">{new Date(l.createdAt).toLocaleString()}</td>
                                    <td className="py-3.5 px-4 text-sm text-[#111118] font-medium">{l.userEmail || 'Guest / anonymous'}</td>
                                    <td className="py-3.5 px-4 text-xs font-mono text-indigo-600 bg-indigo-50/10 px-2 py-0.5 rounded">{l.action}</td>
                                    <td className="py-3.5 px-4 text-xs font-mono text-[#8A8AA8]">{l.ip || '127.0.0.1'}</td>
                                    <td className="py-3.5 px-4 text-center">
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                                            l.status === 'success' 
                                                ? 'bg-green-50 text-green-600 border-green-200/50' 
                                                : l.status === 'failure' 
                                                    ? 'bg-red-50 text-red-600 border-red-200/50' 
                                                    : 'bg-yellow-50 text-yellow-600 border-yellow-200/50'
                                        }`}>
                                            {l.status}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                        <button onClick={() => handleInspect(l)} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"><Info size={15} /></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-sm text-[#8A8AA8]">No logs recorded matching criteria.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="p-4 bg-[#FAFAF5] border-t border-[rgba(0,0,0,0.06)]">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                )}
            </Card>

            <LogDetailModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} log={selectedLog} />
        </div>
    );
};

// --- Main Superadmin Page SPA Shell ---
const SuperadminDashboard = () => {
    const [activePage, setActivePage] = useState(() => (window.location.hash.replace('#/superadmin/', '').split('/')[0] || 'dashboard'));
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLogoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

    const handleLogoutConfirm = () => {
        localStorage.clear();
        window.location.href = '/';
    };

    useEffect(() => {
        const handleHashChange = () => {
            const page = window.location.hash.replace('#/superadmin/', '').split('/')[0] || 'dashboard';
            setActivePage(page);
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard': return <OverviewPage />;
            case 'users': return <UsersPage />;
            case 'logs': return <AuditLogsPage />;
            default: window.location.hash = '#/superadmin/dashboard'; return <OverviewPage />;
        }
    };

    return (
        <div className="flex h-screen font-sans" style={{ background: '#FAFAF5' }}>
            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 z-40 flex lg:hidden transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="w-64 bg-[#F5F3E7] border-r border-black/08 shadow-2xl flex flex-col">
                    <div className="px-5 py-5 flex items-center justify-between border-b border-black/08">
                        <span className="text-lg font-black text-[#111118]">MotoFix <span className="text-purple-600 text-xs font-mono uppercase ml-1 block">Superadmin</span></span>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-[#8A8AA8] hover:text-[#111118]"><X size={18} /></button>
                    </div>
                    <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
                        <NavLink page="dashboard" icon={Shield} activePage={activePage} onLinkClick={() => setIsSidebarOpen(false)}>Overview</NavLink>
                        <NavLink page="users" icon={Users} activePage={activePage} onLinkClick={() => setIsSidebarOpen(false)}>Identity Control</NavLink>
                        <NavLink page="logs" icon={Database} activePage={activePage} onLinkClick={() => setIsSidebarOpen(false)}>Security Logs</NavLink>
                    </nav>
                    <div className="p-3 border-t border-black/08">
                        <button onClick={() => { setIsSidebarOpen(false); setLogoutConfirmOpen(true); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"><LogOut size={17} />Logout</button>
                    </div>
                </div>
                <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
            </div>

            {/* Desktop Sidebar */}
            <aside className="w-64 bg-[#F5F3E7] hidden lg:flex flex-col flex-shrink-0 border-r border-black/08 shadow-[2px_0_8px_rgba(0,0,0,0.04)]">
                <div className="px-5 py-5 border-b border-black/08">
                    <span className="text-lg font-black text-[#111118]">Moto<span className="text-[#B8860B]">Fix</span></span>
                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest block -mt-0.5">Superadmin Panel</span>
                </div>
                <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
                    <NavLink page="dashboard" icon={Shield} activePage={activePage} onLinkClick={() => {}}>Overview</NavLink>
                    <NavLink page="users" icon={Users} activePage={activePage} onLinkClick={() => {}}>Identity Control</NavLink>
                    <NavLink page="logs" icon={Database} activePage={activePage} onLinkClick={() => {}}>Security Logs</NavLink>
                </nav>
                <div className="p-3 border-t border-black/08">
                    <button onClick={() => setLogoutConfirmOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"><LogOut size={17} />Logout</button>
                </div>
            </aside>

            {/* Main Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 border-b border-black/08 bg-white/70 backdrop-blur-md flex items-center justify-between px-6 flex-shrink-0 z-30">
                    <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-[#4A4A65] p-2 hover:bg-[#F5F3E7] rounded-xl"><Menu size={20} /></button>
                    <div className="ml-auto flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center font-bold text-purple-700 text-sm">S</div>
                        <span className="text-xs font-bold text-[#4A4A65] font-mono">Sec_Officer</span>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-6 flex flex-col">
                    {renderPage()}
                </main>
            </div>

            <ConfirmationModal isOpen={isLogoutConfirmOpen} onClose={() => setLogoutConfirmOpen(false)} onConfirm={handleLogoutConfirm} title="Confirm Logout" message="Close your active superadmin session?" confirmText="Logout" />
        </div>
    );
};

export default SuperadminDashboard;
