// import React, { useState, useContext, useMemo } from 'react';
// import Chatbot from 'react-chatbot-kit';
// import 'react-chatbot-kit/build/main.css';
// import '../chatbot/chatbot.css'; // Import the new custom styles

// import config from '../chatbot/config.jsx';
// import createMessageParser from '../chatbot/MessageParser.jsx';
// import createActionProvider from '../chatbot/ActionProvider.jsx';
// import { MessageSquare, X } from 'lucide-react';
// import { AuthContext } from '../../auth/AuthContext.jsx';

// const ChatbotComponent = () => {
//     const [showBot, setShowBot] = useState(false);
//     const { user } = useContext(AuthContext
//     );

//     // Create the ActionProvider class, injecting the user context
//     const ActionProvider = useMemo(() => createActionProvider(user), [user]);

//     // Create the MessageParser class, injecting the user context
//     const MessageParser = useMemo(() => createMessageParser(user), [user]);
    
//     // Key the chatbot component to force a re-mount when the user logs in or out
//     const chatbotKey = user ? user._id : 'guest';

//     return (
//         <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
//             {showBot && (
//                 <div className="w-80 md:w-96 rounded-lg shadow-2xl">
//                    <Chatbot
//                         key={chatbotKey}
//                         config={config}
//                         actionProvider={ActionProvider}
//                         messageParser={MessageParser}
//                     />
//                 </div>
//             )}
//             <button 
//                 onClick={() => setShowBot((prev) => !prev)} 
//                 className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-4 float-right"
//                 aria-label={showBot ? "Close Chat" : "Open Chat"}
//             >
//                 {showBot ? <X size={24} /> : <MessageSquare size={24} />}
//             </button>
//         </div>
//     );
// };

// export default ChatbotComponent;





import React, { useState } from 'react';
import './Chatbot.css';
import axios from 'axios';
import DOMPurify from 'dompurify';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [history, setHistory] = useState([]);

    const toggleChat = () => setIsOpen(!isOpen);

    const handleSend = async () => {
        if (input.trim() === '') return;

        const userMessage = { text: input, sender: 'user' };
        setMessages([...messages, userMessage]);
        setInput('');

        try {
            const res = await axios.post('http://localhost:5000/api/gemini/chat', {
                message: input,
                history: history,
            });

            const botMessage = { text: res.data.response, sender: 'bot' };
            setMessages(prevMessages => [...prevMessages, botMessage]);

            // Update history for context
            setHistory(prevHistory => [
                ...prevHistory,
                { role: "user", parts: [{ text: input }] },
                { role: "model", parts: [{ text: res.data.response }] }
            ]);

        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = { text: 'Sorry, something went wrong.', sender: 'bot' };
            setMessages(prevMessages => [...prevMessages, errorMessage]);
        }
    };

    return (
        <div className="chatbot-container">
            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <h2>MotoFix Assistant</h2>
                        <button onClick={toggleChat}>&times;</button>
                    </div>
                    <div className="chat-body">
                        {messages.map((msg, index) => (
                            <div key={index} className={`chat-message ${msg.sender}`}>
                                <p className="text-sm whitespace-pre-wrap" 
                                   dangerouslySetInnerHTML={{ 
                                       __html: DOMPurify.sanitize(msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')) 
                                   }}>
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="chat-footer">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type a message..."
                        />
                        <button onClick={handleSend}>Send</button>
                    </div>
                </div>
            )}
            <button className="chat-toggle-button" onClick={toggleChat}>
                💬
            </button>
        </div>
    );
};

export default Chatbot;