const request = require("supertest"); // pour simuler les requêtes HTTP sur Express
const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server"); // DB en mémoire pour tests

// on importe nos routes et modèles
const challengesRouter = require("../routes/challenges");
const Template = require("../models/template_challenges");
const Planning = require("../models/planning_challenges");
const Submission = require("../models/challenge_submissions");
const Comment = require("../models/comments");
const Department = require("../models/departments");
const User = require("../models/users");

// simuler le server sans toucher au notee
const app = express();
app.use(express.json()); // pour pouvoir parser le body de reponse
app.use("/challenges", challengesRouter);

// variables globales
let mongoServer;
let testUser;
let testDepartment;

// avant tous les tests on crée la db mémoire, user et dept

beforeAll(async () => {
  // db
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // on crée un dept fictif
  testDepartment = await new Department({
    name: "Space",
    totalPoints: 0,
    totalCo2SavingsPoints: 0,
    isActive: true,
  }).save();

  // on crée un user de test pour l'auth middleware
  testUser = await new User({
    username: "testuser",
    email: "testuser@gmail.com",
    password: "secret",
    departmentId: testDepartment._id,
    token: "123456",
    isAdmin: false,
  }).save();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Template.deleteMany({});
  await Planning.deleteMany({});
  await Submission.deleteMany({});
  await Comment.deleteMany({});
});

test("POST /challenges/templates create a template", async () => {
  const response = await request(app)
    .post("/challenges/templates")
    .set("Authorization", `Bearer ${testUser.token}`)
    .send({
      title: "My challenge",
      points: 10,
      co2SavingsPoints: 5,
    });

  expect(response.status).toBe(200);
  expect(response.body.result).toBe(true);

  const template = await Template.findById(response.body.templateId);
  expect(template).toBeDefined();
  expect(template.title).toBe("My challenge");
});

test("POST /challenges make a challenge active", async () => {

  const template = await new Template({
    title: "Template one",
    points: 10,
    co2SavingsPoints: 5,
  }).save();
    
const response = await request(app)
    .post("/challenges")
    .send({
      templateId: template._id.toString(),
      frequency: "daily",
      days: 3,
    });

  expect(response.status).toBe(200);
  expect(response.body.result).toBe(true);

  const planning = await Planning.findById(response.body.planningId);
  expect(planning).toBeDefined();
  expect(planning.isActive).toBe(true);
});

test("POST /challenges/:planningId/submit validate a challenge", async () => {

// on créé un template de test
    const template = await new Template({
    title: "Template two",
    points: 15,
    co2SavingsPoints: 2,
  }).save();

    // on active le challenge
  const planning = await new Planning({
    templateId: template._id,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24*60*60*1000),
    isActive: true,
    frequency: "daily",
  }).save();

    // on valide le challenge
  const response = await request(app)
    .post(`/challenges/${planning._id}/submit`)
    .set("Authorization", `Bearer ${testUser.token}`)
    .send({
      photoUrl: "http://example.com/photo.png",
    });

  expect(response.status).toBe(200);
  expect(response.body.result).toBe(true);
  expect(response.body.pointsUpdate.userPoints).toBe(15);
});


test("POST /challenges/:planningId/comments add a comment", async () => {

    const template = await new Template({
    title: "Template three",
    points: 15,
    co2SavingsPoints: 2,
    }).save();
    
    const planning = await new Planning({
        templateId: template._id,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        isActive: true,
        frequency: "daily"
    }).save();

  // add a comment
  const response = await request(app)
    .post(`/challenges/${planning._id}/comments`)
    .set("Authorization", `Bearer ${testUser.token}`)
    .send({
      content: "Super challenge !",
    });

  expect(response.status).toBe(200);
  expect(response.body.result).toBe(true);

  const comment = await Comment.findById(response.body.commentId);
  expect(comment).toBeDefined();
  expect(comment.content).toBe("Super challenge !");
  expect(comment.userId.toString()).toBe(testUser._id.toString());
});