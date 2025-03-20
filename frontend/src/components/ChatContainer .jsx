import React, { useEffect, useRef } from "react";
import { userChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessageLoading,
    selectedUser,
    subscribeToMessages,
    unSubscribeFromMessages,
  } = userChatStore();

  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null);

  // 🔹 Fetch Messages & Subscribe to Updates
  useEffect(() => {
    if (!socket || !socket.connected) {
      return;
    }

    if (selectedUser?._id) {
      getMessages(selectedUser._id);

      subscribeToMessages();
    }

    return () => {
      unSubscribeFromMessages();
    };
  }, [selectedUser, socket]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const chatMessages = messages[selectedUser?._id] || []; // ✅ Directly use Zustand messages

  if (isMessageLoading)
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.map((message, index) => (
          <div
            key={message?._id || `temp-${index}`}
            className={`chat ${
              message?.senderId === authUser?._id ? "chat-end" : "chat-start"
            }`}
            ref={messageEndRef}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.image
                      ? `http://localhost:5001${message.image}`
                      : "/avatar.png"
                  }
                  alt="Sent Image"
                  className="w-20 h-20 object-cover rounded-lg"
                />
              </div>
            </div>
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={`http://localhost:5001${message.image}`}
                  alt="Sent Image"
                  className="max-w-xs rounded-lg"
                />
              )}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
