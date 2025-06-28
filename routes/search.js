// routes/search.js
import { Router } from "express";
import { Op } from "sequelize";
import auth from "../middleware/auth.js";
import User from "../models/User.js";
import Contact from "../models/Contact.js";
import Spam from "../models/Spam.js";

const router = Router();

const getSpamLikelihood = async (phoneNumber) => {
  const spamCount = await Spam.count({ where: { phoneNumber } });
  return spamCount;
};

/**
 * @route GET /api/search/name
 * @desc Search for a person by name in the global database
 * @access Private (requires authentication)
 */
router.get("/name", auth, async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user.id;

    if (!query) {
      return res.status(400).json({ error: "Search query is required." });
    }

    // 1. Search in Users (registered users)
    const registeredUsers = await User.findAll({
      where: {
        name: {
          [Op.like]: `%${query}%`,
        },
      },
      attributes: ["id", "name", "phoneNumber", "email"], // Include email for registered users
    });

    const contacts = await Contact.findAll({
      where: {
        name: {
          [Op.like]: `%${query}%`,
        },
      },
      attributes: ["name", "phoneNumber", "userId"],
    });

    // Combine and deduplicate results
    const combinedResults = {};

    for (const user of registeredUsers) {
      const spamLikelihood = await getSpamLikelihood(user.phoneNumber);
      // Check if the current user is in this registered user's contact list
      const isContact = await Contact.findOne({
        where: { userId: currentUserId, phoneNumber: user.phoneNumber },
      });

      combinedResults[user.phoneNumber] = {
        name: user.name,
        phoneNumber: user.phoneNumber,
        spamLikelihood: spamLikelihood,
        isRegistered: true,
        email: isContact ? user.email : null, // Only show email if in contact list
      };
    }

    for (const contact of contacts) {
      // If this phone number is already a registered user, we prioritize that entry
      if (
        combinedResults[contact.phoneNumber] &&
        combinedResults[contact.phoneNumber].isRegistered
      ) {
        continue;
      }

      const spamLikelihood = await getSpamLikelihood(contact.phoneNumber);

      const registeredUserForContact = await User.findOne({
        where: { phoneNumber: contact.phoneNumber },
      });
      const isContactForCurrentUser = await Contact.findOne({
        where: { userId: currentUserId, phoneNumber: contact.phoneNumber },
      });

      combinedResults[contact.phoneNumber] = {
        name: contact.name,
        phoneNumber: contact.phoneNumber,
        spamLikelihood: spamLikelihood,
        isRegistered: !!registeredUserForContact,
        email:
          registeredUserForContact && isContactForCurrentUser
            ? registeredUserForContact.email
            : null,
      };
    }

    // Convert object to array
    let finalResults = Object.values(combinedResults);

    finalResults.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(query.toLowerCase());
      const bStarts = b.name.toLowerCase().startsWith(query.toLowerCase());

      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0; // Maintain original order for same category
    });

    res.status(200).json({ results: finalResults });
  } catch (error) {
    console.error("Error during name search:", error);
    res
      .status(500)
      .json({ error: "Failed to perform name search", details: error.message });
  }
});

/**
 * @route GET /api/search/phone
 * @desc Search for a person by phone number in the global database
 * @access Private (requires authentication)
 */
router.get("/phone", auth, async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user.id;

    if (!query) {
      return res.status(400).json({ error: "Phone number query is required." });
    }

    let results = [];

    // 1. Check if there's a registered user with this phone number
    const registeredUser = await User.findOne({
      where: { phoneNumber: query },
      attributes: ["id", "name", "phoneNumber", "email"],
    });

    if (registeredUser) {
      const spamLikelihood = await getSpamLikelihood(
        registeredUser.phoneNumber
      );
      // Check if the current user is in this registered user's contact list
      const isContact = await Contact.findOne({
        where: {
          userId: currentUserId,
          phoneNumber: registeredUser.phoneNumber,
        },
      });

      results.push({
        name: registeredUser.name,
        phoneNumber: registeredUser.phoneNumber,
        spamLikelihood: spamLikelihood,
        isRegistered: true,
        email: isContact ? registeredUser.email : null, // Only show email if in contact list
      });
    } else {
      // 2. If no registered user, show all results matching that phone number from contacts
      const contacts = await Contact.findAll({
        where: { phoneNumber: query },
        attributes: ["name", "phoneNumber"],
      });

      const spamLikelihood = await getSpamLikelihood(query);

      for (const contact of contacts) {
        results.push({
          name: contact.name,
          phoneNumber: contact.phoneNumber,
          spamLikelihood: spamLikelihood,
          isRegistered: false, // Not a registered user
          email: null, // Contacts do not have emails in this context
        });
      }
    }

    // Deduplicate results if necessary (though logic above should largely prevent duplicates for phone search)
    const uniqueResults = Array.from(new Set(results.map(JSON.stringify))).map(
      JSON.parse
    );

    res.status(200).json({ results: uniqueResults });
  } catch (error) {
    console.error("Error during phone number search:", error);
    res.status(500).json({
      error: "Failed to perform phone number search",
      details: error.message,
    });
  }
});

export default router;
