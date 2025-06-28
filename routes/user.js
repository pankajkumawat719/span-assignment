// routes/user.js
import { Router } from "express";
import auth from "../middleware/auth.js";
import User from "../models/User.js";

const router = Router();

/**
 * @route GET /api/users/me
 * @desc Get logged in user's profile
 * @access Private
 */
router.get("/me", auth, async (req, res) => {
  try {
    // req.user is set by the auth middleware and already excludes password
    res.status(200).json({ user: req.user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch user profile", details: error.message });
  }
});

export default router;
