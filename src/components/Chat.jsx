import { useState, useEffect, useRef } from 'react';
import { databases, ID, Query, client, Permission, Role } from '../lib/appwrite';
import PropTypes from 'prop-types';

const Chat = ({ user, selectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [error, setError] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!selectedUser) return;

    const getMessages = async () => {
      try {
        const response = await databases.listDocuments(
          '68b213e7001400dc7f21', // Database ID
          'chat_messages',       // Correct Collection ID
          [
            Query.orderAsc('$createdAt'),
            Query.limit(100),
            Query.equal('participants', [user.$id, selectedUser.$id].sort())
          ]
        );
        setMessages(response.documents);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
        setError('Could not load messages.');
      }
    };

    getMessages();

    const unsubscribe = client.subscribe(`databases.68b213e7001400dc7f21.collections.chat_messages.documents`, response => {
      if(response.events.includes("databases.*.collections.*.documents.*.create")){
        // Check if the message involves the current participants
        const participants = response.payload.participants;
        if (participants && participants.includes(user.$id) && participants.includes(selectedUser.$id)) {
            setMessages(prevMessages => [...prevMessages, response.payload]);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user.$id, selectedUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;
    setError(null);

    try {
      await databases.createDocument(
        '68b213e7001400dc7f21',  // Database ID
        'chat_messages',        // Correct Collection ID
        ID.unique(),
        {
          sender_id: user.$id,
          receiver_id: selectedUser.$id,
          message: newMessage,
          participants: [user.$id, selectedUser.$id].sort() // Sort to ensure consistency
        },
        [
            Permission.read(Role.user(user.$id)),
            Permission.read(Role.user(selectedUser.$id)),
        ]
      );
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      setError("Could not send message. Please ensure the 'chat_messages' collection has the correct permissions.");
    }
  };

  if (!selectedUser) {
    return null; // Don't render chat if no user is selected
  }

  return (
    <div className="bg-white p-6 shadow-lg rounded-lg">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Chat with {selectedUser.name}</h2>
      <div className="h-80 overflow-y-auto mb-4 p-4 bg-slate-50 rounded-md border">
        {messages.map(message => (
          <div key={message.$id} className={`flex ${message.sender_id === user.$id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md p-3 rounded-lg mb-2 ${message.sender_id === user.$id ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-800'}`}>
              <p>{message.message}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-grow mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Type your message..."
        />
        <button type="submit" className="inline-flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Send
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};

Chat.propTypes = {
    user: PropTypes.object.isRequired,
    selectedUser: PropTypes.object,
};

export default Chat;
