import express from "express";
import {
  login,
  logout,
  signup,
  updateProfile,
} from "../controllers/auth.controller.js";
import { checkAuth, protectRoute } from "../middleware/auth.middleware.js";

import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.post("/signup", signup);

router.post("/login", login);

router.post("/logout", logout);

router.put(
  "/update-profile",
  upload.single("profilePic"),
  protectRoute,

  updateProfile
);

router.get("/check", protectRoute, checkAuth);

export default router;
//app.put("/api/auth/update-profile", upload.single("profilePic"), protectRoute, updateProfile);

// import multer from "multer";

// const storage = multer.memoryStorage();
// const upload = multer({ storage });
// upload.single("profilePic"),
