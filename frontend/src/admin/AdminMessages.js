import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminMessages.css';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const adminId = 'animespring'; // fixed admin id string

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    console.log('Connecting to SSE endpoint as admin'); // Debug log
    // Setup SSE connection for real-time updates as admin
    const eventSource = new EventSource(`http://localhost:5000/api/messages/stream?isAdmin=true`);

    eventSource.onopen = () => {
      console.log('SSE connection opened'); // Debug log
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received SSE data:', data); // Debug log
        // If data is an array, it's initial data
        if (Array.isArray(data)) {
          setMessages(data);
          setLoadingMessages(false);
          console.log('Initial messages loaded:', data.length); // Debug log
        } else {
          // If data is a single object, it's a new message
          setMessages((prevMessages) => {
            // Avoid duplicate messages
            if (prevMessages.find(msg => msg.id === data.id)) {
              return prevMessages;
            }
            return [...prevMessages, data];
          });
          console.log('New message received:', data); // Debug log
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (err) => {
      console.error('EventSource failed:', err);
      eventSource.close();
      setLoadingMessages(false);
    };

    // Set a timeout to stop loading if no messages are received
    const timeout = setTimeout(() => {
      console.log('SSE timeout reached, stopping loading'); // Debug log
      setLoadingMessages(false);
    }, 5000);

    return () => {
      console.log('Closing SSE connection'); // Debug log
      eventSource.close();
      clearTimeout(timeout);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      setUsers(res.data);
      if (res.data.length > 0) {
        setSelectedUserId(res.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async (userId) => {
    setLoadingMessages(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/messages?userId=${userId}`);
      setMessages(res.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId) return;
    try {
      await axios.post('http://localhost:5000/api/faq-messages', {
        content: newMessage.trim(),
        senderId: adminId,
        receiverId: selectedUserId,
      });
      setNewMessage('');
      fetchMessages(selectedUserId);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Get username by userId
  const getUsername = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.username : 'Unknown User';
  };

  // Get last message for each user for preview
  const lastMessagesMap = {};
  messages.forEach((msg) => {
    // For admin panel, we want to show messages between any user and admin
    const userId = msg.senderId === adminId ? msg.receiverId : msg.senderId;
    lastMessagesMap[userId] = msg;
  });

  // Get messages for selected user (if any user is selected)
  const filteredMessages = selectedUserId 
    ? messages.filter(msg => 
        (msg.senderId === adminId && msg.receiverId === selectedUserId) ||
        (msg.senderId === selectedUserId && msg.receiverId === adminId)
      )
    : [];

  return (
    <div className="admin-messages-container">
      <div className="sidebar">
        <h2>Users</h2>
        <ul className="user-list">
          {users.map((user) => {
            const lastMsg = lastMessagesMap[user.id];
            return (
              <li
                key={user.id}
                className={`user-item ${selectedUserId === user.id ? 'selected' : ''}`}
                onClick={() => handleUserSelect(user.id)}
              >
                <div className="user-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <div className="user-name">{getUsername(user.id)}</div>
                  <div className="user-last-message">
                    {lastMsg ? lastMsg.content : 'No messages yet'}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="chat-window">
          <div className="chat-header">
            {selectedUserId ? getUsername(selectedUserId) : 'Select a user'}
          </div>
        <div className="chat-messages">
          {loadingMessages ? (
            <p>Loading messages...</p>
          ) : selectedUserId && filteredMessages.length === 0 ? (
            <p>No messages found for this user.</p>
          ) : selectedUserId ? (
            filteredMessages.map((msg) => (
              <div key={msg.id} className="chat-message">
                <div className="message-content">{msg.content}</div>
                <div className="message-timestamp">
                  {new Date(msg.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          ) : messages.length > 0 ? (
            <p>Please select a user to view messages.</p>
          ) : (
            <p>No messages available. Please select a user and send a message.</p>
          )}
        </div>
        <div className="chat-input">
          <textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={!selectedUserId}
          />
          <button onClick={handleSendMessage} disabled={!selectedUserId}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
