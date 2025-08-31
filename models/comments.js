const mongoose = require("mongoose");

const commentsSchema = mongoose.Schema({
  planningChallengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "plannings",
    required: true,
  },
  content: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
});

const Comment = mongoose.model("comments", commentsSchema);

module.exports = Comment;
