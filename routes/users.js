const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const uid2 = require("uid2");
const User = require("../models/users");
const Department = require("../models/departments");

// ROUTE SIGNUP

router.post("/signup", async (req, res) => {
  const { username, email, password, departmentId } = req.body;

  // Vérifie si email déjà pris
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.json({ result: false, error: "Email is already used" });
  }

  // Hash du mot de passe
  const hash = bcrypt.hashSync(password, 10);

  // Création utilisateur avec token
  const newUser = new User({
    username,
    email,
    password: hash,
    token: uid2(32),
    departmentId,
    totalPoints: 0,
    totalCo2SavingsPoints: 0,
    collectedBadges: [],
    isAdmin: false,
  });

  await newUser.save();

  res.json({
    result: true,
    token: newUser.token,
    username: newUser.username,
    email: newUser.email,
    departmentId: newUser.departmentId,
    currentPoints : newUser.totalPoints,
    message: "Signup successful",
  });
});

// ROUTE SIGNIN

router.post("/signin", async (req, res) => {
  const { credentials, password } = req.body;

  try {
    //si les champs username/email/password sont vides
    if (!credentials || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // vu qu'on cherche soit par email, soit par username, on utilise le opérateur $or
    const user = await User.findOne({
      $or: [{ email: credentials }, { username: credentials }],
    });

    // si on ne trouve pas le user, on affiche une erreur
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // else on va comparer si les passwords match
    const isMatched = await bcrypt.compare(password, user.password);

    // si le password ne match pas on affiche une erreur
    if (!isMatched) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // else on fait le login
    res.status(200).json({
      result: true,
      token: user.token,
      username: user.username,
      email: user.email,
      departmentId: user.departmentId,
      currentPoints : user.totalPoints,
      message: "Login successful",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// MIDDLEWARE AUTH

const authMiddleware = async (req, res, next) => {
  try {
    // on récupère l’en-tête HTTP Auth
    // l’optional chaining ? évite une erreur si le en-tête est absent (undefined)
    // et on enlève le préfixe "Bearer " pour ne garder que le token
    const token = req.headers.authorization?.replace("Bearer ", "");

    // si pas de token, ciao
    if (!token) return res.status(401).json({ message: "No token provided" });

    // sinon on cherche en base le user avec ce token
    const user = await User.findOne({ token });

    // si pas de user, ciao
    if (!user) return res.status(401).json({ message: "Invalid token" });

    // sinon on l'attache pour les req suivant
    req.user = user;

    // next sert à passer la main à la requete suivante, sinon s'il y a un souci ça va rester bloqué indefiniment
    next();
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /users/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "departmentId",
      "name totalPoints totalCo2SavingsPoints"
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      result: true,
      username: user.username,
      email: user.email,
      department: user.departmentId, // contient le nom et stats
      userTotalPoints: user.totalPoints,
      userTotalCo2SavingsPoints: user.totalCo2SavingsPoints,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /users/team

router.get("/team", authMiddleware, async (req, res) => {
  try {
    // on recupere le dept de user connecté
    const userDept = req.user.departmentId;

    // on recupère les users qui ont ce dept en commun
    const teamMembers = await User.find({ departmentId: userDept })

      // on n'a besoin de recup que ces champs de chaque user
      .select("username totalPoints totalCo2SavingsPoints")
      // pour recup le nom du departement
      .populate("departmentId", "name");
    // comme c'est le même depts pour tout le monde on peut recup le premier
    const deptName = teamMembers[0]?.departmentId?.name;

    // calcul des points totaux et mise à jour la DB 

    const totalPoints = teamMembers.reduce((sum, m) => sum + m.totalPoints, 0);
    const totalCO2 = teamMembers.reduce(
      (sum, m) => sum + m.totalCo2SavingsPoints,
      0
    );

    // on met à jour la DB Department avec les points

    await Department.findByIdAndUpdate(userDept, {
      name: deptName,
      totalPoints: totalPoints,
      totalCo2SavingsPoints: totalCO2,
    });

    res.json({
      result: true,
      teamMembers,
      departmentStats: { deptName, totalPoints, totalCO2 },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ result: false, error: "Server error" });
  }
});

module.exports = router;
