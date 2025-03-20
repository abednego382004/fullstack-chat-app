import React, { useRef, useState } from "react";
import { userChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage, selectedUser } = userChatStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setImageFile(file);
  };

  const removeImage = () => {
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault(); // ✅ Prevent page reload

    if (!selectedUser) {
      toast.error("No user selected!");
      return;
    }

    const formData = new FormData();

    // ✅ Trim text to avoid empty spaces being counted as valid input
    const messageText = text.trim();
    const hasText = messageText.length > 0;
    const hasImage = imageFile !== null && imageFile instanceof File;

    console.log("📝 Text:", messageText, "📷 Image:", imageFile);

    if (hasText) {
      formData.append("text", messageText);
    }

    if (hasImage) {
      formData.append("image", imageFile);
    } else {
      console.warn("⚠️ No image selected or invalid file type.");
    }

    console.log("📤 Final FormData:", [...formData.entries()]);

    if (!hasText && !hasImage) {
      toast.error("Message cannot be empty!");
      return;
    }

    try {
      await sendMessage(formData); // ✅ Send FormData properly
      setText(""); // ✅ Clear text input
      setImageFile(null); // ✅ Clear selected image
      if (fileInputRef.current) fileInputRef.current.value = ""; // ✅ Reset file input
    } catch (error) {
      console.error("❌ Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="p-4 w-full">
      {imageFile && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={URL.createObjectURL(imageFile)}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleImageChange}
          />
          <button
            type="button"
            className={`hidden sm:flex btn btn-circle ${
              imageFile ? "text-emerald-500" : "text-zinc-400"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imageFile}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
