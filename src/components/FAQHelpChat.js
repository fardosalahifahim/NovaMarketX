import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useLocation } from 'react-router-dom';
import './FAQHelpChat.css';

const FAQHelpChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const auth = getAuth();
  const location = useLocation();

  // Extract userId from URL query parameters
  // For format ?{UID}, we need to extract the value after the ?
  const search = location.search;
  let urlUserId = null;
  if (search.startsWith('?')) {
    // Remove the ? and use the rest as the userId
    urlUserId = search.substring(1);
  }
  
  // If we don't have a URL-based userId, use the authenticated user's ID
  const getUserId = () => {
    if (urlUserId) {
      return urlUserId;
    }
    if (currentUser) {
      return currentUser.uid;
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    
    fetchUsers();
    
    // Set up real-time connection
    setupRealTimeConnection();
    
    return () => unsubscribe();
  }, [urlUserId, currentUser]);

  const setupRealTimeConnection = () => {
    // Use URL userId if available, otherwise use current user's ID
    const userId = getUserId();
    
    if (!userId) {
      console.log('No user ID available for real-time connection');
      return;
    }
    
    // Fetch initial messages
    fetchMessages(userId);
    
    // Set up SSE connection
    const eventSource = new EventSource(`http://localhost:5000/api/messages/stream?userId=${userId}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received real-time message:', data);
        
        // If data is an array, it's initial data
        if (Array.isArray(data)) {
          setMessages(data);
        } else {
          // If data is a single object, it's a new message
          setMessages(prevMessages => {
            // Check if message already exists to avoid duplicates
            if (prevMessages.some(msg => msg.id === data.id)) {
              return prevMessages;
            }
            return [...prevMessages, data];
          });
        }
        scrollToBottom();
      } catch (error) {
        console.error('Error parsing real-time message:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
    };
    
    // Clean up event source on component unmount
    return () => {
      eventSource.close();
    };
  };

  const fetchMessages = async (userId) => {
    try {
      if (!userId) return;
      const res = await axios.get(`http://localhost:5000/api/messages?userId=${userId}`);
      setMessages(res.data);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching FAQ messages:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      setUsers(res.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getUsername = (userId) => {
    // Handle both numeric IDs and string UIDs
    const user = users.find(u => {
      // Convert both to strings for comparison
      return String(u.id) === String(userId) || u.uid === String(userId);
    });
    
    // If we found a user in our database, return their username
    if (user) {
      return user.username;
    }
    
    // If we have a currently authenticated user, return their display name
    if (currentUser && (String(currentUser.uid) === String(userId) || String(currentUser.id) === String(userId))) {
      // Firebase user objects have displayName property
      return currentUser.displayName || currentUser.email || 'Authenticated User';
    }
    
    // For Google-authenticated users, try to find by email or UID
    if (userId) {
      // Try to find user by UID
      const userByUid = users.find(u => u.uid === String(userId));
      if (userByUid) {
        return userByUid.username;
      }
      
      // Try to find user by email (if userId is an email)
      if (userId.includes('@')) {
        const userByEmail = users.find(u => u.email === userId);
        if (userByEmail) {
          return userByEmail.username;
        }
      }
    }
    
    // Default fallback
    return 'Unknown User';
  };

  const isCurrentUser = (senderId) => {
    // Handle both numeric IDs and string UIDs
    const currentUserId = getUserId();
    if (currentUserId) {
      return senderId === currentUserId;
    }
    return false;
  };

  const handleSend = async () => {
    // Use URL userId if available, otherwise use current user's ID
    const userId = getUserId();
    
    if (!input.trim() || !userId) return;
    
    try {
      const adminId = 'animespring';
      const senderId = userId;
      const receiverId = adminId;
      
      const response = await axios.post('http://localhost:5000/api/faq-messages', {
        content: input,
        senderId,
        receiverId
      });
      
      console.log('Message sent response:', response.data);
      setInput('');
      // Note: Real-time update will come through SSE, so we don't need to manually update state here
    } catch (error) {
      console.error('Error sending FAQ message:', error);
      // Show error to user
      alert('Error sending message: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="faq-help-chat-container">
      <h2>FAQ & Help Chat</h2>
      <div className="messages-container">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message-item ${isCurrentUser(msg.senderId) ? 'sent' : 'received'}`}
          >
            <div className="message-username">{getUsername(msg.senderId)}</div>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-container">
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          rows={3}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default FAQHelpChat;
