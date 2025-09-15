import { useState, useEffect, useRef } from 'react';
import { databases, ID, Query, client } from '../lib/appwrite';
import PropTypes from 'prop-types';

const Chat = ({ user, selectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [error, setError] = useState(null);

  const getParticipantString = (id1, id2) => [id1, id2].sort().join('_');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!selectedUser) return;

    const participantString = getParticipantString(user.$id, selectedUser.$id);

    const getMessages = async () => {
      try {
        const response = await databases.listDocuments(
          '68b213e7001400dc7f21',
          'messages_table',
          [
            Query.orderAsc('$createdAt'),
            Query.limit(100),
            Query.equal('participants', participantString)
          ]
        );
        setMessages(response.documents);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
        setError('Could not load messages. Please check collection permissions.');
      }
    };

    getMessages();

    const unsubscribe = client.subscribe(`databases.68b213e7001400dc7f21.collections.messages_table.documents`, response => {
      if (response.events.includes("databases.*.collections.*.documents.*.create")) {
        if (response.payload.participants === participantString) {
          setMessages(prevMessages => [...prevMessages, response.payload]);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [selectedUser, user.$id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;
    setError(null);

    try {
      await databases.createDocument(
        '68b213e7001400dc7f21',
        'messages_table',
        ID.unique(),
        {
          senderID: user.$id,
          receiverID: selectedUser.$id,
          message: newMessage,
          participants: getParticipantString(user.$id, selectedUser.$id)
        }
      );
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(`Failed to send message: ${err.message}`);
    }
  };

  if (!selectedUser) {
    return null;
  }

  return (
    <div className="bg-white p-6 shadow-lg rounded-lg">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Chat with {selectedUser.name}</h2>
      <div className="h-80 overflow-y-auto mb-4 p-4 bg-slate-50 rounded-md border">
        {messages.map(message => (
          <div key={message.$id} className={`flex ${message.senderID === user.$id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md p-3 rounded-lg mb-2 ${message.senderID === user.$id ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-800'}`}>
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
