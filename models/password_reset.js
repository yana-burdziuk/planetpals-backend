const mongoose = require("mongoose");

const passwordResetSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  token: String,
  createdAt: Date,
  expiredAt: Date,
});

const passwordReset = mongoose.model("passwordResets", passwordResetSchema);

module.exports = passwordReset;
