// motofix-frontend/src/components/admin/Chat.jsx

import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './Chat.css'; // We'll create this CSS file for styling

// 💡 Connect to your backend server
const socket = io.connect("http://localhost:5050"); // Use your backend's URL

function Chat() {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  
  // You can later expand this to manage multiple user chats
  // For now, all users and admins will join the "support_room"
  const room = "general_support_room";
  const chatBodyRef = useRef(null);

  useEffect(() => {
    // Join the chat room as Admin
    socket.emit("join_room", room);

    // Listener for incoming messages
    const messageListener = (data) => {
      setMessageList((list) => [...list, data]);
    };
    socket.on("receive_message", messageListener);

    // Cleanup listener on component unmount
    return () => socket.off("receive_message", messageListener);
  }, []);

  useEffect(() => {
    // Auto-scroll to the bottom of the chat
    chatBodyRef.current?.scrollTo(0, chatBodyRef.current.scrollHeight);
  }, [messageList]);

  const sendMessage = async () => {
    if (currentMessage.trim() !== "") {
      const messageData = {
        room: room,
        author: "Admin", // Or get admin name from user context
        message: currentMessage,
      };

      await socket.emit("send_message", messageData);
      // Add message to our own list immediately
      setMessageList((list) => [...list, messageData]); 
      setCurrentMessage("");
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <p>Live Chat Support</p>
      </div>
      <div className="chat-body" ref={chatBodyRef}>
        {messageList.map((msg, index) => (
          <div
            key={index}
            className="message"
            id={msg.author === "Admin" ? "you" : "other"}
          >
            <div className="message-content">
              <p>{msg.message}</p>
            </div>
            <div className="message-meta">
              <p id="author">{msg.author}</p>
              <p id="time">{new Date(msg.timestamp || Date.now()).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="chat-footer">
        <input
          type="text"
          value={currentMessage}
          placeholder="Type a message..."
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>&#9658;</button>
      </div>
    </div>
  );
}

export default Chat;