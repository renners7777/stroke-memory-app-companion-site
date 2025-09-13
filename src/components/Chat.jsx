import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { databases, ID, Permission, Role, Query } from '../lib/appwrite';

const Chat = ({ user, selectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [relationshipId, setRelationshipId] = useState(null);

  // Find the relationship ID when the selected user changes
  useEffect(() => {
    const findRelationship = async () => {
      if (!user || !selectedUser) return;
      try {
        const response = await databases.listDocuments(
          '68b213e7001400dc7f21',
          'user_relationships',
          [
            Query.equal('companion_id', [user.$id]),
            Query.equal('patient_id', [selectedUser.$id])
          ]
        );

        if (response.documents.length > 0) {
          setRelationshipId(response.documents[0].$id);
        } else {
          const responseAlt = await databases.listDocuments(
            '68b213e7001400dc7f21',
            'user_relationships',
            [
              Query.equal('patient_id', [user.$id]),
              Query.equal('companion_id', [selectedUser.$id])
            ]
          );
          if (responseAlt.documents.length > 0) {
            setRelationshipId(responseAlt.documents[0].$id);
          }
        }
      } catch (error) {
        console.error("Failed to find relationship for chat:", error);
      }
    };
    findRelationship();
  }, [user, selectedUser]);

  // Subscribe to messages when a relationship is established
  useEffect(() => {
    if (!relationshipId) return;

    const fetchMessages = async () => {
        try {
            const response = await databases.listDocuments(
                '68b213e7001400dc7f21',
                'messages_table',
                [Query.equal('relationship_id', relationshipId)]
            );
            setMessages(response.documents);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };
    fetchMessages();

  }, [relationshipId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !relationshipId) return;

    try {
      const messageDoc = await databases.createDocument(
        '68b213e7001400dc7f21', // databaseId
        'messages_table',      // collectionId
        ID.unique(),
        {
          relationship_id: relationshipId,
          sender_id: user.$id,
          content: newMessage,
        },
        [
            Permission.read(Role.user(user.$id)),
            Permission.read(Role.user(selectedUser.$id)),
            Permission.write(Role.user(user.$id)),
            Permission.write(Role.user(selectedUser.$id))
        ]
      );
      setMessages(prev => [...prev, messageDoc]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert("Could not send message. Please ensure the 'messages_table' collection has the correct permissions.");
    }
  };

  return (
    <div className="bg-white p-6 shadow-lg rounded-lg">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Live Chat with {selectedUser?.name || 'Patient'}</h3>
      <div className="h-64 overflow-y-auto bg-slate-50 p-4 rounded-md border border-slate-200 mb-4">
        {messages.map(msg => (
          <div key={msg.$id} className={`flex ${msg.sender_id === user.$id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg my-1 ${msg.sender_id === user.$id ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-800'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {messages.length === 0 && <p className='text-center text-slate-400'>No messages yet. Start the conversation!</p>}
      </div>
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input 
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        <button type="submit" className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Send
        </button>
      </form>
    </div>
  );
};

Chat.propTypes = {
  user: PropTypes.object.isRequired,
  selectedUser: PropTypes.object,
};

export default Chat;
