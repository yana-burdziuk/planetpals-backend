const mongoose = require("mongoose");

const planningChallengeSchema = mongoose.Schema({
  createdAt: Date,
  expiresAt: Date,
  isActive: Boolean,
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "templates",
    required : true,
  },
  frequency: {
    type: String,
    enum: ["daily", "weekly"], // enum pour dire que seules ces deux valeurs sont autorisées, sinon mongoose nous envoie une erreur
    required : true,
  }
});

const Planning = mongoose.model("plannings", planningChallengeSchema);

module.exports = Planning;
