if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const path = require('path');
const colors = require('colors');
const cors = require('cors');
const { v2: cloudinary } = require("cloudinary")

const { graphqlHTTP } = require('express-graphql');
const schema = require('../schema/schema');
const connectDB = require('../config/db');
const isAuth = require('../middleware/is-auth');
const isAdmin = require('../middleware/is-admin');

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

const port = process.env.PORT || 5000;

const app = express();

// Serve static files from the build folder
app.use(express.static(path.join(__dirname, '../build')))

// Serve the index.html file for any other requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'))
})

// Connect to database
connectDB();

// middleware
app.use(cors());
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json({ limit: '5mb' }));  // or a suitable limit for your needs
app.use(express.urlencoded({ limit: '5mb', extended: true })); 
app.use(isAuth)

app.use((req, res, next) => {
  req.user = { role: 'ADMIN' }
  next()
})
app.use(isAdmin('ADMIN'))

app.use(
  '/graphql',
  graphqlHTTP((req, res) => ({
    schema,
    graphiql: process.env.NODE_ENV === 'development',
    context: { req, res }
  }))
);

app.listen(port, console.log(`Server running on port ${port}`))


/*
  "client": "npm start --prefix client",
  "dev": "npm-run-all --parallel server client"
*/