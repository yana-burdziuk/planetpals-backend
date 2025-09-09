var express = require("express");
var router = express.Router();
require("../models/connection"); // lancement de la connexion avec la DB
const Department = require("../models/departments");
const User = require("../models/users")


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


/* POST créer un departement */
// /depts/create

router.post("/create", async (req, res) => {
  const { name } = req.body;

    // vérifier si le dept existe déjà
  const existingDept = await Department.findOne({ name });
  if (existingDept) {
    return res.json({ result: false, error: "Department already exists" });
  }

  const newDept = new Department({
    name,
    totalPoints: 0,
    totalCo2SavingsPoints: 0,
    isActive: false,
  });

  await newDept.save();

  res.json({
    result: true,
    name: newDept.name,
  });
});


// GET recuperer tous les departements existants qui sont actifs 
// /depts

router.get("/", async (req, res) => {
  try {
    const departments = await Department.find(
      { isActive: true },
      "name totalPoints" // champs qu'on veut recuperer
    );

    res.json({
      result: true,
      departments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({result : false, error: "Server error"})
  }
})

// GET récupérer les stats globales du dept auquel appartient l’utilisateur connecté
// utilisé dans la route Home pour recup les stats du dept à la connexion
// /depts/department-stats

router.get("/department-stats", authMiddleware, async (req, res) => {
  try {
    const department = await Department.findById(req.user.departmentId);
    if (!department) {
      return res.json({ result: false, error: "Department not found" });
    }
    
    res.json({
      result: true,
      stats: {
        totalCO2: department.totalCo2SavingsPoints,
        totalPoints: department.totalPoints,
      }
    });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

module.exports = router;
