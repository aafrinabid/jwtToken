const express=require('express')
const mongoose=require('mongoose')
const bodyParser=require('body-parser')
const jwt=require('jsonwebtoken')
const path=require('path')
const User=require('./models/schema')
const routes=require('./routes/routes')

require('dotenv').config({
    path:path.join(__dirname,'../.env')
})

const app=express()
const PORT=3000
  
dbUrl='mongodb://localhost:27017/adp'
mongoose.connect(dbUrl),{
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false
}
const db=mongoose.connection;
db.on("error",console.error.bind(console,'connection error:'));
db.once("open",()=>{
  console.log('database connnected');
})

app.use(bodyParser.urlencoded({ extended: true }));
 
app.use(async (req, res, next) => {
  console.log('hiiii i am on');
  if (req.headers["x-access-token"]) {
   const accessToken = req.headers["x-access-token"];
   console.log(accessToken); 
   const { userId, exp } = await jwt.verify(accessToken, process.env.JWT_SECRET);
   // Check if token has expired
   if (exp < Date.now().valueOf() / 1000) {
    return res.status(401).json({
     error: "JWT token has expired, please login to obtain a new one"
    });
   }
   res.locals.loggedInUser = await User.findById(userId);
   next();
  } else {
   next();
  }
});
  app.use('/', routes);
  
  
  app.listen(PORT, () => {
    console.log('Server is listening on Port:', PORT)
  })
