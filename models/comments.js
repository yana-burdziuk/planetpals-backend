const mongoose = require("mongoose");

const commentsSchema = mongoose.Schema({
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "plannings",
  },
  content: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
});

const Comment = mongoose.model("comments", commentsSchema);

module.exports = Comment;
