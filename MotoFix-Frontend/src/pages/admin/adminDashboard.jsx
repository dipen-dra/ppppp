import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus, Edit, Trash2, Search, Users, Wrench, DollarSign, List, User, LogOut, Menu, X, Sun, Moon, Camera, AlertTriangle, ArrowLeft, MapPin, ChevronLeft, ChevronRight, MessageSquare, Send, Inbox, Paperclip, FileText, XCircle, Star, MessageCircle as ReviewIcon, ChevronDown } from 'lucide-react'; // Import ChevronDown
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import GeminiChatbot from '../../components/GeminiChatbot'; // Import the Gemini AI Chatbot component

const API_BASE_URL = "http://localhost:5050/api/admin";
const socket = io.connect("http://localhost:5050");

// API fetch utility
const apiFetch = async (endpoint, options = {}) => {
    const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        ...options.headers
    };
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'An error occurred with the API request.');
    }
    return response;
};

// --- START: Helper & Shared Components ---

// StarRating Helper Component
const StarRating = ({ rating = 0 }) => {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((index) => (
                <Star
                    key={index}
                    size={16}
                    className={`transition-colors duration-200 ${
                        rating >= index
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                    }`}
                />
            ))}
        </div>
    );
};

const getStatusColor = (status) => {
    switch (status) {
        case 'Completed': return 'bg-[rgba(22,163,74,0.1)] text-[#16A34A] border border-[rgba(22,163,74,0.2)]';
        case 'In Progress': return 'bg-[rgba(245,192,0,0.1)] text-[#B8860B] border border-[rgba(245,192,0,0.25)]';
        case 'Pending': return 'bg-[rgba(217,119,6,0.1)] text-[#D97706] border border-[rgba(217,119,6,0.2)]';
        case 'Cancelled': return 'bg-[rgba(220,38,38,0.1)] text-[#DC2626] border border-[rgba(220,38,38,0.2)]';
        default: return 'bg-[rgba(0,0,0,0.05)] text-[#4A4A65] border border-[rgba(0,0,0,0.1)]';
    }
};
const Card = ({ children, className = '', ...props }) => (
    <div {...props} className={`bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-6 transition-all duration-200 ${className}`}>
        {children}
    </div>
);
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" style={{ animation: 'fadeIn 0.2s ease' }}>
            <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl shadow-[0_16px_64px_rgba(0,0,0,0.18)] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" style={{ animation: 'scaleIn 0.25s ease' }}>
                <div className="px-6 py-5 border-b border-[rgba(0,0,0,0.07)] flex justify-between items-center flex-shrink-0">
                    <h3 className="text-base font-bold text-[#111118] tracking-tight">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg bg-[#F5F3E7] hover:bg-[#EDE9D5] text-[#4A4A65] hover:text-[#111118] transition-colors"><X size={17} /></button>
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
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmButtonVariant = 'danger', Icon = AlertTriangle, iconColor = 'text-[#DC2626]', iconBgColor = 'bg-[rgba(220,38,38,0.08)]' }) => {
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div className="text-center py-4">
                <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-xl border border-[rgba(0,0,0,0.08)] ${iconBgColor}`}><Icon className={`h-6 w-6 ${iconColor}`} /></div>
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
const StatusBadge = ({ status }) => {
    const dotColors = {
        'Completed': 'bg-[#16A34A]',
        'In Progress': 'bg-[#F5C000] animate-pulse',
        'Pending': 'bg-[#D97706] animate-pulse',
        'Cancelled': 'bg-[#DC2626]',
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full ${getStatusColor(status)}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[status] || 'bg-[#8A8AA8]'}`}></span>
            {status}
        </span>
    );
};
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-between pt-4 mt-auto border-t border-[rgba(0,0,0,0.06)]">
            <Button variant="secondary" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="!px-3 !py-2 !text-xs">
                <ChevronLeft size={13} /> Prev
            </Button>
            <span className="text-xs font-semibold text-[#4A4A65]">Page {totalPages > 0 ? currentPage : 0} / {totalPages > 0 ? totalPages : 0}</span>
            <Button variant="secondary" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="!px-3 !py-2 !text-xs">
                Next <ChevronRight size={13} />
            </Button>
        </div>
    );
};
// --- END: Helper & Shared Components ---


// --- START: Page Specific Components ---

// NEW COMPONENT - ReviewsModal
const ReviewsModal = ({ isOpen, onClose, serviceId }) => {
    const [service, setService] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && serviceId) {
            const fetchReviews = async () => {
                setIsLoading(true);
                try {
                    const response = await apiFetch(`/services/${serviceId}/reviews`);
                    const data = await response.json();
                    setService(data.data);
                } catch (error) {
                    toast.error("Failed to fetch reviews.");
                    onClose();
                } finally {
                    setIsLoading(false);
                }
            };
            fetchReviews();
        }
    }, [isOpen, serviceId]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Reviews — "${service?.name || ''}"` }>
            {isLoading ? (
                <div className="text-center p-8 text-garage-400 font-body">Loading reviews...</div>
            ) : !service || service.reviews.length === 0 ? (
                <div className="text-center p-8">
                    <ReviewIcon size={44} className="mx-auto text-garage-600" />
                    <p className="mt-4 text-sm text-garage-400 font-body">No reviews have been submitted for this service yet.</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {service.reviews.slice().reverse().map((review) => (
                        <div key={review._id} className="flex gap-4 border-b border-garage-600 pb-5 last:pb-0 last:border-b-0">
                            <div className="flex-shrink-0">
                                {review.user && review.user.profilePicture ? (
                                    <img
                                        src={`http://localhost:5050/${review.user.profilePicture}`}
                                        alt={review.user.fullName}
                                        className="w-10 h-10 rounded-full object-cover bg-garage-700 ring-2 ring-garage-600"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-spark-500/10 border border-spark-500/30 flex items-center justify-center font-black text-lg text-spark-500 font-display">
                                        {(review.user?.fullName || review.username || 'U').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-chrome-500 font-display text-sm">{review.user?.fullName || review.username}</h4>
                                    <span className="text-[10px] text-garage-500 font-mono">{new Date(review.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="my-1"><StarRating rating={review.rating} /></div>
                                <p className="text-garage-300 text-sm font-body">{review.comment}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    );
};

const AdminChatPage = () => {
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    const [itemToClear, setItemToClear] = useState(null);
    const chatBodyRef = useRef(null);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    
    const fetchConversations = async () => {
        try {
            const response = await apiFetch('/chat/users');
            const data = await response.json();
            const sortedData = (data.data || []).sort((a, b) => new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp));
            setConversations(sortedData);
        } catch (error) { toast.error('Failed to fetch chat conversations.'); }
    };

    useEffect(() => { fetchConversations(); }, []);

    useEffect(() => {
        const newMessageListener = (data) => {
            const roomUserId = data.room.replace('chat-', '');
            const isChatActive = activeConversation?._id === roomUserId;
            const isFromAdmin = data.authorId === 'admin_user';

            // if (isChatActive) {
            //     setMessages((prev) => [...prev, data]);
            // }


            if (isFromAdmin && isChatActive) {
            // We only need to update the conversation list, not the active messages.
            } else if (isChatActive) {
                // Add message to the active chat window only if it's from the user.
                setMessages((prev) => [...prev, data]);
            }

            setConversations(prevConvos => {
                let convoExists = false;
                const updatedConvos = prevConvos.map(convo => {
                    if (convo._id === roomUserId) {
                        convoExists = true;
                        return { 
                            ...convo, 
                            lastMessage: isFromAdmin 
                                ? convo.lastMessage 
                                : (data.message || `Sent a ${data.fileType ? data.fileType.split('/')[0] : 'file'}`),
                            lastMessageTimestamp: data.createdAt, 
                            unreadCount: !isChatActive && !isFromAdmin ? (convo.unreadCount || 0) + 1 : convo.unreadCount
                        };
                    }
                    return convo;
                });

                if (!convoExists) {
                    fetchConversations();
                    return prevConvos;
                }
                
                updatedConvos.sort((a, b) => new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp));
                return updatedConvos;
            });
        };

        const messagesReadListener = (data) => {
            const roomUserId = data.room.replace('chat-', '');
            setConversations(prevConvos => prevConvos.map(convo => convo._id === roomUserId ? { ...convo, unreadCount: 0 } : convo));
        };

        socket.on('receive_message', newMessageListener);
        socket.on('messages_read_by_admin', messagesReadListener);
        return () => {
            socket.off('receive_message', newMessageListener);
            socket.off('messages_read_by_admin', messagesReadListener);
        };
    }, [activeConversation]);

    useEffect(() => {
        if (activeConversation) {
            const roomName = `chat-${activeConversation._id}`;
            const historyListener = (history) => {
                const firstMsgRoom = history.length > 0 ? history[0].room : `chat-${activeConversation._id}`;
                if (firstMsgRoom === roomName) {
                    setMessages(history);
                }
            };
            socket.on('chat_history', historyListener);
            socket.emit('join_room', { roomName: `chat-${activeConversation._id}`, userId: 'admin_user' });
            return () => { socket.off('chat_history', historyListener); };
        }
    }, [activeConversation]);

    useEffect(() => {
        if (chatBodyRef.current) { chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight; }
    }, [messages]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            if (file.type.startsWith('image/')) { setPreviewUrl(URL.ObjectURL(file)); } else { setPreviewUrl(null); }
        }
        event.target.value = null;
    };
    
    const handleRemovePreview = () => { setSelectedFile(null); setPreviewUrl(null); };

    const handleSendMessage = async () => {
        if (!activeConversation || (currentMessage.trim() === '' && !selectedFile)) return;
        if (selectedFile) {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('room', `chat-${activeConversation._id}`);
            formData.append('author', 'Admin');
            formData.append('authorId', 'admin_user');
            if (currentMessage.trim() !== '') { formData.append('message', currentMessage); }
            try { await apiFetch('/chat/upload', { method: 'POST', body: formData }); }
            catch (error) { toast.error(`File upload failed: ${error.message}`); }
            finally { setIsUploading(false); handleRemovePreview(); setCurrentMessage(''); }
        } else {
            const messageData = { room: `chat-${activeConversation._id}`, author: 'Admin', authorId: 'admin_user', message: currentMessage, createdAt: new Date().toISOString() };
            socket.emit('send_message', messageData);
            setMessages(prev => [...prev, messageData]);
            setCurrentMessage('');
        }
    };

    const handleSelectConversation = (user) => {
        if (activeConversation?._id !== user._id) {
            setMessages([]);
            setActiveConversation(user);
            handleRemovePreview();
        }
    };
    
    const handleClearClick = (user) => { setItemToClear(user); setConfirmOpen(true); };

    const confirmClearChat = async () => {
        if (!itemToClear) return;
        try {
            await apiFetch(`/chat/clear/${itemToClear._id}`, { method: 'PUT' });
            toast.success(`Chat history with ${itemToClear.fullName} has been cleared from your view.`);
            if (activeConversation?._id === itemToClear._id) {
                setActiveConversation(null);
                setMessages([]);
            }
            fetchConversations();
        } catch (error) { toast.error(error.message || 'Failed to clear chat history.'); }
        finally { setConfirmOpen(false); setItemToClear(null); }
    };

    const handleImageError = (e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.dataset.name || 'U')}&background=e2e8f0&color=4a5568&size=40`; };
    
    const renderFileContent = (msg) => {
        if (msg.fileType?.startsWith('image/')) { return (<a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="block"><img src={msg.fileUrl} alt={msg.fileName || 'Sent Image'} className="max-w-xs rounded-lg mt-1" /></a>); }
        return (<a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" download={msg.fileName} className="flex items-center gap-3 bg-black/10 dark:bg-white/10 p-3 rounded-lg hover:bg-black/20 dark:hover:bg-white/20 transition-colors mt-1"><FileText size={32} className="flex-shrink-0" /><span className="truncate font-medium">{msg.fileName || 'Download File'}</span></a>);
    };

    return (
        <div className="space-y-6">
            <div className="border-b border-[rgba(0,0,0,0.06)] pb-5">
                <h1 className="text-3xl md:text-4xl font-black font-display text-[#111118] uppercase tracking-wider">Customer Chats</h1>
                <p className="text-xs text-[#8A8AA8] font-body mt-1">Real-time support thread management with all customers.</p>
            </div>
            <Card className="p-0 flex overflow-hidden border border-[rgba(0,0,0,0.08)] bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)]" style={{ height: 'calc(80vh - 2rem)' }}>
                {/* Conversation List */}
                <div className="w-80 flex-shrink-0 border-r border-[rgba(0,0,0,0.08)] flex flex-col bg-[#F5F3E7]">
                    <div className="p-4 border-b border-[rgba(0,0,0,0.06)]">
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-[#4A4A65]">Conversations</h2>
                    </div>
                    <ul className="divide-y divide-[rgba(0,0,0,0.05)] overflow-y-auto flex-1">
                        {conversations.map(user => (
                            <li key={user._id} className={`flex items-center gap-3 relative transition-colors group ${activeConversation?._id === user._id ? 'bg-[rgba(245,192,0,0.08)] border-l-2 border-[#F5C000]' : 'border-l-2 border-transparent hover:bg-[rgba(0,0,0,0.02)]'}`}>
                                <div onClick={() => handleSelectConversation(user)} className="p-4 flex-grow flex items-center gap-3 cursor-pointer">
                                    <img src={user.profilePicture ? `http://localhost:5050/${user.profilePicture}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'U')}&background=F5C000&color=111118&size=40`} alt={user.fullName} className="w-9 h-9 rounded-full object-cover ring-2 ring-[rgba(0,0,0,0.05)]" data-name={user.fullName} onError={handleImageError} />
                                    <div className="flex-grow overflow-hidden">
                                        <p className={`truncate text-sm font-display ${user.unreadCount > 0 ? 'font-black text-[#F5C000]' : 'font-semibold text-[#111118]'}`}>{user.fullName}</p>
                                        <p className="text-[11px] text-[#8A8AA8] truncate font-body mt-0.5">{user.lastMessage}</p>
                                    </div>
                                    {user.unreadCount > 0 && <span className="bg-[#F5C000] text-[#111118] text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">{user.unreadCount}</span>}
                                </div>
                                <div className="pr-2">
                                    <button onClick={() => handleClearClick(user)} className="p-1.5 rounded text-[#8A8AA8] hover:bg-[rgba(220,38,38,0.1)] hover:text-[#DC2626] opacity-0 group-hover:opacity-100 transition-all" title={`Clear chat with ${user.fullName}`}><Trash2 size={14} /></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                {/* Chat Window */}
                <div className="flex-1 flex flex-col bg-[#FDFDF8]">
                    {activeConversation ? (
                        <>
                            <div className="p-4 border-b border-[rgba(0,0,0,0.06)] flex items-center gap-3 bg-white/80 backdrop-blur-sm flex-shrink-0">
                                <img src={activeConversation.profilePicture ? `http://localhost:5050/${activeConversation.profilePicture}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConversation.fullName || 'U')}&background=F5C000&color=111118&size=40`} alt={activeConversation.fullName} className="w-9 h-9 rounded-full object-cover ring-2 ring-[#F5C000]/30" data-name={activeConversation.fullName} onError={handleImageError} />
                                <div><h3 className="font-bold text-[#111118] text-sm font-display">{activeConversation.fullName}</h3><p className="text-[10px] text-[#8A8AA8] font-mono">{activeConversation.email}</p></div>
                            </div>
                            <div className="flex-grow overflow-y-auto p-4 space-y-1.5" ref={chatBodyRef}>
                                {messages.map((msg, index) => {
                                    const isAdmin = msg.authorId === 'admin_user';
                                    const prevMsg = messages[index - 1]; const nextMsg = messages[index + 1];
                                    const isFirstInGroup = !prevMsg || prevMsg.authorId !== msg.authorId;
                                    const isLastInGroup = !nextMsg || nextMsg.authorId !== msg.authorId;
                                    return (
                                        <div key={msg._id || index} className={`flex items-end gap-2 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                            {!isAdmin && (<div className="w-8 flex-shrink-0 self-end">{isLastInGroup && <img src={activeConversation.profilePicture ? `http://localhost:5050/${activeConversation.profilePicture}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConversation.fullName || 'U')}&background=e2e8f0&color=4a5568&size=40`} alt="p" className="w-7 h-7 rounded-full object-cover" />}</div>)}
                                            <div className={`py-2.5 px-3.5 max-w-md ${isAdmin ? 'bg-gradient-to-r from-[#F5C000] to-[#E6B000] text-[#111118]' : 'bg-[#F5F3E7] border border-[rgba(0,0,0,0.05)] text-[#111118]'} ${isFirstInGroup && isLastInGroup ? 'rounded-2xl' : ''} ${isAdmin ? `${isFirstInGroup ? 'rounded-t-2xl rounded-bl-2xl' : 'rounded-l-2xl'} ${isLastInGroup ? 'rounded-b-2xl' : ''} ${!isFirstInGroup && !isLastInGroup ? 'rounded-l-2xl rounded-r-md' : ''} ${isFirstInGroup && !isLastInGroup ? 'rounded-tr-md' : ''} ${!isFirstInGroup && isLastInGroup ? 'rounded-br-md' : ''}` : `${isFirstInGroup ? 'rounded-t-2xl rounded-br-2xl' : 'rounded-r-2xl'} ${isLastInGroup ? 'rounded-b-2xl' : ''} ${!isFirstInGroup && !isLastInGroup ? 'rounded-r-2xl rounded-l-md' : ''} ${isFirstInGroup && !isLastInGroup ? 'rounded-tl-md' : ''} ${!isFirstInGroup && isLastInGroup ? 'rounded-bl-md' : ''}`}`}>
                                                {msg.fileUrl && renderFileContent(msg)}
                                                {msg.message && <p className="text-sm font-body" style={{ overflowWrap: 'break-word' }}>{msg.message}</p>}
                                                <p className={`text-[9px] text-right mt-1 ${isAdmin ? 'text-[#111118]/60' : 'text-[#8A8AA8]'}`}>{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="p-3 border-t border-[rgba(0,0,0,0.06)] bg-white flex-shrink-0">
                                {(previewUrl || selectedFile) && (<div className="mb-2 p-2 bg-[#F5F3E7] border border-[rgba(0,0,0,0.08)] rounded-lg flex items-center justify-between">{previewUrl ? <img src={previewUrl} alt="Preview" className="h-14 w-14 object-cover rounded border border-[rgba(0,0,0,0.08)]" /> : <div className="flex items-center gap-2 text-[#4A4A65] text-xs font-body"><FileText size={16} /><span>{selectedFile.name}</span></div>}<button onClick={handleRemovePreview} className="text-[#8A8AA8] hover:text-[#DC2626] transition-colors"><XCircle size={18} /></button></div>)}
                                <div className="flex items-center gap-2">
                                    <div className="flex">
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" /><input type="file" ref={cameraInputRef} onChange={handleFileChange} className="hidden" accept="image/*" capture="environment" />
                                        <button onClick={() => fileInputRef.current.click()} className="p-2 text-[#8A8AA8] hover:text-[#F5C000] transition-colors"><Paperclip size={20} /></button><button onClick={() => cameraInputRef.current.click()} className="p-2 text-[#8A8AA8] hover:text-[#F5C000] transition-colors"><Camera size={20} /></button>
                                    </div>
                                    <input type="text" value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} onKeyPress={(e) => e.key === "Enter" && !isUploading && handleSendMessage()} placeholder="Message..." className="flex-1 px-4 py-2.5 bg-[#FDFDF8] border border-[rgba(0,0,0,0.1)] focus:border-[#F5C000] focus:outline-none focus:ring-2 focus:ring-[#F5C000]/14 rounded-lg text-sm text-[#111118] font-body placeholder-[#8A8AA8] transition-colors" disabled={isUploading} />
                                    <Button onClick={handleSendMessage} disabled={isUploading || (!currentMessage.trim() && !selectedFile)} className="!rounded-full !w-10 !h-10 !p-0 flex-shrink-0">{isUploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={16} />}</Button>
                                </div>
                            </div>
                        </>
                    ) : (<div className="flex flex-col items-center justify-center h-full text-[#8A8AA8]">
                        <Inbox size={52} />
                        <p className="mt-4 text-sm text-[#8A8AA8] font-body font-semibold">Select a conversation to start chatting</p>
                    </div>)}
                </div>
            </Card>
            <ConfirmationModal isOpen={isConfirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={confirmClearChat} title="Clear Chat History" message={`Are you sure you want to clear your view of the chat history with ${itemToClear?.fullName}? This will not affect the user's view.`} confirmText="Clear" />
        </div>
    );
};

const DashboardPage = () => {
    const [analytics, setAnalytics] = useState({ totalRevenue: 0, totalBookings: 0, newUsers: 0, revenueData: [], servicesData: [] });
    const [recentBookings, setRecentBookings] = useState([]);
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await apiFetch('/dashboard');
                const data = await response.json();
                const d = data.data || {};
                const formattedRevenue = (d.revenueData || []).map(item => ({ name: new Date(0, item._id - 1).toLocaleString('default', { month: 'short' }), revenue: item.revenue }));
                const formattedServices = (d.servicesData || []).map(item => ({ name: item._id, bookings: item.bookings }));
                setAnalytics({ totalRevenue: d.totalRevenue || 0, totalBookings: d.totalBookings || 0, newUsers: d.newUsers || 0, revenueData: formattedRevenue, servicesData: formattedServices });
                setRecentBookings(d.recentBookings || []);
            } catch (error) { toast.error(error.message || "Failed to fetch dashboard data."); }
        };
        fetchDashboardData();
    }, []);
    return (
        <div className="space-y-8 w-full">
            <div className="pb-5">
                <h1 className="text-2xl font-bold text-[#111118] tracking-tight">Analytics Overview</h1>
                <p className="text-sm text-[#4A4A65] mt-1">Live operational reporting, revenue tracking, and technician resource utilization.</p>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Card className="relative overflow-hidden border-l-4 border-l-[#F5C000]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[rgba(245,192,0,0.1)] border border-[rgba(245,192,0,0.2)] text-[#B8860B] rounded-xl">
                            <DollarSign size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#8A8AA8] uppercase tracking-wider">Gross Revenue</p>
                            <p className="text-2xl font-bold text-[#111118] mt-0.5">रु{analytics.totalRevenue.toLocaleString()}</p>
                        </div>
                    </div>
                </Card>
                <Card className="relative overflow-hidden border-l-4 border-l-[#16A34A]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[rgba(22,163,74,0.1)] border border-[rgba(22,163,74,0.2)] text-[#16A34A] rounded-xl">
                            <List size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#8A8AA8] uppercase tracking-wider">Total Bookings</p>
                            <p className="text-2xl font-bold text-[#111118] mt-0.5">{analytics.totalBookings}</p>
                        </div>
                    </div>
                </Card>
                <Card className="relative overflow-hidden border-l-4 border-l-[#2563EB]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[rgba(37,99,235,0.1)] border border-[rgba(37,99,235,0.2)] text-[#2563EB] rounded-xl">
                            <Users size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#8A8AA8] uppercase tracking-wider">New Users</p>
                            <p className="text-2xl font-bold text-[#111118] mt-0.5">{analytics.newUsers}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Charts section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-sm font-semibold text-[#111118] mb-5 pb-3 border-b border-[rgba(0,0,0,0.06)]">Revenue Trend</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={analytics.revenueData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                            <XAxis dataKey="name" stroke="#8A8AA8" style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif' }} />
                            <YAxis stroke="#8A8AA8" style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', color: '#111118', fontSize: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#4A4A65' }} />
                            <Line type="monotone" dataKey="revenue" stroke="#F5C000" strokeWidth={2.5} dot={{ r: 3, fill: '#F5C000' }} activeDot={{ r: 6, fill: '#E6B000' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>
                <Card>
                    <h3 className="text-sm font-semibold text-[#111118] mb-5 pb-3 border-b border-[rgba(0,0,0,0.06)]">Popular Categories</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={analytics.servicesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                            <XAxis dataKey="name" stroke="#8A8AA8" style={{ fontSize: '10px', fontFamily: 'Inter, sans-serif' }} />
                            <YAxis stroke="#8A8AA8" style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', color: '#111118', fontSize: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#4A4A65' }} />
                            <Bar dataKey="bookings" fill="#F5C000" radius={[4, 4, 0, 0]} opacity={0.9} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* Recent Bookings table */}
            <Card className="p-0 overflow-hidden">
                <div className="px-6 py-4 border-b border-[rgba(0,0,0,0.06)]">
                    <h3 className="text-sm font-semibold text-[#111118]">Recent Activity</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[rgba(0,0,0,0.06)] text-xs font-semibold text-[#8A8AA8] uppercase tracking-wider bg-[#FAFAF5]">
                                <th className="py-3.5 px-5">Customer</th>
                                <th className="py-3.5 px-5">Service Type</th>
                                <th className="py-3.5 px-5">Status</th>
                                <th className="py-3.5 px-5">Date</th>
                                <th className="py-3.5 px-5 text-right">Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentBookings.length > 0 ? recentBookings.map(booking => (
                                <tr key={booking._id} className="border-b border-[rgba(0,0,0,0.04)] hover:bg-[#FAFAF5] transition-colors duration-150">
                                    <td className="py-3.5 px-5 font-semibold text-sm text-[#111118]">
                                        <a href={`#/admin/bookings/${booking._id}`} className="hover:text-[#B8860B] transition-colors">
                                            {booking.customerName || booking.customer?.fullName || 'N/A'}
                                        </a>
                                    </td>
                                    <td className="py-3.5 px-5 text-sm text-[#4A4A65]">{booking.serviceType || 'N/A'}</td>
                                    <td className="py-3.5 px-5"><StatusBadge status={booking.status} /></td>
                                    <td className="py-3.5 px-5 text-sm text-[#8A8AA8]">{new Date(booking.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                    <td className="py-3.5 px-5 text-right font-semibold text-sm text-[#111118]">रु{booking.totalCost}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" className="text-center py-12 text-sm text-[#8A8AA8]">No recent bookings recorded.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};
const BookingsPage = () => {
    const [bookings, setBookings] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const ITEMS_PER_PAGE = 11;
    const fetchBookings = async (page) => {
        try {
            const response = await apiFetch(`/bookings?page=${page}&limit=${ITEMS_PER_PAGE}&search=${searchTerm}`);
            const data = await response.json();
            setBookings(data.data || []);
            setTotalPages(data.totalPages || 0);
        } catch (error) { toast.error(error.message || 'Failed to fetch bookings.'); setBookings([]); setTotalPages(0); }
    };
    useEffect(() => { fetchBookings(currentPage); }, [currentPage, searchTerm]);
    const handleEdit = (booking) => { setEditingBooking(booking); setIsModalOpen(true); };
    const handleDeleteClick = (id) => { setItemToDelete(id); setConfirmOpen(true); };
    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await apiFetch(`/bookings/${itemToDelete}`, { method: 'DELETE' });
            toast.success('Booking deleted successfully!');
            fetchBookings(currentPage);
        } catch (error) { toast.error(error.message || 'Failed to delete booking.'); }
        finally { setConfirmOpen(false); setItemToDelete(null); }
    };
    const handleSave = async (formData) => {
        if (!editingBooking) return;
        try {
            const response = await apiFetch(`/bookings/${editingBooking._id}`, { method: 'PUT', body: JSON.stringify(formData) });
            const data = await response.json();
            setBookings(bookings.map(b => b._id === editingBooking._id ? data.data : b));
            toast.success(data.message || 'Booking updated successfully!');
            closeModal();
        } catch (error) { toast.error(error.message || 'Failed to save booking.'); }
    };
    const handlePageChange = (newPage) => { if (newPage > 0 && newPage <= totalPages) { setCurrentPage(newPage); } };
    const closeModal = () => { setIsModalOpen(false); setEditingBooking(null); };
    return (
        <div className="space-y-6 flex flex-col flex-grow">
            <div className="pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#111118] tracking-tight">Bookings Management</h1>
                    <p className="text-sm text-[#4A4A65] mt-1">View, update and manage all customer workshop reservations.</p>
                </div>
            </div>
            <Card className="flex flex-col flex-grow p-0 overflow-hidden">
                <div className="p-4 border-b border-[rgba(0,0,0,0.06)] bg-[#FAFAF5]">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8AA8]" size={15} />
                        <input type="text" placeholder="Search bookings..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-9 pr-4 py-2.5 bg-white border border-[rgba(0,0,0,0.1)] focus:border-[#F5C000] focus:shadow-[0_0_0_3px_rgba(245,192,0,0.12)] focus:outline-none rounded-xl text-sm text-[#111118] placeholder-[#8A8AA8] transition-all duration-200" />
                    </div>
                </div>
                <div className="overflow-x-auto flex-grow">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[rgba(0,0,0,0.06)] text-xs font-semibold text-[#8A8AA8] uppercase tracking-wider bg-[#FAFAF5]">
                                <th className="py-3.5 px-4">Customer</th><th className="py-3.5 px-4">Vehicle</th><th className="py-3.5 px-4">Service</th><th className="py-3.5 px-4">Date</th><th className="py-3.5 px-4">Status</th><th className="py-3.5 px-4">P/D</th><th className="py-3.5 px-4 text-right">Cost</th><th className="py-3.5 px-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.length > 0 ? bookings.map(booking => (
                                <tr key={booking._id} className="border-b border-[rgba(0,0,0,0.04)] hover:bg-[#FAFAF5] transition-colors duration-150">
                                    <td className="py-3 px-4 font-semibold text-sm text-[#111118]">{booking.customerName || booking.customer?.fullName || 'N/A'}</td>
                                    <td className="py-3 px-4 text-sm text-[#4A4A65]">{booking.bikeModel || 'N/A'}</td>
                                    <td className="py-3 px-4 text-sm text-[#4A4A65]">{booking.serviceType || 'N/A'}</td>
                                    <td className="py-3 px-4 text-sm text-[#8A8AA8]">{new Date(booking.date).toLocaleDateString()}</td>
                                    <td className="py-3 px-4"><StatusBadge status={booking.status} /></td>
                                    <td className="py-3 px-4 text-center">
                                        {booking.requestedPickupDropoff ? (
                                            <span className="text-[#16A34A] font-semibold text-xs">Yes</span>
                                        ) : (
                                            <span className="text-[#8A8AA8] text-xs">No</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-right font-semibold text-sm text-[#111118]">रु{booking.finalAmount}</td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex justify-center items-center gap-1.5">
                                            <a href={`#/admin/bookings/${booking._id}`} className="p-1.5 rounded-lg bg-white hover:bg-emerald-50 text-[#4A4A65] hover:text-[#16A34A] border border-[rgba(0,0,0,0.1)] hover:border-emerald-200 transition-all cursor-pointer" title="View Details"><Search size={14} /></a>
                                            <button onClick={() => handleEdit(booking)} className="p-1.5 rounded-lg bg-white hover:bg-[#F5F3E7] text-[#4A4A65] hover:text-[#B8860B] border border-[rgba(0,0,0,0.1)] hover:border-[#B8860B]/30 transition-all cursor-pointer" title="Edit Booking"><Edit size={14} /></button>
                                            <button onClick={() => handleDeleteClick(booking._id)} className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-[#DC2626] hover:text-[#B91C1C] border border-red-200/50 transition-all cursor-pointer" title="Delete Booking"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (<tr><td colSpan="8" className="text-center py-12 text-sm text-garage-600 font-body">No bookings found.</td></tr>)}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="p-4 border-t border-[rgba(0,0,0,0.06)] bg-[#FAFAF5]">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                    </div>
                )}
            </Card>
            <BookingFormModal isOpen={isModalOpen} onClose={closeModal} booking={editingBooking} onSave={handleSave} />
            <ConfirmationModal isOpen={isConfirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={confirmDelete} title="Delete Booking" message="Are you sure you want to delete this booking? This action cannot be undone." />
        </div>
    );
};


import { FileText as DownloadIcon } from 'lucide-react'; // Using FileText as a download icon

// NOTE: Your other imports like Card, StatusBadge, Button, and apiFetch are assumed to be here.

const BookingDetailsPage = ({ bookingId }) => {
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // --- NEW: State to manage the download button's loading status ---
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        const fetchBooking = async () => {
            setLoading(true);
            try {
                const response = await apiFetch(`/bookings/${bookingId}`);
                const data = await response.json();
                setBooking(data.data);
            } catch (err) {
                setError(err.message);
                toast.error(err.message || 'Failed to fetch booking details.');
            } finally {
                setLoading(false);
            }
        };
        if (bookingId) {
            fetchBooking();
        }
    }, [bookingId]);

    // --- NEW: Handler to download the PDF invoice securely ---
    const handleDownloadInvoice = async () => {
        setIsDownloading(true);
        toast.info('Generating your invoice...');
        try {
            // Use the existing apiFetch which includes the auth token in the headers
            const response = await apiFetch(`/bookings/${booking._id}/invoice`);
            
            // Get the response as a binary object (a "blob")
            const blob = await response.blob();
            
            // Create a temporary URL for the blob object
            const url = window.URL.createObjectURL(blob);
            
            // Create a temporary link element to trigger the download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${booking._id}.pdf`); // Set the filename
            document.body.appendChild(link);
            
            // Programmatically click the link to start the download
            link.click();
            
            // Clean up by removing the temporary link and URL
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (err) {
            toast.error('Failed to download invoice. Please try again.');
            console.error(err);
        } finally {
            setIsDownloading(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center py-20 text-garage-500 font-body"><div className="w-8 h-8 border-2 border-spark-500 border-t-transparent rounded-full animate-spin mr-3" />Loading booking details...</div>;
    if (error) return <div className="text-center py-10 text-signal-red font-body">Error: {error}</div>;
    if (!booking) return <div className="text-center py-10 text-garage-500 font-body">Booking not found.</div>;

    return (
        <div className="space-y-6 w-full">
            <div className="flex justify-between items-center border-b border-[rgba(0,0,0,0.06)] pb-5">
                <div className="flex items-center gap-4">
                    <a href="#/admin/bookings" className="p-2.5 rounded-xl bg-white hover:bg-[#F5F3E7] border border-[rgba(0,0,0,0.1)] text-[#4A4A65] hover:text-[#B8860B] transition-all duration-200">
                        <ArrowLeft size={16} />
                    </a>
                    <div>
                        <h1 className="text-2xl font-bold text-[#111118] tracking-tight">Booking Details</h1>
                        <p className="text-sm text-[#4A4A65] mt-1">Full record for booking ID: <span className="font-mono text-[#B8860B] bg-[rgba(245,192,0,0.08)] border border-[rgba(245,192,0,0.2)] px-2 py-0.5 rounded-lg text-xs font-semibold">{booking._id}</span></p>
                    </div>
                </div>
                {booking.isPaid && (
                    <Button onClick={handleDownloadInvoice} disabled={isDownloading} variant="primary">
                        <DownloadIcon size={16} />
                        {isDownloading ? 'Generating...' : 'Download Invoice'}
                    </Button>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#F5C000]" />
                    <h2 className="text-[11px] font-bold text-[#8A8AA8] uppercase tracking-wider mb-4 border-b border-[rgba(0,0,0,0.06)] pb-3 pl-3">Customer Info</h2>
                    <div className="space-y-3 pl-3">
                        {[['Name', booking.customerName || booking.customer?.fullName], ['Email', booking.customer?.email], ['Phone', booking.customer?.phone], ['Address', booking.customer?.address]].map(([label, val]) => (
                            <div key={label} className="flex justify-between items-start gap-4">
                                <span className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider flex-shrink-0">{label}</span>
                                <span className="text-sm text-[#111118] font-semibold text-right">{val || 'N/A'}</span>
                            </div>
                        ))}
                    </div>
                </Card>
                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    <h2 className="text-[11px] font-bold text-[#8A8AA8] uppercase tracking-wider mb-4 border-b border-[rgba(0,0,0,0.06)] pb-3 pl-3">Booking Info</h2>
                    <div className="space-y-3 pl-3">
                        <div className="flex justify-between"><span className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider">Service</span><span className="text-sm text-[#111118] font-semibold">{booking.serviceType}</span></div>
                        <div className="flex justify-between"><span className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider">Date</span><span className="text-sm font-semibold text-[#111118] font-mono">{new Date(booking.date).toLocaleDateString()}</span></div>
                        <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider">Status</span><StatusBadge status={booking.status} /></div>
                        <div className="flex justify-between"><span className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider">Final Amount</span><span className="text-sm font-extrabold text-[#B8860B] font-mono">रु{booking.finalAmount}</span></div>
                        <div className="flex justify-between"><span className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider">Payment</span><span className="text-sm text-[#111118] font-semibold">{booking.isPaid ? `Paid via ${booking.paymentMethod}` : 'Pending'}</span></div>
                        <div className="flex justify-between"><span className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider">Pick-up/Drop-off</span><span className="text-sm text-[#111118] font-semibold">{booking.requestedPickupDropoff ? 'Yes' : 'No'}</span></div>
                        {booking.requestedPickupDropoff && (
                            <>
                                <div className="flex justify-between"><span className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider">Pickup Addr</span><span className="text-xs text-[#4A4A65] font-semibold text-right max-w-[60%]">{booking.pickupAddress || 'N/A'}</span></div>
                                <div className="flex justify-between"><span className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider">Distance</span><span className="text-sm font-semibold text-[#111118] font-mono">{booking.pickupDropoffDistance ? `${booking.pickupDropoffDistance.toFixed(2)} km` : 'N/A'}</span></div>
                                <div className="flex justify-between"><span className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider">P/D Cost</span><span className="text-sm font-extrabold text-[#B8860B] font-mono">रु{booking.pickupDropoffCost ? booking.pickupDropoffCost.toFixed(2) : '0.00'}</span></div>
                            </>
                        )}
                    </div>
                </Card>
            </div>
            <Card className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                <h2 className="text-[11px] font-bold text-[#8A8AA8] uppercase tracking-wider mb-4 border-b border-[rgba(0,0,0,0.06)] pb-3 pl-3">Vehicle & Problem Notes</h2>
                <div className="space-y-3 pl-3">
                    <div className="flex justify-between"><span className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider">Vehicle</span><span className="text-sm text-[#111118] font-semibold">{booking.bikeModel || 'Not provided'}</span></div>
                    <div className="pt-2"><p className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider mb-2">Problem Description</p><p className="text-sm text-[#4A4A65] bg-[#FAFAF5] rounded-xl p-4 border border-[rgba(0,0,0,0.08)] leading-relaxed">{booking.notes || 'Not provided'}</p></div>
                </div>
            </Card>
        </div>
    );
};
const UsersPage = ({ onSave: parentOnSave }) => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const ITEMS_PER_PAGE = 10;
    const fetchUsers = async (page) => {
        try {
            const response = await apiFetch(`/users?page=${page}&limit=${ITEMS_PER_PAGE}&search=${searchTerm}`);
            const data = await response.json();
            setUsers(data.data || []);
            setTotalPages(data.totalPages || 0);
        } catch (error) { setUsers([]); setTotalPages(0); toast.error(error.message || 'Failed to fetch users.'); }
    };
    useEffect(() => { fetchUsers(currentPage); }, [currentPage, searchTerm]);
    const handleAddNew = () => { setEditingUser(null); setIsModalOpen(true); };
    const handleEdit = (user) => { setEditingUser(user); setIsModalOpen(true); };
    const handleDeleteClick = (id) => { setItemToDelete(id); setConfirmOpen(true); };
    const confirmDelete = async () => {
        try {
            await apiFetch(`/users/${itemToDelete}`, { method: 'DELETE' });
            toast.success('User deleted successfully!');
            fetchUsers(currentPage);
        } catch (error) { toast.error(error.message || 'Failed to delete user.'); }
        finally { setConfirmOpen(false); setItemToDelete(null); }
    };
    const handleSave = async (formData) => {
        try {
            if (editingUser) {
                await apiFetch(`/users/${editingUser._id}`, { method: 'PUT', body: JSON.stringify(formData) });
                toast.success('User updated successfully!');
            } else {
                await apiFetch('/users/create', { method: 'POST', body: JSON.stringify(formData) });
                toast.success('User created successfully!');
            }
            fetchUsers(currentPage);
            closeModal();
        } catch (error) { toast.error(error.message || 'Failed to save user.'); }
    };
    const handlePageChange = (newPage) => { if (newPage > 0 && newPage <= totalPages) { setCurrentPage(newPage); } };
    const closeModal = () => { setIsModalOpen(false); setEditingUser(null); };
    return (
        <div className="space-y-6 flex flex-col flex-grow">
            <div className="pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#111118] tracking-tight">User Management</h1>
                    <p className="text-sm text-[#4A4A65] mt-1">Manage customer accounts and admin access credentials.</p>
                </div>
                <Button onClick={handleAddNew}><Plus size={16} />Add New User</Button>
            </div>
            <Card className="flex flex-col flex-grow p-0 overflow-hidden">
                <div className="p-4 border-b border-[rgba(0,0,0,0.06)] bg-[#FAFAF5]">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8AA8]" size={15} />
                        <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-9 pr-4 py-2.5 bg-white border border-[rgba(0,0,0,0.1)] focus:border-[#F5C000] focus:shadow-[0_0_0_3px_rgba(245,192,0,0.12)] focus:outline-none rounded-xl text-sm text-[#111118] placeholder-[#8A8AA8] transition-all duration-200" />
                    </div>
                </div>
                <div className="overflow-x-auto flex-grow">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[rgba(0,0,0,0.06)] text-xs font-semibold text-[#8A8AA8] uppercase tracking-wider bg-[#FAFAF5]">
                                <th className="py-3.5 px-4">Name</th>
                                <th className="py-3.5 px-4">Email</th>
                                <th className="py-3.5 px-4">Joined On</th>
                                <th className="py-3.5 px-4">Role</th>
                                <th className="py-3.5 px-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? users.map(user => (
                                <tr key={user._id} className="border-b border-[rgba(0,0,0,0.04)] hover:bg-[#FAFAF5] transition-colors duration-150">
                                    <td className="py-3 px-4 font-semibold text-sm text-[#111118]">{user.fullName}</td>
                                    <td className="py-3 px-4 text-sm text-[#4A4A65]">{user.email}</td>
                                    <td className="py-3 px-4 text-sm text-[#8A8AA8] font-mono">{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td className="py-3 px-4">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${ user.role === 'admin' ? 'text-amber-600 border-amber-500/20 bg-amber-500/10' : 'text-slate-600 border-slate-200 bg-slate-50'}`}>{user.role}</span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex justify-center items-center gap-1.5">
                                            <button onClick={() => handleEdit(user)} className="p-1.5 rounded-lg bg-white hover:bg-[#F5F3E7] text-[#4A4A65] hover:text-[#B8860B] border border-[rgba(0,0,0,0.1)] hover:border-[#B8860B]/30 transition-colors cursor-pointer" title="Edit User"><Edit size={14} /></button>
                                            <button onClick={() => handleDeleteClick(user._id)} className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-[#DC2626] hover:text-[#B91C1C] border border-red-200/50 transition-colors cursor-pointer" title="Delete User"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (<tr><td colSpan="5" className="text-center py-12 text-sm text-[#8A8AA8]">No users found.</td></tr>)}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="p-4 border-t border-[rgba(0,0,0,0.06)] bg-[#FAFAF5]">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                    </div>
                )}
            </Card>
            <UserFormModal isOpen={isModalOpen} onClose={closeModal} onSave={handleSave} user={editingUser} />
            <ConfirmationModal isOpen={isConfirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={confirmDelete} title="Delete User" message="Are you sure you want to delete this user? This will permanently remove their data." />
        </div>
    );
};
const ProfilePage = ({ currentUser, setCurrentUser }) => {
    const [profile, setProfile] = useState(currentUser);
    const [isEditing, setIsEditing] = useState(false);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const fileInputRef = useRef(null);
    useEffect(() => { setProfile(currentUser); }, [currentUser]);
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setProfile(p => ({ 
            ...p, 
            [name]: type === 'checkbox' ? checked : value
        }));
    }
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {setProfile(p => ({ ...p, profilePictureUrl: URL.createObjectURL(file), newProfilePicture: file })); }
    };
    const handleUploadClick = () => { fileInputRef.current.click(); };
    const handleFetchLocation = () => {
        if (!navigator.geolocation) { toast.error("Geolocation is not supported by your browser."); return; }
        setIsFetchingLocation(true);
        toast.info("Fetching your location...");
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    if (data.display_name) {
                        setProfile(p => ({ ...p, address: data.display_name }));
                        toast.success("Location fetched and address updated!");
                    } else { toast.error("Could not determine address from your location."); }
                } catch (error) { toast.error("Failed to fetch address. Please enter manually."); }
                finally { setIsFetchingLocation(false); }
            },
            (error) => {
                let errorMessage = "An unknown geolocation error occurred.";
                if (error.code === error.PERMISSION_DENIED) { errorMessage = "Location access denied. Please enable it in your browser settings."; }
                else if (error.code === error.POSITION_UNAVAILABLE) { errorMessage = "Location information is currently unavailable."; }
                else if (error.code === error.TIMEOUT) { errorMessage = "Request for location timed out."; }
                toast.error(errorMessage);
                setIsFetchingLocation(false);
            }
        );
    };
    const handleSave = async () => {
        const formData = new FormData();
        Object.keys(profile).forEach(key => { 
            if (key === 'newProfilePicture' || key === 'profilePictureUrl') return;
            // Handle boolean specifically for offerPickupDropoff
            if (key === 'offerPickupDropoff') {
                formData.append(key, profile[key] ? 'true' : 'false');
            } else if (key === 'pickupDropoffChargePerKm' && !profile.offerPickupDropoff) {
                // If pickup/dropoff is not offered, ensure charge is sent as 0
                formData.append(key, '0');
            }
            else if (profile[key] !== null && profile[key] !== undefined) { // Check for undefined as well
                formData.append(key, profile[key]); 
            } 
        });
        if (profile.newProfilePicture) { formData.append('profilePicture', profile.newProfilePicture); }
        try {
            const response = await apiFetch('/profile', { method: 'PUT', body: formData });
            const data = await response.json();
            setCurrentUser(data.data);
            setProfile(data.data);
            setIsEditing(false);
            toast.success('Profile updated successfully!');
        } catch (error) { toast.error(error.message || 'Failed to save profile.'); }
    };
    const handleCancel = () => { setProfile(currentUser); setIsEditing(false); }
    const handleImageError = (e) => { e.target.onerror = null; e.target.src = `https://placehold.co/128x128/e2e8f0/4a5568?text=A`; }
    const profilePictureSrc = profile.profilePictureUrl || (profile.profilePicture ? `http://localhost:5050/${profile.profilePicture}` : `https://placehold.co/128x128/e2e8f0/4a5568?text=A`);
    return (
        <div className="space-y-6 w-full">
            <div className="border-b border-[rgba(0,0,0,0.06)] pb-5">
                <h1 className="text-3xl md:text-4xl font-black font-display text-[#111118] uppercase tracking-wider">Workshop Profile</h1>
                <p className="text-xs text-[#8A8AA8] font-body mt-1">Manage workshop identity, contact details, and service configurations.</p>
            </div>
            <Card className="relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#F5C000] via-[#E6B000] to-transparent" />
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6">
                    <h2 className="text-[11px] font-black font-display text-[#4A4A65] uppercase tracking-widest mb-4 sm:mb-0">Profile Information</h2>
                    {!isEditing && (<Button onClick={() => setIsEditing(true)} variant="secondary"><Edit size={14} />Edit Profile</Button>)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 flex flex-col items-center">
                        <div className="relative mb-4">
                            <img key={profilePictureSrc} src={profilePictureSrc} alt="Profile" className="w-28 h-28 rounded-full object-cover ring-2 ring-[#F5C000]/40 ring-offset-2 ring-offset-white" onError={handleImageError} />
                            {isEditing && <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center"><Camera size={20} className="text-white" /></div>}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                        {isEditing && (<Button variant="secondary" className="w-full !text-xs" onClick={handleUploadClick}><Camera size={13} />Change Picture</Button>)}
                        {!isEditing && profile.workshopName && (
                            <div className="mt-4 text-center">
                                <p className="font-black font-display text-[#111118] uppercase tracking-wider text-sm">{profile.workshopName}</p>
                                <p className="text-[10px] text-[#B8860B] font-mono tracking-widest mt-0.5">WORKSHOP</p>
                            </div>
                        )}
                    </div>
                    <div className="lg:col-span-2 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input id="workshopName" label="Workshop Name" name="workshopName" value={profile.workshopName || ''} onChange={handleChange} disabled={!isEditing} />
                            <Input id="ownerName" label="Owner Name" name="ownerName" value={profile.ownerName || ''} onChange={handleChange} disabled={!isEditing} />
                            <Input id="email" label="Email Address" name="email" type="email" value={profile.email || ''} onChange={handleChange} disabled={!isEditing} />
                            <Input id="phone" label="Phone Number" name="phone" value={profile.phone || ''} onChange={handleChange} disabled={!isEditing} />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label htmlFor="address" className="block text-xs font-semibold uppercase tracking-widest text-[#4A4A65]">Address</label>
                                {isEditing && (<Button variant="secondary" onClick={handleFetchLocation} disabled={isFetchingLocation} className="!text-[10px] !py-1 !px-2.5 !gap-1">{isFetchingLocation ? 'Fetching...' : <><MapPin size={11} /> Fetch Location</>}</Button>)}
                            </div>
                            <textarea id="address" name="address" rows="3" value={profile.address || ''} onChange={handleChange} disabled={!isEditing} className="w-full px-4 py-2.5 bg-[#FDFDF8] border border-[rgba(0,0,0,0.1)] rounded-xl text-sm text-[#111118] placeholder-[#8A8AA8] focus:outline-none focus:border-[#F5C000] focus:shadow-[0_0_0_3px_rgba(245,192,0,0.12)] disabled:bg-[#F5F3E7] disabled:text-[#8A8AA8] disabled:cursor-not-allowed transition-all duration-200 hover:border-[rgba(0,0,0,0.18)]" placeholder="Enter workshop address or fetch current location"></textarea>
                        </div>

                        <div className="border-t border-[rgba(0,0,0,0.06)] pt-5 mt-2">
                            <h3 className="text-[11px] font-black font-display text-[#4A4A65] uppercase tracking-widest mb-4">Pick-up & Drop-off Service</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            name="offerPickupDropoff"
                                            checked={profile.offerPickupDropoff || false}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className="form-checkbox h-4 w-4 rounded border-[rgba(0,0,0,0.15)] bg-white text-[#F5C000] focus:ring-[#F5C000]/20 accent-[#F5C000] cursor-pointer transition-colors"
                                        />
                                        <span className="text-sm text-[#4A4A65] font-body group-hover:text-[#111118] transition-colors">Offer Pick-up/Drop-off Service to Customers</span>
                                    </label>
                                </div>
                                {profile.offerPickupDropoff && (
                                    <Input
                                        id="pickupDropoffChargePerKm"
                                        label="Charge per KM (रु)"
                                        name="pickupDropoffChargePerKm"
                                        type="number"
                                        value={profile.pickupDropoffChargePerKm || ''}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        step="0.01"
                                        placeholder="e.g., 50.00"
                                    />
                                )}
                            </div>
                        </div>

                        {isEditing && (
                            <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(0,0,0,0.06)]">
                                <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
                                <Button onClick={handleSave}>Save Changes</Button>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};
const BookingFormModal = ({ isOpen, onClose, booking, onSave }) => {
    const [formData, setFormData] = useState({});
    useEffect(() => { if (booking) { setFormData({ status: booking.status, totalCost: booking.totalCost }); } }, [booking, isOpen]);
    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Booking">
            <form onSubmit={handleSubmit} className="space-y-4">
                {booking && (
                    <div className="p-4 rounded-xl bg-[#F5F3E7] border border-[rgba(0,0,0,0.08)] space-y-2">
                        <p className="text-sm text-[#4A4A65]">
                            <strong className="font-semibold text-[#111118] mr-1">Customer:</strong>
                            {booking.customerName || booking.customer?.fullName}
                        </p>
                        <p className="text-sm text-[#4A4A65]">
                            <strong className="font-semibold text-[#111118] mr-1">Service:</strong>
                            {booking.serviceType}
                        </p>
                        <p className="text-sm text-[#4A4A65]">
                            <strong className="font-semibold text-[#111118] mr-1">Bike:</strong>
                            {booking.bikeModel}
                        </p>
                    </div>
                )}
                <div>
                    <label htmlFor="status" className="form-label">Status</label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status || ''}
                        onChange={handleChange}
                        className="input-base mt-1"
                    >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
                <Input
                    id="totalCost"
                    label="Total Cost (रु)"
                    name="totalCost"
                    type="number"
                    value={formData.totalCost || ''}
                    onChange={handleChange}
                />
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary">Save Changes</Button>
                </div>
            </form>
        </Modal>
    );
};
const UserFormModal = ({ isOpen, onClose, onSave, user }) => {
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', role: 'user' });
    useEffect(() => { if (user) { setFormData({ fullName: user.fullName, email: user.email, role: user.role, password: '' }); } else { setFormData({ fullName: '', email: '', password: '', role: 'user' }); } }, [user, isOpen]);
    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); }
    const handleSubmit = (e) => { e.preventDefault(); const dataToSave = { ...formData }; if (user && !dataToSave.password) { delete dataToSave.password; } onSave(dataToSave); }
    return (<Modal isOpen={isOpen} onClose={onClose} title={user ? 'Edit User' : 'Add New User'}><form onSubmit={handleSubmit} className="space-y-4"><Input id="fullName" name="fullName" label="Full Name" value={formData.fullName} onChange={handleChange} required /><Input id="email" name="email" label="Email Address" type="email" value={formData.email} onChange={handleChange} required /><Input id="password" name="password" label="Password" type="password" value={formData.password} onChange={handleChange} placeholder={user ? "Leave blank to keep current" : ""} required={!user} /><div><label htmlFor="role" className="form-label">Role</label><select id="role" name="role" value={formData.role || 'user'} onChange={handleChange} className="input-base mt-1"><option value="user">User</option><option value="admin">Admin</option></select></div><div className="flex justify-end gap-3 pt-4"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" variant="primary">{user ? 'Save Changes' : 'Add User'}</Button></div></form></Modal>)
}
const ServiceFormModal = ({ isOpen, onClose, onSave, service }) => {
    const [formData, setFormData] = useState({ name: '', description: '', price: '', duration: '' });
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState('');
    const fileInputRef = useRef(null);
    useEffect(() => {
        if (isOpen) {
            if (service) { setFormData(service); }
            else { setFormData({ name: '', description: '', price: '', duration: '' }); }
            setImage(null); setPreview('');
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }, [service, isOpen]);
    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); }
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) { setImage(file); setPreview(URL.createObjectURL(file)); }
    }
    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSend = new FormData();
        dataToSend.append('name', formData.name);
        dataToSend.append('description', formData.description);
        dataToSend.append('price', formData.price);
        dataToSend.append('duration', formData.duration || '');
        if (image) { dataToSend.append('image', image); }
        onSave(dataToSend);
    }
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={service ? 'Edit Service' : 'Add New Service'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input id="name" name="name" label="Service Name" value={formData.name || ''} onChange={handleChange} required />
                <div><label htmlFor="description" className="form-label">Description</label><textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} rows="3" className="input-base mt-1" required></textarea></div>
                <Input id="price" name="price" label="Price (रु)" type="number" value={formData.price || ''} onChange={handleChange} required />
                <Input id="duration" name="duration" label="Estimated Duration (e.g., 2 hours)" value={formData.duration || ''} onChange={handleChange} />
                <div>
                    <label className="form-label">Service Image</label>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="w-full text-sm text-[#4A4A65] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-[rgba(0,0,0,0.1)] file:text-xs file:font-semibold file:bg-[#F5F3E7] file:text-[#4A4A65] hover:file:bg-[#EDE9D5] hover:file:text-[#111118] transition-colors" accept="image/*" required={!service} />
                    {preview && <img src={preview} alt="New Preview" className="mt-4 h-32 w-auto rounded-xl object-cover border border-[rgba(0,0,0,0.08)]" />}
                    {service && service.image && !preview && <img src={`http://localhost:5050/${service.image}`} alt="Current" className="mt-4 h-32 w-auto rounded-xl object-cover border border-[rgba(0,0,0,0.08)]" />}
                </div>
                <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" variant="primary">{service ? 'Save Changes' : 'Add Service'}</Button></div>
            </form>
        </Modal>
    );
};

// UPDATED SERVICES PAGE
const ServicesPage = () => {
    const [services, setServices] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    
    // NEW STATE FOR REVIEWS MODAL
    const [isReviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState(null);
    
    const ITEMS_PER_PAGE = 6;
    
    const fetchServices = async (page) => {
        try {
            const response = await apiFetch(`/services?page=${page}&limit=${ITEMS_PER_PAGE}`);
            const data = await response.json();
            setServices(data.data || []);
            setTotalPages(data.totalPages || 0);
        } catch (error) { setServices([]); setTotalPages(0); toast.error(error.message || 'Failed to fetch services.'); }
    };
    
    useEffect(() => { fetchServices(currentPage); }, [currentPage]);
    
    const handleAddNew = () => { setEditingService(null); setIsModalOpen(true); };
    const handleEdit = (service) => { setEditingService(service); setIsModalOpen(true); };
    const handleDeleteClick = (id) => { setItemToDelete(id); setConfirmOpen(true); };
    
    // NEW FUNCTION TO OPEN REVIEWS MODAL
    const handleViewReviews = (serviceId) => {
        setSelectedServiceId(serviceId);
        setReviewModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await apiFetch(`/services/${itemToDelete}`, { method: 'DELETE' });
            toast.success('Service deleted successfully!');
            if (services.length === 1 && currentPage > 1) { setCurrentPage(currentPage - 1); } else { fetchServices(currentPage); }
        } catch (error) { toast.error(error.message || 'Failed to delete service.'); }
        finally { setConfirmOpen(false); setItemToDelete(null); }
    };
    
    const handleSave = async (formData) => {
        try {
            const url = editingService ? `/services/${editingService._id}` : '/services';
            const method = editingService ? 'PUT' : 'POST';
            await apiFetch(url, { method, body: formData });
            toast.success(editingService ? 'Service updated successfully!' : 'Service added successfully!');
            fetchServices(currentPage);
            closeModal();
        } catch (error) { toast.error(error.message || 'Failed to save service.'); }
    };
    
    const handlePageChange = (newPage) => { if (newPage > 0 && newPage <= totalPages) { setCurrentPage(newPage); } };
    const closeModal = () => { setIsModalOpen(false); setEditingService(null); }
    const handleImageError = (e) => { e.target.src = 'https://placehold.co/400x300/e2e8f0/4a5568?text=No+Image'; }
    
    return (
        <div className="space-y-6 flex flex-col flex-grow">
            <div className="pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#111118] tracking-tight">Services Management</h1>
                    <p className="text-sm text-[#4A4A65] mt-1">Configure workshop service offerings, pricing, and availability.</p>
                </div>
                <Button onClick={handleAddNew}><Plus size={16} />Add New Service</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow">
                {services.length > 0 ? services.map(service => (
                    <Card key={service._id} className="flex flex-col p-0 overflow-hidden group">
                        <div className="relative overflow-hidden h-44">
                            <img src={`http://localhost:5050/${service.image}`} alt={service.name} onError={handleImageError} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute top-0 left-0 h-0.5 w-12 bg-[#F5C000] group-hover:w-24 transition-all duration-300" />
                        </div>
                        <div className="p-5 flex-grow flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base font-bold text-[#111118] tracking-tight">{service.name}</h3>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                                <StarRating rating={service.rating} />
                                <span className="text-[10px] text-[#8A8AA8]">({service.numReviews} reviews)</span>
                            </div>
                            <p className="text-xs text-[#4A4A65] flex-grow mb-4 leading-relaxed">{service.description}</p>
                            <div className="mt-auto pt-4 border-t border-[rgba(0,0,0,0.06)] flex justify-between items-center">
                                <div>
                                    <p className="text-xl font-extrabold text-[#B8860B]">रु{service.price}</p>
                                    <p className="text-[10px] text-[#8A8AA8] mt-0.5">{service.duration}</p>
                                </div>
                                <div className="flex gap-1.5">
                                    <button onClick={() => handleViewReviews(service._id)} className="p-2 rounded-lg bg-white hover:bg-emerald-50 text-[#4A4A65] hover:text-[#16A34A] border border-[rgba(0,0,0,0.1)] hover:border-emerald-200 transition-all cursor-pointer" title="View Reviews"><ReviewIcon size={15} /></button>
                                    <button onClick={() => handleEdit(service)} className="p-2 rounded-lg bg-white hover:bg-[#F5F3E7] text-[#4A4A65] hover:text-[#B8860B] border border-[rgba(0,0,0,0.1)] hover:border-[#B8860B]/30 transition-all cursor-pointer" title="Edit Service"><Edit size={15} /></button>
                                    <button onClick={() => handleDeleteClick(service._id)} className="p-2 rounded-lg bg-white hover:bg-red-50 text-[#DC2626] hover:text-[#B91C1C] border border-red-200/50 transition-all cursor-pointer" title="Delete Service"><Trash2 size={15} /></button>
                                </div>
                            </div>
                        </div>
                    </Card>
                )) : (<div className="col-span-full text-center py-16 text-[#8A8AA8]">No services found. Add your first service to get started.</div>)}
            </div>
            <div className="flex justify-center">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
            <ServiceFormModal isOpen={isModalOpen} onClose={closeModal} onSave={handleSave} service={editingService} />
            <ConfirmationModal isOpen={isConfirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={confirmDelete} title="Delete Service" message="Are you sure you want to delete this service? This action is permanent." />
            <ReviewsModal isOpen={isReviewModalOpen} onClose={() => setReviewModalOpen(false)} serviceId={selectedServiceId} />
        </div>
    );
};


const NavLink = ({ page, icon: Icon, children, activePage, onLinkClick, badgeCount }) => {
    const isActive = activePage === page;
    return (
        <a
            href={`#/admin/${page}`}
            onClick={onLinkClick}
            className={`sidebar-link ${isActive ? 'active' : ''}`}
        >
            <Icon size={17} />
            <span className="flex-1">{children}</span>
            {badgeCount > 0 && (
                <span className="bg-[#F5C000] text-[#0D0D14] text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                    {badgeCount}
                </span>
            )}
        </a>
    );
};
const SidebarContent = ({ activePage, onLinkClick, onLogoutClick, onMenuClose, totalUnreadCount }) => (
    <>
        {/* Logo */}
        <div className="px-5 py-5 flex items-center justify-between border-b border-black/08">
            <a href="#/admin/dashboard" onClick={onLinkClick} className="flex items-center gap-2.5 cursor-pointer">
                <div className="w-8 h-8">
                    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <polygon points="18,2 33,10 33,26 18,34 3,26 3,10" fill="#F5C000" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="13" fontWeight="900" fontFamily="Inter,sans-serif" fill="#0D0D14">M</text>
                    </svg>
                </div>
                <div>
                    <span className="text-lg font-black text-[#111118]">Moto</span>
                    <span className="text-lg font-black text-[#B8860B]">Fix</span>
                    <span className="text-[10px] font-semibold text-[#8A8AA8] uppercase tracking-widest block -mt-0.5">Admin Panel</span>
                </div>
            </a>
            {onMenuClose && (
                <button onClick={onMenuClose} className="lg:hidden text-[#8A8AA8] hover:text-[#111118] transition-colors">
                    <X size={18} />
                </button>
            )}
        </div>
        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8A8AA8] px-3 mb-3">Main</p>
            <NavLink page="dashboard" icon={BarChart} activePage={activePage} onLinkClick={onLinkClick}>Dashboard</NavLink>
            <NavLink page="bookings" icon={List} activePage={activePage} onLinkClick={onLinkClick}>Bookings</NavLink>
            <NavLink page="services" icon={Wrench} activePage={activePage} onLinkClick={onLinkClick}>Services</NavLink>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8A8AA8] px-3 mb-3 mt-5">Account</p>
            <NavLink page="profile" icon={User} activePage={activePage} onLinkClick={onLinkClick}>Profile</NavLink>
            <NavLink page="chat" icon={MessageSquare} activePage={activePage} onLinkClick={onLinkClick} badgeCount={totalUnreadCount}>Chat</NavLink>
        </nav>
        {/* Logout */}
        <div className="p-3 border-t border-black/08">
            <button
                onClick={onLogoutClick}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold
                           text-[rgba(220,38,38,0.8)] hover:text-[#DC2626] hover:bg-[rgba(220,38,38,0.08)]
                           transition-all duration-200 cursor-pointer"
            >
                <LogOut size={17} />
                <span>Logout</span>
            </button>
        </div>
    </>
);

const AdminDashboard = () => {
    const [activePage, setActivePage] = useState(() => (window.location.hash.replace('#/admin/', '').split('/')[0] || 'dashboard'));
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLogoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState({ ownerName: 'Admin', workshopName: '' });
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('adminTheme') === 'dark');
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown

    const handleLogoutConfirm = () => { localStorage.clear(); window.location.href = '/'; };

    // Function to handle navigation from dropdown
    const handleDropdownNavigation = (page) => {
        window.location.hash = `#/admin/${page}`;
        setIsDropdownOpen(false); // Close dropdown after navigation
    };

    useEffect(() => {
        const fetchInitialCount = async () => {
            try {
                const response = await apiFetch('/chat/users');
                const data = await response.json();
                const unreadConversations = data.data.filter(c => c.unreadCount > 0);
                setTotalUnreadCount(unreadConversations.length);
            } catch (error) { console.error("Could not fetch initial unread count", error); }
        };
        fetchInitialCount();
        const notificationListener = () => { fetchInitialCount(); };
        const readListener = () => { fetchInitialCount(); };
        socket.on('new_message_notification', notificationListener);
        socket.on('messages_read_by_admin', readListener);
        return () => {
            socket.off('new_message_notification', notificationListener);
            socket.off('messages_read_by_admin', readListener);
        };
    }, []);
    useEffect(() => { document.title = totalUnreadCount > 0 ? `(${totalUnreadCount}) MotoFix Admin` : 'MotoFix Admin'; }, [totalUnreadCount]);
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await apiFetch('/profile');
                const data = await response.json();
                setCurrentUser(data.data || { ownerName: 'Admin' });
            } catch (error) { if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) { handleLogoutConfirm(); } }
        };
        fetchProfile();
    }, []);
    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
        localStorage.setItem('adminTheme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);
    useEffect(() => {
        const handleHashChange = () => {
            const page = window.location.hash.replace('#/admin/', '').split('/')[0] || 'dashboard';
            setActivePage(page);
        };
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange();
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Close dropdown when clicking outside
    const dropdownRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const renderPage = () => {
        const hash = window.location.hash.replace('#/admin/', '');
        const [page, id] = hash.split('/');
        switch (page) {
            case 'dashboard': return <DashboardPage />;
            case 'bookings': if (id) { return <BookingDetailsPage bookingId={id} />; } return <BookingsPage />;
            case 'services': return <ServicesPage />;
            case 'profile': return <ProfilePage currentUser={currentUser} setCurrentUser={setCurrentUser} />;
            case 'chat': return <AdminChatPage />;
            default: window.location.hash = '#/admin/dashboard'; return <DashboardPage />;
        }
    };
    const handleImageError = (e) => { e.target.onerror = null; e.target.src = `https://placehold.co/40x40/e2e8f0/4a5568?text=A`; }
    const profilePictureSrc = currentUser.profilePicture ? `http://localhost:5050/${currentUser.profilePicture}` : `https://placehold.co/40x40/e2e8f0/4a5568?text=A`;
    return (
        <div className="flex h-screen font-sans" style={{ background: '#FAFAF5' }}>
            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 z-40 flex lg:hidden transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="w-64 bg-[#F5F3E7] border-r border-black/08 shadow-2xl flex flex-col">
                    <SidebarContent activePage={activePage} onLinkClick={() => setIsSidebarOpen(false)} onLogoutClick={() => { setIsSidebarOpen(false); setLogoutConfirmOpen(true); }} onMenuClose={() => setIsSidebarOpen(false)} totalUnreadCount={totalUnreadCount} />
                </div>
                <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
            </div>
            {/* Desktop Sidebar */}
            <aside className="w-64 bg-[#F5F3E7] hidden lg:flex flex-col flex-shrink-0 border-r border-black/08 shadow-[2px_0_8px_rgba(0,0,0,0.04)]">
                <SidebarContent activePage={activePage} onLinkClick={() => {}} onLogoutClick={() => setLogoutConfirmOpen(true)} totalUnreadCount={totalUnreadCount} />
            </aside>
            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="bg-white border-b border-[rgba(0,0,0,0.07)] shadow-[0_1px_8px_rgba(0,0,0,0.05)] px-6 py-3.5 flex justify-between items-center flex-shrink-0 z-10">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-[#4A4A65] hover:text-[#111118] transition-colors">
                            <Menu size={22} />
                        </button>
                        <div className="hidden lg:flex items-center gap-2">
                            <span className="text-xs font-medium text-[#8A8AA8] capitalize">
                                {activePage.charAt(0).toUpperCase() + activePage.slice(1)}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Profile Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-[rgba(0,0,0,0.08)] hover:bg-[#F5F3E7] transition-all duration-150 cursor-pointer"
                            >
                                <img key={profilePictureSrc} src={profilePictureSrc} alt="Admin" className="w-8 h-8 rounded-lg object-cover ring-2 ring-[rgba(245,192,0,0.3)]" onError={handleImageError} />
                                <div className="hidden md:block">
                                    <p className="font-semibold text-sm text-[#111118] leading-tight">{currentUser.ownerName}</p>
                                    <p className="text-[10px] text-[#8A8AA8] mt-0.5">Administrator</p>
                                </div>
                                <ChevronDown size={13} className={`text-[#8A8AA8] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-44 bg-white border border-[rgba(0,0,0,0.08)] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] py-1.5 z-50">
                                    <a
                                        href="#/admin/profile"
                                        onClick={() => handleDropdownNavigation('profile')}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#4A4A65] hover:bg-[#F5F3E7] hover:text-[#111118] transition-colors"
                                    >
                                        <User size={15} className="text-[#8A8AA8]" /> Profile
                                    </a>
                                    <button
                                        onClick={() => { setIsDropdownOpen(false); setLogoutConfirmOpen(true); }}
                                        className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#DC2626] hover:bg-[rgba(220,38,38,0.06)] transition-colors"
                                    >
                                        <LogOut size={15} /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8 flex flex-col" style={{ background: '#FAFAF5' }}>{renderPage()}</main>
            </div>
            <ConfirmationModal isOpen={isLogoutConfirmOpen} onClose={() => setLogoutConfirmOpen(false)} onConfirm={handleLogoutConfirm} title="Confirm Logout" message="Are you sure you want to logout?" confirmText="Logout" confirmButtonVariant="danger" Icon={LogOut} />
            <GeminiChatbot />
        </div>
    );
};

export default AdminDashboard;