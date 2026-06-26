import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { Paperclip, Camera, Send, FileText, XCircle } from 'lucide-react';
import { socket } from '../../../services/socket';
import { apiFetchUser } from '../../../services/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

const ChatPage = ({ currentUser }) => {
    const [currentMessage, setCurrentMessage] = useState("");
    const [messageList, setMessageList] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const chatBodyRef = useRef(null);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const room = currentUser?._id ? `chat-${currentUser._id}` : null;
    const authorName = currentUser?.fullName || 'Customer';
    const authorId = currentUser?._id || null;

    useEffect(() => {
        if (!room || !authorId) return;

        socket.emit("join_room", { roomName: room, userId: authorId });

        const historyListener = (history) => {
            if (history.length === 0 || (history.length > 0 && history[0].room === room)) {
                setMessageList(history);
            }
        };
        socket.on("chat_history", historyListener);

        const messageListener = (data) => {
            if (data.room === room) {
                setMessageList((list) => [...list, data]);
            }
        };
        socket.on("receive_message", messageListener);

        return () => {
            socket.off("chat_history", historyListener);
            socket.off("receive_message", messageListener);
        };
    }, [room, authorId]);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messageList]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            if (file.type.startsWith('image/')) {
                setPreviewUrl(URL.createObjectURL(file));
            } else {
                setPreviewUrl(null);
            }
        }
        event.target.value = null;
    };

    const handleRemovePreview = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    const sendMessage = async () => {
        if (currentMessage.trim() === "" && !selectedFile) return;
        if (!room || !authorId) return;

        if (selectedFile) {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('room', room);
            formData.append('author', authorName);
            formData.append('authorId', authorId);
            if (currentMessage.trim() !== '') {
                formData.append('message', currentMessage);
            }

            try {
                const response = await apiFetchUser('/chat/upload', {
                    method: 'POST',
                    body: formData,
                });
                
                if (!response.ok) {
                    throw new Error("File upload failed.");
                }
            } catch (error) {
                toast.error(`File upload failed: ${error.message}`);
            } finally {
                setIsUploading(false);
                handleRemovePreview();
                setCurrentMessage('');
            }
        } else {
            const messageData = {
                room: room,
                author: authorName,
                authorId: authorId,
                message: currentMessage,
            };
            await socket.emit("send_message", messageData);
            setCurrentMessage("");
        }
    };

    const renderFileContent = (msg) => {
        if (msg.fileType?.startsWith('image/')) {
            return (
                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <img src={msg.fileUrl} alt={msg.fileName || 'Sent Image'} className="max-w-xs rounded-lg mt-1 border border-black/10" />
                </a>
            );
        }
        return (
            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" download={msg.fileName}
               className="flex items-center gap-3 bg-[#FDFDF8] border border-black/10 p-3 rounded-xl hover:border-[#F5C000]/50 transition-all mt-1">
                <FileText size={24} className="flex-shrink-0 text-[#B8860B]" />
                <span className="truncate font-semibold text-xs text-[#111118]">{msg.fileName || 'Download File'}</span>
            </a>
        );
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto text-[#111118]">
            {/* Header section */}
            <div className="border-b border-black/08 pb-5 text-left">
                <h1 className="text-3xl font-black tracking-tight leading-none">
                    Workshop Support Chat
                </h1>
                <p className="text-sm text-[#4A4A65] mt-1.5">
                    Connect instantly with our master mechanics and support staff.
                </p>
            </div>

            <Card className="p-0 flex flex-col border border-black/08 bg-white shadow-sm overflow-hidden relative" style={{ height: 'calc(80vh - 4rem)' }}>
                <div className="absolute top-0 left-0 w-full h-1 bg-[#F5C000]" />

                {/* Chat Top Support Header */}
                <div className="p-4 border-b border-black/07 bg-[#FDFDF8] flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img 
                                src="/motofix-removebg-preview.png" 
                                alt="Support Logo" 
                                className="w-10 h-10 rounded-lg object-contain bg-white border border-black/08 p-1" 
                                onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=MotoFix&background=F5F3E7&color=111118&size=64`; }}
                            />
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white animate-pulse"></span>
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-sm text-[#111118] uppercase tracking-wider leading-none">MotoFix Concierge</h3>
                            <p className="text-[10px] text-[#B8860B] font-bold uppercase tracking-wider mt-1">
                                ACTIVE HELPDESK ENGINE
                            </p>
                        </div>
                    </div>
                </div>

                {/* Message Threads Body */}
                <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-white" ref={chatBodyRef}>
                    {messageList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                            <div className="w-12 h-12 rounded-full bg-[#FFFCEE] text-[#B8860B] flex items-center justify-center border border-[#F5C000]/20">
                                💬
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-[#111118] uppercase tracking-wider">Awaiting Messages</h4>
                                <p className="text-xs text-[#4A4A65] max-w-[240px] mx-auto mt-2 leading-relaxed">
                                    Type a support query below to resolve scheduling changes, fluid specs, or custom diagnostics.
                                </p>
                            </div>
                        </div>
                    ) : (
                        messageList.map((msg, index) => {
                            const isUserMessage = msg.authorId === authorId;
                            return (
                                <div key={index} className={`flex items-end gap-2.5 ${isUserMessage ? 'justify-end' : 'justify-start'}`}>
                                    {!isUserMessage && (
                                        <img 
                                            src="/motofix-removebg-preview.png" 
                                            alt="Support" 
                                            className="w-7 h-7 rounded-lg object-contain bg-white border border-black/10 p-0.5 shadow-sm self-end" 
                                            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=Admin&background=FDFDF8&color=B8860B&size=32`; }}
                                        />
                                    )}
                                    <div className="flex flex-col space-y-1">
                                        <div className={`py-2.5 px-4 max-w-md rounded-2xl shadow-sm text-sm ${
                                            isUserMessage 
                                                ? 'bg-[#F5C000] text-[#0D0D14] rounded-br-none font-medium' 
                                                : 'bg-[#F5F3E7] border border-black/05 text-[#111118] rounded-bl-none'
                                        }`}>
                                            {msg.fileUrl && renderFileContent(msg)}
                                            {msg.message && <p className="leading-relaxed text-left" style={{ overflowWrap: 'break-word' }}>{msg.message}</p>}
                                        </div>
                                        <span className={`text-[9px] uppercase tracking-wider font-mono opacity-60 text-[#8A8AA8] ${isUserMessage ? 'text-right' : 'text-left'}`}>
                                            {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Chat Footer Input Area */}
                <div className="p-4 border-t border-black/07 bg-[#FDFDF8]">
                    {(previewUrl || selectedFile) && (
                        <div className="mb-3 p-3 bg-white rounded-xl flex items-center justify-between border border-black/08 animate-in fade-in duration-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="h-14 w-14 object-cover rounded-lg shadow-sm border border-black/08" />
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-[#FDFDF8] border border-black/08 flex items-center justify-center text-[#8A8AA8]">
                                        <FileText size={20} />
                                    </div>
                                )}
                                <div className="text-left">
                                    <p className="text-xs font-bold text-[#111118] truncate max-w-xs">{selectedFile?.name}</p>
                                    <p className="text-[10px] text-[#B8860B] font-bold uppercase tracking-wider mt-0.5">Ready for upload</p>
                                </div>
                            </div>
                            <button onClick={handleRemovePreview} className="text-[#8A8AA8] hover:text-red-600 transition-colors cursor-pointer bg-transparent border-none">
                                <XCircle size={18} />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                            <input type="file" ref={cameraInputRef} onChange={handleFileChange} className="hidden" accept="image/*" capture="environment" />
                            <button 
                                onClick={() => fileInputRef.current.click()} 
                                className="p-2 text-[#8A8AA8] hover:text-[#B8860B] transition-colors cursor-pointer bg-transparent border-none"
                                title="Attach File"
                                disabled={isUploading}
                            >
                                <Paperclip size={18} />
                            </button>
                            <button 
                                onClick={() => cameraInputRef.current.click()} 
                                className="p-2 text-[#8A8AA8] hover:text-[#B8860B] transition-colors cursor-pointer bg-transparent border-none"
                                title="Access Camera"
                                disabled={isUploading}
                            >
                                <Camera size={18} />
                            </button>
                        </div>
                        <input
                            type="text"
                            value={currentMessage}
                            onChange={(e) => setCurrentMessage(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && !isUploading && sendMessage()}
                            placeholder="Instruct support desk here..."
                            className="flex-grow px-5 py-3 bg-white border border-black/10 focus:border-[#F5C000] focus:outline-none focus:ring-1 focus:ring-[#F5C000]/30 text-[#111118] text-sm rounded-xl placeholder:text-[#8A8AA8] transition-colors disabled:opacity-50"
                            disabled={isUploading}
                        />
                        <Button 
                            onClick={sendMessage} 
                            disabled={isUploading || (!currentMessage.trim() && !selectedFile)} 
                            className="!rounded-xl !w-11 !h-11 !p-0 shadow-md shadow-[#F5C000]/10 shrink-0 cursor-pointer flex items-center justify-center text-[#0D0D14] bg-gradient-to-r from-[#F5C000] to-[#E6B000]"
                        >
                            {isUploading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Send size={15} />
                            )}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ChatPage;