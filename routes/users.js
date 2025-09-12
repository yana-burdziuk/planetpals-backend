const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const uid2 = require("uid2");
const User = require("../models/users");
const Department = require("../models/departments");

// ROUTE SIGNUP  /users/signup
// (normal - mobile, isAdmin: false, departmentId requis)
router.post("/signup", async (req, res) => {
  const { username, email, password, departmentId } = req.body;

  // on verifie si le username est déjà pris
  const existingUsername = await User.findOne({
    username: username.toLowerCase(),
  });
  if (existingUsername) {
    return res.json({ result: false, error: "Username is already used" });
  }

  // on verifie si email est déjà pris
  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    return res.json({ result: false, error: "Email is already used" });
  }

  // Hash du mot de passe
  const hash = bcrypt.hashSync(password, 10);

  // Création utilisateur avec token
  const newUser = new User({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password: hash,
    token: uid2(32),
    departmentId,
    totalPoints: 0,
    totalCo2SavingsPoints: 0,
    collectedBadges: [],
    isAdmin: false, // force user normal
  });

  await newUser.save();

  res.json({
    result: true,
    token: newUser.token,
    username: newUser.username,
    email: newUser.email,
    departmentId: newUser.departmentId,
    currentPoints: newUser.totalPoints,
    currentCO2: newUser.totalCo2SavingsPoints,
    message: "Signup successful",
  });
});

// ROUTE ADMIN SIGNUP
// /users/admin-signup
// (web - pas de departmentId, isAdmin: true)
router.post("/admin-signup", async (req, res) => {
  const { username, email, password } = req.body;

  // Vérif doublons
  const existingUsername = await User.findOne({
    username: username.toLowerCase(),
  });
  if (existingUsername) {
    return res.json({ result: false, error: "Username is already used" });
  }

  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    return res.json({ result: false, error: "Email is already used" });
  }

  // Hash du mot de passe
  const hash = bcrypt.hashSync(password, 10);

  // Création admin (sans departmentId)
  const newAdmin = new User({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password: hash,
    token: uid2(32),
    isAdmin: true, // force admin
  });

  await newAdmin.save();

  res.json({
    result: true,
    token: newAdmin.token,
    username: newAdmin.username,
    email: newAdmin.email,
    isAdmin: newAdmin.isAdmin,
    message: "Admin signup successful",
  });
});

// ROUTE SIGNIN
// /users/signin
router.post("/signin", async (req, res) => {
  const { credentials, password } = req.body;

  try {
    //si les champs username/email/password sont vides
    if (!credentials || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // vu qu'on cherche soit par email, soit par username, on utilise le opérateur $or
    const user = await User.findOne({
      $or: [
        { email: credentials.toLowerCase() },
        { username: credentials.toLowerCase() },
      ],
    }).populate("departmentId", "name"); // on recupère le nom pour afficher ensuite dans MyTeam

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
      deptName: user.departmentId?.name, // safe si admin sans dept
      currentPoints: user.totalPoints,
      currentCO2: user.totalCo2SavingsPoints,
      isAdmin: user.isAdmin,
      message: "Login successful",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// MIDDLEWARE AUTH
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "No token provided" });

    const user = await User.findOne({ token });
    if (!user) return res.status(401).json({ message: "Invalid token" });
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /users/me
// recuperer les infos du user connecté, utile pour Profile
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
      department: user.departmentId,
      userTotalPoints: user.totalPoints,
      userTotalCo2SavingsPoints: user.totalCo2SavingsPoints,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /users/team
// recuperer la liste des users dans le departement du user connecté (user centric)
router.get("/team", authMiddleware, async (req, res) => {
  try {
    const userDept = req.user.departmentId;

    const teamMembers = await User.find({ departmentId: userDept })
      .select("username totalPoints totalCo2SavingsPoints")
      .populate("departmentId", "name");

    // recup du nom du dept
    const deptName = teamMembers[0]?.departmentId?.name;

    // calcul des totaux
    const totalPoints = teamMembers.reduce((sum, member) => sum + member.totalPoints, 0);
    const totalCO2 = teamMembers.reduce((sum, member) => sum + member.totalCo2SavingsPoints,0);
    // mise à jour du document Department
    await Department.findByIdAndUpdate(userDept, {
      name: deptName,
      totalPoints: totalPoints,
      totalCo2SavingsPoints: totalCO2,
    });

    res.json({
      result: true,
      teamMembers,
      departmentStats: {
        deptName,
        totalPoints,
        totalCO2,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ result: false, error: "Server error" });
  }
});

module.exports = router;
