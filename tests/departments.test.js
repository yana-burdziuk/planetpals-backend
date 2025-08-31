const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Department = require("../models/departments");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Department.deleteMany({});
});

test("Create a department", async () => {
  const department = new Department({
    name: "Marketing",
    totalPoints: 0,
    totalCo2SavingsPoints: 0,
    isActive: true,
  });

  const savedDepartment = await department.save();
  expect(savedDepartment).toBeDefined();
  expect(savedDepartment.name).toBe("Marketing");
  expect(savedDepartment.totalPoints).toBe(0);
  expect(savedDepartment.isActive).toBe(true);
});

test("Fail is name is not defined", async () => {
  const department = new Department({
    totalPoints: 0,
    totalCo2SavingsPoints: 0,
    isActive: true,
  });

  const error = department.validateSync();
  expect(error.errors.name).toBeDefined();
});
