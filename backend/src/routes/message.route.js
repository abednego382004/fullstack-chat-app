import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getUsersForSidebar,
  getMessages,
  sendMessages,
} from "../controllers/message.controller.js";
import multer from "multer";
import Message from "../models/message.model.js";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadDir = path.join("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Store images on disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save images in the "uploads" folder
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post(
  "/send/:id",
  protectRoute,
  upload.single("image"),
  async (req, res) => {
    try {
      console.log("✅ Received FormData:", req.body);
      console.log("📸 Received Image:", req.file);

      const { text } = req.body;
      const receiverId = req.params.id;
      const senderId = req.user._id;
      const image = req.file ? `/uploads/${req.file.filename}` : null;

      if (!text && !image) {
        return res.status(400).json({ message: "Message cannot be empty" });
      }

      // ✅ Create message in DB
      const newMessage = await Message.create({
        senderId,
        receiverId,
        text: text || "",
        image: image || "",
      });

      console.log("📩 Message saved to DB:", newMessage);

      // ✅ Send real-time message using WebSocket
      sendMessages(newMessage);

      // ✅ Send a response to the client
      return res.status(201).json(newMessage);
    } catch (error) {
      console.error("❌ Error saving message:", error);
      return res.status(500).json({ message: "Failed to send message" });
    }
  }
);

export default router;
