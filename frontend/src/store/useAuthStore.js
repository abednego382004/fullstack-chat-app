import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL =
  import.meta.env.MODE === "development" ? " http://localhost:5001/api" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  // ✅ Check if user is authenticated
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket(); // 🔥 Connect to socket after auth
    } catch (error) {
      console.log(
        "❌ Error in checkAuth:",
        error.response?.data || error.message
      );
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // ✅ Signup function
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("✅ Account created successfully");
      get().connectSocket(); // 🔥 Connect socket after signup
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  // ✅ Login function
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("✅ Logged in successfully");
      get().connectSocket(); // 🔥 Connect socket after login
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // ✅ Logout function
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("✅ Logged out successfully");
      get().disconnectSocket(); // 🔥 Disconnect socket
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  // ✅ Connect to Socket.io
  connectSocket: () => {
    const { authUser } = get();
    if (!authUser) {
      console.log("⚠️ No authenticated user, cannot connect socket.");
      return;
    }
    if (get().socket) {
      console.log("✅ Socket already connected, skipping...");
      return;
    }

    console.log("🚀 Attempting to connect socket...");

    const socket = io(BASE_URL, {
      query: { userId: authUser._id },
    });
    console.log("🛠 Connecting with userId:", authUser?._id);

    socket.connect();

    socket.on("connect", () => {
      console.log("🟢 Socket Connected Successfully!");
    });

    socket.on("connect_error", (err) => {
      console.log("❌ Socket Connection Error:", err.message);
    });

    set({ socket });

    // ✅ Listen for online users update
    socket.on("getOnlineUsers", (userIds) => {
      console.log("👥 Online users:", userIds);
      set({ onlineUsers: userIds });
    });
  },

  // ✅ Disconnect from socket
  disconnectSocket: () => {
    if (get().socket?.connected) {
      get().socket.disconnect();
      set({ socket: null });
    }
  },
}));
