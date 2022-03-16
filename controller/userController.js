const User =require('../models/schema')
const jwt= require('jsonwebtoken')
const bcrypt=require('bcrypt')
const isAdmin=require('../../middleware/isAdmin')
const {roles}= require('../roles')
module.exports.grantAccess = function(action, resource) {
    return async (req, res, next) => {
     try {
      const permission = roles.can(req.user.role)[action](resource);
      if (!permission.granted) {
       return res.status(401).json({
        error: "You don't have enough permission to perform this action"
       });
      }
      next()
     } catch (error) {
      next(error)
     }
    }
   }


module.exports.allowIfLoggedin = async (req, res, next) => {
    try {
     const user = res.locals.loggedInUser;
     if (!user)
      return res.status(401).json({
       error: "You need to be logged in to access this route"
      });
      req.user = user;
      next();
     } catch (error) {
      next(error);
     }
   }




async function hashPassword(password){
    return await bcrypt.hash(password,10)
}
async function validatePassword(plainPassword,hashedPassword){
    return await bcrypt.compare(plainPassword,hashedPassword)
}

module.exports.signup=async (req,res,next)=>{
    try{
        
        console.log(req.body)
        const {email,password,role}=req.body
        const hashedPassword=await hashPassword(password);
        console.log(hashedPassword)
        const newUser=new User({email,password:hashedPassword,role:role || "basic"})
        const accessToken=jwt.sign({userId:newUser._id},process.env.JWT_SECRET,{
            expiresIn:'1d'
        })
        newUser.accessToken=accessToken;
        await newUser.save()
        res.json({
            data:newUser,
            accessToken
        })
    }catch(error){
        next(error)
    }
}


module.exports.login = async (req, res, next) => {
    try {
     const { email, password } = req.body;
     const user = await User.findOne({ email });
     if (!user) return next(new Error('Email does not exist'));
     const validPassword = await validatePassword(password, user.password);
     if (!validPassword) return next(new Error('Password is not correct'))
     const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d"
     });
     await User.findByIdAndUpdate(user._id, { accessToken })
     res.status(200).json({
      data: { email: user.email, role: user.role },
      accessToken
     })
    } catch (error) {
     next(error);
    }
   }


   module.exports.getUsers = async (req, res, next) => {
    const users = await User.find({});
    res.status(200).json({
     data: users
    });
   }

   module.exports.getUser = async (req, res, next) => {
    try {
     const userId = req.params.userId;
     const user = await User.findById(userId);
     if (!user) return next(new Error('User does not exist'));
      res.status(200).json({
      data: user
     });
    } catch (error) {
     next(error)
    }
   }

   module.exports.updateUser=async (req,user,next)=>{
       try{
           const update=req.body
           const {userId}=req.params
           await User.findByIdAndUpdate(userId,update)
           const user= await User.findById(userId)
           res.status(200).json({
               data:user,
               message:'user has been updated'
           })

       }catch(error){
           next(error)
       }
   }

   module.exports.deleteUser=async (req,res,next)=>{
       try{
           const {userId}=req.params
           await User.findByIdAndDelete(userId)
           res.status(200).json({
               data:null,
               message:'user has been deleted'
           })
       }catch(error){
           next(error)
       }
   }