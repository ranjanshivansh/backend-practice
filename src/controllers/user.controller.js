import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudiary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser=asyncHandler(async(req,res)=>{
   //get user details from frontend
   //validation not empty
   //validate if it previously exists uisng username,eemail
   //check for images,avatar,etc
   //upload them to cloudianry
   //create user object for mongo db
   //remove passsword and refresh token
   //return res or error

   const {username,email,fullName,password}=req.body
   console.log("email "+email+" fullName",fullName);
   if(
    [fullName,username,email,password].some((field)=>field?.trim()==="")
   ){
        throw new ApiError(400,"fullname is required")
   }
    const existedUser=User.findOne({
        $or:[{email},{username}]
    })

    if(existedUser){
        throw new ApiError(409,"Username or email already exits")
    }

    const avatarLocalPath=req.files?.avatar[0]?.path
    const coverImageLocalPath=req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

   const avatar=await uploadOnCloudiary(avatarLocalPath)
   const coverImage=await uploadOnCloudiary(coverImageLocalPath);

   if(!avatar){
        throw new ApiError(400,"Avatar file is required")
   }

   const user=User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url||" ",
    email,
    password,
    username:username.toLowerCase()
   })

   const createdUser=await User.findById(user._id).select("-password -refreshToken")

   if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering user")
   }

   return res.status(201).json(
     new ApiResponse(201,createdUser,"User Registerd successfully")
   )
})

export {registerUser}