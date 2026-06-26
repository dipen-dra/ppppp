import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { MessageSquare, Send, X, Loader } from 'lucide-react'; // Using lucide-react icons
import './GeminiChatbot.css'; // We will create this CSS file next

const GeminiChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const chatBodyRef = useRef(null);

    // Initial greeting message
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                text: 'Hello! I am the MotoFix AI Assistant, powered by Gemini. How can I help you today?',
                sender: 'bot'
            }]);
        }
    }, [isOpen]);

    // Auto-scroll to the latest message
    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const toggleChat = () => setIsOpen(!isOpen);

    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;

        const userMessage = { text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // NOTE: This assumes your backend is running and has the /api/gemini/chat endpoint
            const res = await axios.post('http://localhost:5050/api/gemini/chat', {
                message: input,
                history: history,
            });

            const botMessage = { text: res.data.response, sender: 'bot' };
            setMessages(prev => [...prev, botMessage]);

            // Update conversation history for context
            setHistory(prev => [
                ...prev,
                { role: "user", parts: [{ text: input }] },
                { role: "model", parts: [{ text: res.data.response }] }
            ]);

        } catch (error) {
            console.error('Error sending message to Gemini API:', error);
            const errorMessage = { text: 'Sorry, I am having trouble connecting. Please try again later.', sender: 'bot' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="gemini-chatbot-container">
            {isOpen && (
                <div className="chat-window border border-[rgba(0,0,0,0.08)] bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)]">
                    <div className="chat-header bg-gradient-to-r from-[#F5C000] to-[#E6B000] text-[#111118]">
                        <h2 className="text-[#111118] font-bold">MotoFix AI Assistant</h2>
                        <button onClick={toggleChat} className="text-[#111118] hover:opacity-70 transition-opacity">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="chat-body bg-[#FDFDF8]" ref={chatBodyRef}>
                        {messages.map((msg, index) => (
                            <div key={index} className={`chat-message ${msg.sender}`}>
                                <p className="text-sm whitespace-pre-wrap" 
                                   dangerouslySetInnerHTML={{ 
                                       __html: DOMPurify.sanitize(msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')) 
                                   }}>
                                </p>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="chat-message bot">
                                <div className="typing-indicator">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="chat-footer border-t border-[rgba(0,0,0,0.06)] bg-white">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask me anything..."
                            className="px-4 py-2.5 bg-[#FDFDF8] border border-[rgba(0,0,0,0.1)] rounded-full text-sm text-[#111118] placeholder-[#8A8AA8] focus:outline-none focus:border-[#F5C000] focus:shadow-[0_0_0_3px_rgba(245,192,0,0.12)] transition-all duration-200 hover:border-[rgba(0,0,0,0.18)]"
                            disabled={isLoading}
                        />
                        <button onClick={handleSend} disabled={isLoading || !input.trim()} className="send-button">
                            {isLoading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                </div>
            )}
            <button className="chat-toggle-button" onClick={toggleChat}>
                <MessageSquare size={30} />
            </button>
        </div>
    );
};

export default GeminiChatbot;