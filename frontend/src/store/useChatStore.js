import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const userChatStore = create((set, get) => ({
  users: [],
  selectedUser: null,
  messages: {}, // ✅ Change messages from an array to an object for better state management
  isUserLoading: false,
  isMessageLoading: false,

  getUsers: async () => {
    set({ isUserLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching users");
    } finally {
      set({ isUserLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessageLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set((state) => ({
        messages: { ...state.messages, [userId]: res.data || [] },
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching messages");
    } finally {
      set({ isMessageLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { messages, selectedUser } = get();

    if (!selectedUser || !selectedUser._id) {
      toast.error("No user selected!");
      return;
    }
    console.log(
      "🚀 Sending API request:",
      messageData,
      "to user:",
      selectedUser._id
    );
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData,
        { headers: { "Content-Type": "multipart/form-data" } } // ✅ Let Axios handle this
      );

      if (!res || !res.data) {
        throw new Error("Invalid response from server");
      }

      set(() => ({
        messages: {
          ...messages,
          [selectedUser._id]: [...(messages[selectedUser._id] || []), res.data],
        },
      }));
    } catch (error) {
      console.error("❌ Error sending message:", error);
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.off("newMessage"); // Prevent duplicate listeners

    socket.on("newMessage", (newMessage) => {
      console.log("📩 New message received:", newMessage);

      if (
        newMessage.senderId !== selectedUser._id &&
        newMessage.receiverId !== selectedUser._id
      ) {
        console.log("❌ Message not for this chat, ignoring...");
        return;
      }

      set((state) => {
        const updatedMessages = {
          ...state.messages, // ✅ Keep existing messages
          [newMessage.senderId]: [
            ...(state.messages[newMessage.senderId] || []),
            newMessage,
          ],
        };

        console.log("📝 Updated Messages State:", updatedMessages); // ✅ Now this should appear
        return { messages: updatedMessages };
      });
    });
  },

  unSubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;

    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => {
    localStorage.setItem("selectedUser", JSON.stringify(selectedUser));
    set({ selectedUser });
  },
}));
