// routes/challenges.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Connexion + modèles
require("../models/connection");
const Template = require("../models/template_challenges"); // Modèle templates
const Planning = require("../models/planning_challenges"); // Modèle plannings
const Submission = require("../models/challenge_submissions"); // Modèle participations
const Comment = require("../models/comments"); // Modèle commentaires
const User = require("../models/users");
const Department = require("../models/departments");

// Middleware d'auth

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ result: false, error: "No token provided" });

  const token = authHeader.split(" ")[1]; // Bearer <token>
  const user = await User.findOne({ token });
  if (!user)
    return res.status(401).json({ result: false, error: "Invalid token" });

  req.user = user;
  next();
}

/**
 * 1) Créer un modèle de challenge (template)
 * POST /challenges/templates
 * Body: { title, description, points, co2SavingsPoints, photoRequired }
 */
router.post("/templates", async (req, res) => {
  try {
    const challengeData = {
      title: req.body.title || "New challenge",
      description: req.body.description || "Description…",
      points: req.body.points,
      co2SavingsPoints: req.body.co2SavingsPoints,
      photoRequired: req.body.photoRequired,
      funFact: req.body.funFact,
      whyImportant: req.body.whyImportant,
    };

    const template = await new Template(challengeData).save();
    res.json({ result: true, templateId: template._id });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

/**
 * 2) Activer un challenge (planning) à partir d’un template
 * POST /challenges
 * Body: { templateId, days }
 */
router.post("/", async (req, res) => {
  try {
    const { templateId, days, frequency } = req.body;

    if (!templateId || !frequency) {
      return res
        .status(400)
        .json({ result: false, error: "templateId and frequency required" });
    }

    const template = await Template.findById(templateId);
    if (!template)
      return res
        .status(404)
        .json({ result: false, error: "Template not found" });

    // Gestion de la date d’expiration
    let expiresAt;
    if (days) {
      const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 1 jour en millisecondes
      expiresAt = new Date(Date.now() + days * ONE_DAY_MS);
    }

    const planning = await new Planning({
      templateId,
      createdAt: new Date(),
      expiresAt,
      isActive: true,
      frequency,
    }).save();

    res.json({ result: true, planningId: planning._id });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

// /challenges/userChallenges
// liste les challenges actifs + validés du user connecté
// la route qu'on utilisera sur l'app front

router.get("/userChallenges", authMiddleware, async (req, res) => {
  try {
    const now = new Date();

    const plannings = await Planning.find({
      isActive: true,
      expiresAt: { $gte: now },
    }).populate(
      "templateId",
      "title description funFact whyImportant points co2SavingsPoints photoRequired frequency"
    );

    const submissions = await Submission.find({ userId: req.user._id });
    const completedIds = submissions.map(
      (submission) => submission.planningChallengeId
    );

    const challenges = plannings.map((planning) => ({
      planningId: planning._id,
      frequency: planning.frequency,
      title: planning.templateId.title,
      description: planning.templateId.description,
      why: planning.templateId.whyImportant,
      funFact: planning.templateId.funFact,
      points: planning.templateId.points,
      co2: planning.templateId.co2SavingsPoints,
      photoRequired: planning.templateId.photoRequired,
      done: completedIds.includes(planning._id),
    }));

    res.json({ result: true, challenges });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

/**
 * 3) Lister les challenges actifs
liste tous les challenges actifs (sans tenir compte du user connecté)
utile pour la page d'admin
 * GET /challenges/active */
router.get("/active", async (req, res) => {
  try {
    const now = new Date();
    const frequency = req.query.frequency; // query car get

    const queryToMongoDB = {
      isActive: true,
      expiresAt: { $gte: now }, // gte operateur c'est Greater Than or Equal
    };
    // si frequency est fourni on filtre aussi par rapport au daily ou weekly
    if (frequency) queryToMongoDB.frequency = frequency;

    // avec ces critères on recupère le planning
    const plannings = await Planning.find(queryToMongoDB).populate(
      "templateId",
      "title description funFact whyImportant points co2SavingsPoints photoRequired"
    );

    const challenges = plannings.map((planning) => ({
      planningId: planning._id,
      startsAt: planning.createdAt,
      endsAt: planning.expiresAt,
      title: planning.templateId?.title,
      description: planning.templateId?.description,
      why: planning.templateId?.whyImportant,
      funFact: planning.templateId?.funFact,
      points: planning.templateId?.points,
      co2: planning.templateId?.co2SavingsPoints,
      photoRequired: planning.templateId?.photoRequired,
    }));

    res.json({ result: true, challenges });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});



  async function updateUserAndDepartmentPoints(userId, planningId, action = 'add') {
  try {
    const planning = await Planning.findById(planningId).populate('templateId');    
    const user = await User.findById(userId);    
    const points = planning.templateId.points;
    const co2Points = planning.templateId.co2SavingsPoints;
    
    // on calcule la diff selon l'action (validation ou suppression)
    const pointsDiff = action === 'add' ? points : -points;
    const co2Diff = action === 'add' ? co2Points : -co2Points;
    
    // on met à jour le user
    await User.findByIdAndUpdate(userId, {
      $inc: {
        totalPoints: pointsDiff,
        totalCo2SavingsPoints: co2Diff
      }
    });
    
    // on recalcule les totaux pour le dept
    const deptUsers = await User.find({ departmentId: user.departmentId });
    const deptTotalPoints = deptUsers.reduce((sum, user) => sum + (user.totalPoints), 0);
    const deptTotalCO2 = deptUsers.reduce((sum, user) => sum + (user.totalCo2SavingsPoints), 0);
    
    // on met à jour le dept
    await Department.findByIdAndUpdate(user.departmentId, {
      totalPoints: deptTotalPoints + pointsDiff,
      totalCo2SavingsPoints: deptTotalCO2 + co2Diff
    });
    
    // les valeurs que le front peut utiliser
    const updatedUser = await User.findById(userId);
    return {
      userPoints: updatedUser.totalPoints,
      userCO2: updatedUser.totalCo2SavingsPoints,
      deptPoints: deptTotalPoints + pointsDiff,
      deptCO2: deptTotalCO2 + co2Diff
    };
    
  } catch (error) {
    console.error('Error updating points:', error);
  }
}
/**
 * 4) Valider le challenge pour le user connecté
 * POST /challenges/:planningId/submit
 * Body: { userId, departmentId, photoUrl }
 */
router.post("/:planningId/submit", authMiddleware, async (req, res) => {
  try {
    const { planningId } = req.params;
    const { photoUrl } = req.body;
    const userId = req.user._id; // user connecté
    const departmentId = req.user.departmentId;
// on vérifie s'il y a déjà eu une validation
    const existingSubmission = await Submission.findOne({
      userId,
      planningChallengeId: planningId
    });
    
    if (existingSubmission) {
      return res.json({ result: false, error: "Challenge already submitted" });
    }

    // sinon on crée un vaalidation
    const submission = await new Submission({
      userId,
      departmentId,
      planningChallengeId: planningId,
      photoUrl: photoUrl || null,
      submittedAt: new Date(),
    }).save();

    // on met à jour les points (user + dept)
    const pointsUpdate = await updateUserAndDepartmentPoints(userId, planningId, 'add');

    res.json({ 
      result: true, 
      planningId: submission.planningChallengeId,
      pointsUpdate // nouvelles valeurs
    });
    
  } catch (error) {
    console.error("Error submitting challenge:", error);
    res.status(500).json({ result: false, error: error.message });
  }
});

/**
 * 5) Delete la soumission du challenge  pour le user connecté
 * DELETE /challenges/:planningId/submission
 */

router.delete("/:planningId/submission", authMiddleware, async (req, res) => {
  try {
    //planningChallengeId dans la collection Submission est un ObjectId
    // et dans l’URL on envoie une string
    //  MongoDB ne la matchera pas sans conversion

    const planningChallengeId = new mongoose.Types.ObjectId(
      req.params.planningId
    );
    const userId = req.user._id;

    // on vérifie si une validation du challenge existe
    const submission = await Submission.findOne({
      planningChallengeId,
      userId,
    });

    if (!submission) {
      return res.json({ result: false, error: "No submission found" });
    }

    // on supprime la soumission
    await Submission.deleteOne({ _id: submission._id });

    // on retire les points 
    const pointsUpdate = await updateUserAndDepartmentPoints(userId, req.params.planningId, 'remove');

    res.json({ 
      result: true,
      pointsUpdate // nouvelles valeurs des points
    });
    
  } catch (error) {
    console.error("Error cancelling submission:", error);
    res.json({ result: false, error: "Server error" });
  }
});
/**
 * 6) Ajouter un commentaire
 * POST /challenges/:planningId/comments
 * Body: { userId, text }
 */
router.post("/:planningId/comments", authMiddleware, async (req, res) => {
  try {
    const { planningId } = req.params;
    const { text } = req.body;
    const userId = req.user._id; // user connecté

    if (!userId || !text) {
      return res
        .status(400)
        .json({ result: false, error: "userId and text required" });
    }

    const comment = new Comment({
      userId,
      planningChallengeId: planningId,
      text,
      createdAt: new Date(),
    }).save();

    res.json({ result: true, commentId: doc._id });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

/**
 * 7) Lister les commentaires d’un challenge
 * GET /challenges/:planningId/comments
 */
router.get("/:planningId/comments", async (req, res) => {
  try {
    const comments = await Comment.find({
      planningChallengeId: req.params.planningId,
    }).populate("userId", "username"); // on récupère juste le nom de l'auteur

    const formatted = comments.map((c) => ({
      user: c.userId?.username || "Anonyme",
      text: c.text,
      createdAt: c.createdAt,
    }));

    res.json({ result: true, comments: formatted });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

/*---------------------UTILE---------------------------*/

// generer le plannning des challenges daily & weekly
// /challenges/generate (tous les challenges de la DB templates seront crée en daily et en weekly pour la DB planning)

router.post("/generate", async (req, res) => {
  try {
    const templates = await Template.find(); // on recupère tous les templates de challenges depuis la collection Templates
    if (!templates.length)
      // si la collection est vide, comme ça on ne crée pas de planning pour des templates inexistants
      return res
        .status(400)
        .json({ result: false, error: "No template found" });

    // pour chaque template, on cree un objet planning "daily"
    const daily = templates.map((template) => ({
      templateId: template._id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isActive: true,
      frequency: "daily", // challenge quotidien
    }));

    const weekly = templates.map((template) => ({
      templateId: template._id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
      frequency: "weekly",
    }));
    // on combine les deux tableraux dans un seul
    // insert many on fait qu'un operation dans Mongo DB
    // await permet d'attendre que ça soit terminé et on recupère les objets par la suite
    const savedPlanning = await Planning.insertMany([...daily, ...weekly]);

    res.json({ result: true, count: savedPlanning.length }); // count pour nombre de plannings au cas ou
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});



module.exports = router;
