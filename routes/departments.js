var express = require("express");
var router = express.Router();
require("../models/connection"); // lancement de la connexion avec la DB
const Department = require("../models/departments");

/* POST créer un departement */

router.post("/create", async (req, res) => {
  const { name, totalPoints, totalCo2SavingsPoints, isActive } = req.body;

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

/* GET recuperer UN departement existant => case sensitive */

router.get("/:name", async (req, res) => {
    const deptName = req.params.name;
    const department = await Department.findOne({ name: deptName });
    if (!department) {
        return res.json({result : false, error: "Department not found"})
    }
    res.json({ result: true, department })
})

/* GET recuperer tous les departements existants qui sont actifs */

router.get("/", async (req, res) => {
    const departements = await Department.find({ isActive: true });
    res.json({
        result: true,
        departements,
    })
})

module.exports = router;
