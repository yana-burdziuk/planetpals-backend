// routes/challenges.js
const express = require("express");
const router = express.Router();

// Connexion + modèles
require("../models/connection");
const Template = require("../models/template_challenges"); // Modèle templates
const Planning = require("../models/planning_challenges"); // Modèle plannings
const Submission = require("../models/challenge_submissions"); // Modèle participations
const Comment = require("../models/comments"); // Modèle commentaires

/**
 * 1) Créer un modèle de challenge (template)
 * POST /challenges/templates
 * Body: { title, description, points, co2SavingsPoints, photoRequired }
 */
router.post("/templates", (req, res) => {
  const challengeData = {
    title: req.body.title || "Nouveau défi",
    description: req.body.description || "Description…",
    points: req.body.points ?? 100,
    co2SavingsPoints: req.body.co2SavingsPoints ?? 0.5,
    photoRequired: req.body.photoRequired ?? false,
  };

  new Template(challengeData)
    .save()
    .then((doc) => res.json({ result: true, templateId: doc._id }))
    .catch((err) =>
      res.status(500).json({ result: false, error: err.message })
    );
});

/**
 * 2) Activer un challenge (planning) à partir d’un template
 * POST /challenges
 * Body: { templateId, days }
 */
router.post("/", (req, res) => {
  const { templateId, days } = req.body;

  if (!templateId) {
    return res.status(400).json({ result: false, error: "templateId requis" });
  }

  // Gestion de la date d’expiration
  let expiresAt;
  if (days) {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 1 jour en millisecondes
    expiresAt = new Date(Date.now() + days * ONE_DAY_MS);
  } else {
    expiresAt = undefined; // pas de durée => pas d’expiration
  }

  new Planning({
    templateId,
    createdAt: new Date(),
    expiresAt,
    isActive: true,
  })
    .save()
    .then((doc) => res.json({ result: true, planningId: doc._id }))
    .catch((err) =>
      res.status(500).json({ result: false, error: err.message })
    );
});

/**
 * 3) Lister les challenges actifs
 * GET /challenges/active
 */
router.get("/active", (req, res) => {
  const now = new Date();

  Planning.find({ isActive: true })
    .populate(
      "templateId",
      "title description points co2SavingsPoints photoRequired"
    )
    .then((plannings) => {
      // On ne garde que les plannings non expirés
      const active = plannings.filter(
        (p) => !p.expiresAt || p.expiresAt >= now
      );

      const challenges = active.map((p) => ({
        planningId: p._id,
        startsAt: p.createdAt,
        endsAt: p.expiresAt || null,
        title: p.templateId?.title,
        description: p.templateId?.description,
        points: p.templateId?.points,
        co2: p.templateId?.co2SavingsPoints,
        photoRequired: p.templateId?.photoRequired,
      }));

      res.json({ result: true, challenges });
    })
    .catch((err) =>
      res.status(500).json({ result: false, error: err.message })
    );
});

/**
 * 4) Soumettre une participation à un challenge
 * POST /challenges/:planningId/submit
 * Body: { userId, departmentId, photoUrl }
 */
router.post("/:planningId/submit", (req, res) => {
  const { planningId } = req.params;
  const { userId, departmentId, photoUrl } = req.body;

  if (!userId || !departmentId) {
    return res
      .status(400)
      .json({ result: false, error: "userId et departmentId requis" });
  }

  new Submission({
    userId,
    departmentId,
    planningChallengeId: planningId,
    photoUrl: photoUrl || null,
    submittedAt: new Date(),
  })
    .save()
    .then((doc) => res.json({ result: true, submissionId: doc._id }))
    .catch((err) =>
      res.status(500).json({ result: false, error: err.message })
    );
});

/**
 * 5) Ajouter un commentaire
 * POST /challenges/:planningId/comments
 * Body: { userId, text }
 */
router.post("/:planningId/comments", (req, res) => {
  const { planningId } = req.params;
  const { userId, text } = req.body;

  if (!userId || !text) {
    return res
      .status(400)
      .json({ result: false, error: "userId et texte requis" });
  }

  new Comment({
    userId,
    planningChallengeId: planningId,
    text,
    createdAt: new Date(),
  })
    .save()
    .then((doc) => res.json({ result: true, commentId: doc._id }))
    .catch((err) =>
      res.status(500).json({ result: false, error: err.message })
    );
});

/**
 * 6) Lister les commentaires d’un challenge
 * GET /challenges/:planningId/comments
 */
router.get("/:planningId/comments", (req, res) => {
  Comment.find({ planningChallengeId: req.params.planningId })
    .populate("userId", "username") // on récupère juste le nom de l'auteur
    .then((comments) => {
      const formatted = comments.map((c) => ({
        user: c.userId?.username || "Anonyme",
        text: c.text,
        createdAt: c.createdAt,
      }));
      res.json({ result: true, comments: formatted });
    })
    .catch((err) =>
      res.status(500).json({ result: false, error: err.message })
    );
});

module.exports = router;
