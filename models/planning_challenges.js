const mongoose = require("mongoose");

const planningChallengeSchema = mongoose.Schema({
  createdAt: Date,
  expiresAt: Date,
  isActive: Boolean,
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "templates",
  },
});

const Planning = mongoose.model("plannings", planningChallengeSchema);

module.exports = Planning;
