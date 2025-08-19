const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const uid2 = require("uid2");
const User = require("../models/users");

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
  });
});

//ROUTE SIGNIN
// post et pas get car donnée sensibles, donc vaut mieux le faire dans le body
router.post("/signin", async (req, res) => {
  const { credentials, password } = req.body;

  // methode findOne étant async on utilise le await
  try {
    const user = await User.findOne({
      // vu qu'on cherche soit par email, soit par username, on utilise le opérateur $or
      $or: [{ email: credentials }, { username: credentials }],
    });
    //si les champs username/email/password sont vides
    if (!credentials || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }
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
    //else on fait le login
    res.status(200).json({ result : true, user, token: user.token, message: "Login successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// Middleware auth 
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "No token provided" });

    const user = await User.findOne({ token });
    if (!user) return res.status(401).json({ message: "Invalid token" });

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
// GET /users/me
router.get("/me", authMiddleware, async (req, res) => {
  res.json({ username: req.user.username });
});

module.exports = router;
