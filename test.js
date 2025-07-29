require('dotenv').config();
require('./models/connection');
const User = require('./models/users');

const testUser = new User({
  username: 'testuser',
  password: 'test123',
  email: 'test@example.com',
  totalPoints: 0,
  totalCo2SavingsPoints: 0,
  currentPopulation: 0,
  isAdmin: false
});

testUser.save().then(() => {
  console.log('User saved');
});
