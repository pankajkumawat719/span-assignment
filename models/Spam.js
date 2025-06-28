// models/Spam.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js"; // Import User model for association

const Spam = sequelize.define(
  "Spam",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    reportedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
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
    tableName: "spam_reports",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["reportedByUserId", "phoneNumber"],
      },
    ],
  }
);
User.hasMany(Spam, { foreignKey: "reportedByUserId", as: "reportedSpam" });
Spam.belongsTo(User, { foreignKey: "reportedByUserId", as: "reporter" });

export default Spam;
