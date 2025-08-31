const mongoose = require("mongoose");

const challengeSubmissionSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "departments",
    required: true,
  },
  planningChallengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "plannings",
    required: true,
  },
  photoUrl: String,
  submittedAt: {
    type: Date,
    default: Date.now // valeur par defaut si pas fourni
  }
});

const challengeSubmission = mongoose.model(
  "challengeSubmissions",
  challengeSubmissionSchema
);

module.exports = challengeSubmission;
