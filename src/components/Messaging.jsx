import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { databases, ID, Query, Permission, Role } from '../lib/appwrite';

const Messaging = ({ loggedInUser, selectedUser }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null); // Ref to scroll to the bottom

  // Function to scroll to the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(scrollToBottom, [messages]); // Scroll whenever messages update

  // Fetches the history of messages between the two users
  const fetchMessages = async () => {
    if (!selectedUser) return;

    try {
      const response = await databases.listDocuments(
        '68b213e7001400dc7f21', // Database ID
        'messages_table', // Messages collection ID
        [
          // Fetch messages where the sender/receiver combo matches
          Query.equal('senderID', [loggedInUser.$id, selectedUser.$id]),
          Query.equal('receiverID', [loggedInUser.$id, selectedUser.$id]),
        ]
      );
      // Sort messages by creation time
      const sortedMessages = response.documents.sort((a, b) => new Date(a.$createdAt) - new Date(b.$createdAt));
      setMessages(sortedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages in real-time
    const unsubscribe = databases.subscribe(`databases.68b213e7001400dc7f21.collections.messages_table.documents`, response => {
      // Check if the new message belongs to the current conversation
      const newMessage = response.payload;
      const isRelevant = 
        (newMessage.senderID === loggedInUser.$id && newMessage.receiverID === selectedUser.$id) ||
        (newMessage.senderID === selectedUser.$id && newMessage.receiverID === loggedInUser.$id);

      if (response.events.includes("databases.*.collections.*.documents.*.create") && isRelevant) {
        // Add the new message to the state without re-fetching the whole list
        setMessages(prevMessages => [...prevMessages, newMessage]);
      }
    });

    // Cleanup subscription on component unmount
    return () => {
      unsubscribe();
    };
  }, [selectedUser, loggedInUser.$id]); // Re-run when the selected user changes

  const sendMessage = async (e) => {
    e.preventDefault();
    if (message.trim() === '' || !selectedUser) return;

    try {
      await databases.createDocument(
        '68b213e7001400dc7f21', // Database ID
        'messages_table',      // Messages collection ID
        ID.unique(),
        {
          senderID: loggedInUser.$id,
          receiverID: selectedUser.$id,
          message: message,
        },
        [
          // Grant read access to both the sender and receiver
          Permission.read(Role.user(loggedInUser.$id)),
          Permission.read(Role.user(selectedUser.$id))
        ]
      );
      setMessage(''); // Clear the input field
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow p-4 space-y-4 overflow-y-auto bg-gray-50 rounded-lg h-64">
        {messages.length > 0 ? messages.map((msg) => (
          <div 
            key={msg.$id} 
            className={`flex ${msg.senderID === loggedInUser.$id ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-4 py-2 rounded-2xl max-w-xs lg:max-w-md ${msg.senderID === loggedInUser.$id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
              <p className="text-sm">{msg.message}</p>
            </div>
          </div>
        )) : (
          <div className="text-center text-gray-500 py-8">No messages yet. Start the conversation!</div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="mt-4 flex items-center space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoComplete="off"
        />
        <button 
          type="submit"
          className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          disabled={!message.trim()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </button>
      </form>
    </div>
  );
};

Messaging.propTypes = {
  loggedInUser: PropTypes.object.isRequired,
  selectedUser: PropTypes.object, // Can be null if no user is selected
};

export default Messaging;
