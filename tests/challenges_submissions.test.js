const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server"); // MongoMemoryServer permet de créer une DB temporaire en mémoire pour ne pas toucher à la vraie DB
const challengeSubmission = require("../models/challenge_submissions");

let mongoServer; // on stock notre instance de MongoMemoryServer accessible partout dans le fichier

beforeAll(async () => {
  // s'execute une seule fois avant tous les tests du fichier
  mongoServer = await MongoMemoryServer.create(); // creation de la DB en memoire
  const uri = mongoServer.getUri(); // recup le lien de la connexion de la DB crée
  // async / await garantit que Jest attend la connexion avant de lancer les tests
  await mongoose.connect(uri);
});

afterAll(async () => {
  // s'execute tout à la fin
  await mongoose.disconnect(); // on ferme la connexion Mongoose
  await mongoServer.stop(); // on arrête la DB en mémoire et libère la RAM
});

afterEach(async () => {
  // vide la collection entre chaque test
  await challengeSubmission.deleteMany({});
});

//async car save et findOne sont des operatins asynchrones
test("Create a challenge submission", async () => {
  const submission = new challengeSubmission({
    userId: new mongoose.Types.ObjectId(), // id fictif
    departmentId: new mongoose.Types.ObjectId(),
    planningChallengeId: new mongoose.Types.ObjectId(),
    photoUrl: "http://example.com/photo.png",
    submittedAt: new Date(),
  });

  const savedSubmission = await submission.save(); // await pour garantir que ça se finit avant de continuer
  expect(savedSubmission).toBeDefined();
  expect(savedSubmission.departmentId).toBeDefined();
});

test("Fail if userId is not defined", async () => {
  const submission = new challengeSubmission({
    departmentId: new mongoose.Types.ObjectId(),
    planningChallengeId: new mongoose.Types.ObjectId(),
  });

  // submission créé mais pas sauvegardé encore
  // validateSync() méthode synchrone fournie par Mongoose
  // elle vérifie que l’objet respecte toutes les contraintes du schéma : required, type, enum, validate
  // si un champ obligatoire est manquant ou invalide, validateSync() renvoie un objet d’erreur
  // si tout est correct, validateSync() renvoie "undefined"
    const error = submission.validateSync();
    // objet error.errors contient tous les champs qui ont échoué la validation
    //userid sera dedans
    // expect(...).toBeDefined() vérifie que l’erreur existe bien pour ce champ
  expect(error.errors.userId).toBeDefined();
});
