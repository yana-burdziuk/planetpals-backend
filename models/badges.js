const mongoose = require("mongoose");

const badgesSchema = mongoose.Schema({
  name: String,
  iconUrl: String,
  pointsThreshold: Number,
});

const Badge = mongoose.model("badges", badgesSchema);

module.exports = Badge;
