require('dotenv').config();
const mongoose = require("mongoose");

const connectionString = process.env.MONGO_URI;
// node env empeche la connexion rééle de se lancer avec les tests sinon ça crash
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(connectionString, { connectTimeoutMS: 2000 })
    .then(() => console.log('Database connected'))
    .catch(error => console.error('MongoDB connection error', error));
}

// il faut toujours mettre ---// NODE_ENV=test yarn test //---  dans le terminal avant de lancer les tests