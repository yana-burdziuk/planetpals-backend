const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true, // username unique
    required : true
  }, 
  email: {
    type: String,
    unique: true,
    lowercase: true,
    required : true,
  },
  password: {
    type: String, // à hasher côté server
    required: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "departments",
    required : true
  },
  token: {
    type: String,
    required: true
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  totalCo2SavingsPoints: {
    type: Number,
    default: 0
  },
  collectedBadges: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "badges",
    default: []
  },
  isAdmin: {
    type: Boolean,
    required: true
  }
});

const User = mongoose.model("users", userSchema);

module.exports = User;
