const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: { type: String, unique: true }, // username unique
  email: { type: String, unique: true, lowercase: true },
  password: String, // à hasher côté server
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "departments",
  },
  token : String,
  totalPoints: { type: Number, default: 0 },
  totalCo2SavingsPoints: { type: Number, default: 0 },
  collectedBadges: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "badges",
    default: []
  },
  isAdmin: Boolean,
});

const User = mongoose.model("users", userSchema);

module.exports = User;
