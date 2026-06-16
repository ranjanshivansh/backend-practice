import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudiary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessandRefreshToken=async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}
    } catch (error) {
        console.log(error)
        throw new ApiError(500,"Something went wrong when genrating refresh and access tokens")
    }
}

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
    const existedUser=await User.findOne({
        $or:[{email},{username}]
    })

    if(existedUser){
        throw new ApiError(409,"Username or email already exits")
    }
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);
    const avatarLocalPath=req.files?.avatar[0]?.path
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

   const avatar=await uploadOnCloudiary(avatarLocalPath)
   const coverImage=await uploadOnCloudiary(coverImageLocalPath);

   if(!avatar){
        throw new ApiError(400,"Avatar file is required")
   }

   const user=await User.create({
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

const loginUser=asyncHandler(async(req,res)=>{
    //req body-> data
    //username or email exists
    //find user
    //password check
    //access token and refresh token
    //send cookie
    console.log(req.body)
    const {username,email,password}=req.body
    if(!(username || email)){
        throw new ApiError(400,"username or email is required")
    }
    const user=await User.findOne({
        $or:[{username},{email}]
    })
    
    if(!user){
        throw new ApiError(404,"Username doesnot exist")
    }

    const isPasswordValid=await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(404,"Password is incorrect")
    }

    const {refreshToken,accessToken}=await generateAccessandRefreshToken(user._id)
    
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }
    
    return res.status(200).cookie("refreshToken",refreshToken,options).cookie("accessToken",accessToken,options)
              .json(
                new ApiResponse(200,
                    {
                        user:loggedInUser,accessToken,refreshToken
                    },
                    "User logged in Successfully"
                )
              )
})

const logOutUser=asyncHandler(async(req,res)=>{
    const k=await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200,{},"User logged out succesfully"))
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
   const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken
   if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
   }

   try {
    const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    const user=await User.findById(decodedToken?._id)
    if(!user){
     throw new ApiError(401,"Invalid Refresh Token")
    }
    if(incomingRefreshToken!==user?.refreshToken){
     throw new ApiError(401,"Refresh Token is expired or used")
    }
 
    const options={
     httpOnly:true,
     secure:true
    }
    
    const {accessToken,newRefreshToken}=await generateAccessandRefreshToken(user._id)
    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newRefreshTokenefreshToken,options)
    .json(
     new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},"Access Token Refreshed Successfully")
    )
   } catch (error) {
    throw new ApiError(401,error?.message||"Invalid Refresh Token")
   }
})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body
    const user=await User.findById(req?.user._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old Password")
    }

    user.password=newPassword
    user.save({validateBeforeSave:false})
    return res.status(200).json(new ApiResponse(200,{},"Password changed Successfully"))

})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res.status(200).json(new ApiResponse(200,req.user,"User details sent successfully"))
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body
    if(!fullName || !email){
        throw new ApiError(400,"All Fields are required")
    }
    const user=await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            fullName,
            email
        }
    },{new:true}).select("-password")

    return res.status(200).json(new ApiResponse(200,user,"Account Details updated successfully"))
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }
    const avatar=await uploadOnCloudiary(avatarLocalPath)
    if(!avatar.url){
        throw ApiError(400,"Error while uploading on avatar")
    }

    const user=await User.findByIdAndUpdate(req.user?._ud,{
        $set:{
            avatar:avatar.url
        }
    },{new:true}).select("-password")

    return res.status(200).json(new ApiResponse(200,user,"Avatar image updated successfully"))
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover Image File is missing")
    }
    const coverImage=await uploadOnCloudiary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading on Cover Image")
    }
    const user=await User.findByIdAndUpdate(req.user?._ud,{
        $set:{
            coverImage:coverImage.url
        }
    },{new:true}).select("-password")
    
    return res.status(200).json(new ApiResponse(200,user,"Cover Image updated successfuly"))
})
export {registerUser,loginUser,logOutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage}