import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

import cloudinary from "../lib/CLOUDINARY.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All felds are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "passwoed must be atleast 6 characters" });
    }
    const user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });
    if (newUser) {
      //generate jwt token
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(200).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      return res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid user data" });
    }
    generateToken(user._id, res);
    return res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    return res.status(200).json({ message: "logout successfully" });
  } catch (error) {
    console.log("error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Profile update controller
export const updateProfile = async (req, res) => {
  try {
    console.log("🔥 Received request to update profile");

    // Ensure file exists
    if (!req.file) {
      return res.status(400).json({ message: "ProfilePic is required" });
    }

    console.log("✅ File received:", req.file.originalname);

    // Upload file to Cloudinary
    cloudinary.uploader
      .upload_stream({ resource_type: "image" }, async (error, result) => {
        if (error) {
          console.error("❌ Cloudinary Upload Error:", error);
          return res.status(500).json({ message: "Cloudinary Upload Failed" });
        }

        console.log("✅ Cloudinary Upload Success:", result.secure_url);

        // Update the user profile with new image URL
        const updatedUser = await User.findByIdAndUpdate(
          req.user._id,
          { profilePic: result.secure_url },
          { new: true }
        );

        res.status(200).json(updatedUser);
      })
      .end(req.file.buffer);
  } catch (error) {
    console.error("❌ Error in updateProfile:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Apply the `multer` middleware to your update profile route
