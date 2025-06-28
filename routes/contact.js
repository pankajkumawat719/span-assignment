// routes/contact.js
import { Router } from "express";
import auth from "../middleware/auth.js";
import Contact from "../models/Contact.js";

const router = Router();

/**
 * @route POST /api/contacts
 * @desc Add a new contact for the logged-in user
 * @access Private
 */
router.post("/", auth, async (req, res) => {
  try {
    const { name, phoneNumber } = req.body;
    const userId = req.user.id; // Get user ID from authenticated request

    if (!name || !phoneNumber) {
      return res
        .status(400)
        .json({ error: "Contact name and phone number are required." });
    }

    const newContact = await Contact.create({
      userId,
      name,
      phoneNumber,
    });

    res
      .status(201)
      .json({ message: "Contact added successfully", contact: newContact });
  } catch (error) {
    console.error("Error adding contact:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "You already have this phone number in your contacts.",
      });
    }
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res
      .status(500)
      .json({ error: "Failed to add contact", details: error.message });
  }
});

/**
 * @route GET /api/contacts
 * @desc Get all contacts for the logged-in user
 * @access Private
 */
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const contacts = await Contact.findAll({
      where: { userId },
      order: [["name", "ASC"]], // Order contacts by name
    });
    res.status(200).json({ contacts });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch contacts", details: error.message });
  }
});

// You can add PUT and DELETE routes for contacts if needed


// For brevity, only POST and GET are included as per the core task.

export default router;
