const mongoose = require("mongoose");

const templateChallengeSchema = mongoose.Schema({
  title: String,
  description: String,
  points: Number,
  co2SavingsPoints: Number,
  photoRequired: Boolean,
  funFact: {
    type: String,
    required: false, // facultatif
  },
  whyImportant: {
    type: String,
    required: false,
  },
});

const Template = mongoose.model("templates", templateChallengeSchema);

module.exports = Template;
