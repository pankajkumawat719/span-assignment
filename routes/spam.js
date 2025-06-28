// routes/spam.js
import { Router } from "express";
import auth from "../middleware/auth.js";
import Spam from "../models/Spam.js";

const router = Router();

/**
 * @route POST /api/spam
 * @desc Mark a phone number as spam
 * @access Private
 */
router.post("/", auth, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const reportedByUserId = req.user.id;

    if (!phoneNumber) {
      return res
        .status(400)
        .json({ error: "Phone number is required to mark as spam." });
    }

    // Check if the user has already reported this number as spam
    const existingReport = await Spam.findOne({
      where: { reportedByUserId, phoneNumber },
    });

    if (existingReport) {
      return res
        .status(409)
        .json({ message: "You have already reported this number as spam." });
    }

    const newSpamReport = await Spam.create({
      reportedByUserId,
      phoneNumber,
    });

    res
      .status(201)
      .json({
        message: "Number marked as spam successfully",
        report: newSpamReport,
      });
  } catch (error) {
    console.error("Error marking number as spam:", error);
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res
      .status(500)
      .json({ error: "Failed to mark number as spam", details: error.message });
  }
});

export default router;
