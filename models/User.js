// models/User.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import bcrypt from "bcrypt";

const User = sequelize.define(
  "User",
  {
    // id
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // name
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // phone number
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // UNique phone number
      validate: {
        is: /^\+?[1-9]\d{1,14}$/, //  format for phone numbers
      },
    },
    // email
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    // password
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },

  {
    tableName: "users",
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      // Hash password before updating if password field is changed
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

export default User;
