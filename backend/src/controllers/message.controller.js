import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import mongoose from "mongoose";
import { getREceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUser = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUser);
  } catch (error) {
    console.log("error in getUserforSidebar controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const getMessages = async (req, res) => {
  try {
    let { id: userToChatId } = req.params;
    const myId = req.user._id;
    userToChatId = userToChatId.replace(/^send/, "");

    console.log("Cleaned userToChatId:", userToChatId);
    console.log("myId:", myId);

    // Ensure they are valid ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(myId) ||
      !mongoose.Types.ObjectId.isValid(userToChatId)
    ) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessages = async (newMessage) => {
  try {
    const receiverId = newMessage.receiverId;

    // ✅ Find receiver's socket ID
    const receiverSocketId = getREceiverSocketId(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    } else {
      console.log("❌ Receiver is not online");
    }
  } catch (error) {
    console.error("❌ Error sending real-time message:", error);
  }
};
