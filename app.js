const express = require('express');
const createErrors = require('http-errors');
require('dotenv').config();
require('./helpers/init_redis');
require('./helpers/init_mongoDB');

const {verifyAccessToken} = require('./helpers/jwt_helper');

const AuthRouter = require('./routes/auth.route');

const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const PORT = process.env.PORT; // Default to port 8080 if PORT is not defined in .env


app.get('/',verifyAccessToken,(req,res,next)=>{
  res.send('Welcome to express')
})

app.use('/auth',AuthRouter);

// Exceptions for the unhandles routes
app.use(async(req,res,next)=>{
  next(createErrors.NotFound("Route not found"));
})

app.use(async(err,req,res,next)=>{
  res.status(err.status || 500);
  res.send({
    error:{
      status:err.status || 500,
      message:err.message
    }
  })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
