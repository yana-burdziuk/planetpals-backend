const mongoose = require("mongoose");

const challengeSubmissionSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "departments",
  },
  planningChallengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "plannings",
  },
  photoUrl: String,
  submittedAt: Date,
});

const challengeSubmission = mongoose.model(
  "challengeSubmissions",
  challengeSubmissionSchema
);

module.exports = challengeSubmission;
