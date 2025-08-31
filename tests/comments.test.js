const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server"); // MongoMemoryServer permet de créer une DB temporaire en mémoire pour ne pas toucher à la vraie DB
const Comment = require("../models/comments");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  // async / await garantit que Jest attend la connexion avant de lancer les tests
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Comment.deleteMany({});
});

test("Create a comment", async () => {
  const comment = new Comment({
    planningChallengeId: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
    content: "Super challenge !",
  });

  const savedComment = await comment.save();
  expect(savedComment).toBeDefined();
  expect(savedComment.content).toBe("Super challenge !");
  expect(savedComment.userId).toBeDefined();
});

test("Fail if userId is not defined", async () => {
  const comment = new Comment({
    planningChallengeId: new mongoose.Types.ObjectId(),
    content: "Missing something",
  });

  const error = comment.validateSync();
  expect(error.errors.userId).toBeDefined();
});

test("Fail if planningChallengeId is not defined", async () => {
  const comment = new Comment({
    userId: new mongoose.Types.ObjectId(),
    content: "Missing something",
  });

  const error = comment.validateSync();
  expect(error.errors.planningChallengeId).toBeDefined();
});
