import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"


const generateAccessAndRefreshToken=async(userId)=>{
  try {
    const user=await User.findOne(userId)
    const accessToken=await user.generateAccessToken()
    const refreshToken=await user.generateRefreshToken()
  
    user.refreshToken=refreshToken
    await user.save({validateBeforeSave: false})
    
    return {accessToken , refreshToken}
    
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating referesh and access token")
  }
}

const userRegister = asyncHandler(async (req, res) => {
  const { fullname, username, email, password } = req.body;
  // console.log("email",email)

  if (
    [fullname, username, email, password]
    .some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All field are required");
  }

  const existedUser=await User.findOne({
    $or:[{username} , {email}]
  })


  if(existedUser){
    throw new ApiError(400, "User with email or username is already exist")
  } 

  // console.log(req.files)

  // const avatarLocalPath = req.files?.avatar[0]?.path
  // const coverImageLocalPath = req.files?.coverImage[0]?.path

  let avatarLocalPath
  if(req.files && Array.isArray(req.files.avatar)
  && req.files.avatar.length>0){
    avatarLocalPath=req.files.avatar[0].path
  }

  let coverImageLocalPath
  if(req.files && Array.isArray(req.files.coverImage)
  && req.files.coverImage.length>0){
    coverImageLocalPath=req.files.coverImage[0].path
  }



  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar Image is Required")
  }

  const avatar= await uploadOnCloudinary(avatarLocalPath)
  const coverImage=await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(500 , "Avatar image upload Failed")
  }

  const user= await User.create({
    fullname:fullname,
    username:username.toLowerCase(),
    email:email,
    password:password,
    avatar:avatar.url,
    coverImage:coverImage?.url || ""
  })

  const createdUser= await User.findById(user._id).select("-password -refreshToken")

  if(!createdUser){
    throw new ApiError(500, "Registering user Failed")
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User Successfully registered")
  )

});


const userLogin = asyncHandler(async (req, res)=>{

  const {username, email, password}=req.body

  if(!(username || email)){
    throw new ApiError(400,"username or email is required")
  }

  const user= await User.findOne({
    $or:[{username},{email}]
  })

  if(!user){
    throw new ApiError(400,"User does not exist")
  }

  const isPasswordValid=await user.isPasswordCorrect(password)

  if(!(isPasswordValid)){
    throw new ApiError(400, "Password is Incorrect")
  }

  const  {accessToken , refreshToken}=await generateAccessAndRefreshToken(user._id)

  const loggedInUser = await User.findById(user._id)
  .select("-password -refreshToken")

  const options={
    httpOnly: true,
    secure:true
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(new ApiResponse(
    200, 
    {
    user:loggedInUser, accessToken, refreshToken
    },
    "User Successfully Logged In"
  )
)

})

const userLogout=asyncHandler(async (req, res)=>{
  const user = req.user

  await User.findByIdAndUpdate(
    user._id,
    {
      $unset:{
        refreshToken:1
      }
    },
    {
      new:true
    }
  )
  const options = {
    httpOnly: true,
    secure: true
  } 

  return res
  .clearCookie("accessToken", options )
  .clearCookie("refreshToken", options )
  .json(new ApiResponse(200, {}, "User Logged Out successfully"))

})

const refreshAccessToken =asyncHandler(async (req, res)=>{
  const incomingRefreshToken= req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ","") || req.body?.refreshToken

  // console.log(incomingRefreshToken)

  if(!incomingRefreshToken){
    throw new ApiError(400, "Unauthorized request")
  }

  
  const decodedRefreshToken= jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
  
  if(!decodedRefreshToken){
    throw new ApiError(400, "Invalid Refresh Token")
  }

  const user= await User.findById(decodedRefreshToken._id)

  if(!user){
    throw new ApiError(400, "Invalid Refresh Token")
  }

  if(user.refreshToken !== incomingRefreshToken){
    throw new ApiError(400, "Refresh Token is expired or used")
  }

  const options = {
    httpOnly: true,
    secure: true
  }

  const  {accessToken , refreshToken}=await generateAccessAndRefreshToken(user._id)

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      {
        accessToken, refreshToken
      },
      "Access Token is successfully Refreshed"
    )
  )

})


const changeCurrentPassword=asyncHandler(async(req, res)=>{
  const {currentPassword, newPassword}=req.body

  if(!(currentPassword && newPassword)){
    throw new ApiError(400,"All fields are required")
  }

  const user=await User.findById(req.user?._id)
  const isPasswordValid= await user.isPasswordCorrect(currentPassword)

  if(!isPasswordValid){
    throw new ApiError(400, "Incorrect Password")
  }

  user.password=newPassword
  await user.save({validateBeforeSave:false})

  res
  .status(200)
  .json(new ApiResponse(200,{}, "Password changed Successfully"))
})

const getCurrentUser=asyncHandler(async(req, res)=>{
  const user= req.user
  return res
  .status(200)
  .json(new ApiResponse(200,user,"User fetched successfully"))
})

const updateAccountDetails=asyncHandler(async(req, res)=>{
  const {fullname , email}=req.body

  if(!(fullname || email)){
    throw new ApiError(400, "All are required fields")
  }

  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullname:fullname,
        email  //ES6 syntax
      }
    },
    {
      new:true
    }
  ).select("-password -refreshToken")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "Account details updated successfully"))

})

const updateUserAvatar=asyncHandler(async(req, res)=>{
  const avatarLocalPath=req.file.path

  if(!avatarLocalPath){
    throw new ApiError(400,"avatar image is required")
  }

  const avatar=await uploadOnCloudinary(avatarLocalPath)

  if(!avatar){
    throw new ApiError(500,"avatar upload on cloudinary FAILED")
  }

  const user= await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar: avatar?.url
      }
    },
    {
      new:true
    }
  ).select("-password -refreshToken")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "User avatar is Successfully updated"))

})

const updateUserCoverImage=asyncHandler(async(req, res)=>{
  const coverImageLocalPath=req.file.path

  if(!coverImageLocalPath){
    throw new ApiError(400,"coverImage image is required")
  }

  const coverImage=await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage){
    throw new ApiError(500,"coverImage upload on cloudinary FAILED")
  }

  const user= await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage: coverImage?.url
      }
    },
    {
      new:true
    }
  ).select("-password -refreshToken")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "User coverImage is Successfully updated"))

})



export { 
  userRegister ,
  userLogin,
  userLogout,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage

};
