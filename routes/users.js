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
    return res.json({ result: false, error: "Email déjà utilisé" });
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

module.exports = router;
