// models/Contact.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js"; // Import User model for association

const Contact = sequelize.define(
  "Contact",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^\+?[1-9]\d{1,14}$/,
      },
    },
  },
  {
    tableName: "contacts",
    timestamps: true,
    indexes: [
      // Ensure a user cannot add the same phone number as a contact multiple times
      {
        unique: true,
        fields: ["userId", "phoneNumber"],
      },
    ],
  }
);

// Define association: A User can have many Contacts
User.hasMany(Contact, { foreignKey: "userId", as: "personalContacts" });
Contact.belongsTo(User, { foreignKey: "userId", as: "owner" });

export default Contact;
