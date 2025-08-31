import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { databases, ID, Query } from '../lib/appwrite';

const Messaging = ({ loggedInUser, selectedUser }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  const fetchMessages = async () => {
    if (!selectedUser) return;

    try {
      const response = await databases.listDocuments(
        '68b213e7001400dc7f21', // Your database ID
        'messages_table', // Your messages collection ID
        [
          Query.equal('senderID', [loggedInUser.$id, selectedUser.$id]),
          Query.equal('receiverID', [loggedInUser.$id, selectedUser.$id]),
        ]
      );
      setMessages(response.documents.sort((a, b) => new Date(a.$createdAt) - new Date(b.$createdAt)));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    fetchMessages();
    const unsubscribe = databases.subscribe(`collections.messages_table.documents`, response => {
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            fetchMessages();
        }
    });

    return () => {
        unsubscribe();
    };
  }, [selectedUser]);

  const sendMessage = async () => {
    if (message.trim() === '' || !selectedUser) return;

    try {
      await databases.createDocument(
        '68b213e7001400dc7f21', // Your database ID
        'messages_table', // Your messages collection ID
        ID.unique(),
        {
          senderID: loggedInUser.$id,
          receiverID: selectedUser.$id,
          message: message,
        }
      );
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div>
      <h2>Messaging</h2>
      <div style={{ height: '300px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}>
        {messages.map((msg) => (
          <div key={msg.$id} style={{ textAlign: msg.senderID === loggedInUser.$id ? 'right' : 'left' }}>
            <p style={{
              backgroundColor: msg.senderID === loggedInUser.$id ? '#dcf8c6' : '#fff',
              padding: '5px 10px',
              borderRadius: '10px',
              display: 'inline-block'
            }}>
              {msg.message}
            </p>
          </div>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

Messaging.propTypes = {
    loggedInUser: PropTypes.object.isRequired,
    selectedUser: PropTypes.object,
};

export default Messaging;
