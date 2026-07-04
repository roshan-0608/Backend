import { requesthandler } from "../utils/requesthandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiresponse.js";
import { user } from '../models/user.model.js';
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefereshTokens = async(userId) =>{
    // console.log(userId);
    try {
        const User = await user.findById(userId)
        const accessToken = User.generateAccessToken()
        const refreshToken = User.generateRefreshToken()

        User.refreshToken = refreshToken
        // console.log(User.refreshToken);
        await User.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}
const registerUser = requesthandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    // const {fullName, email, password, username} = req.body;
    // if([fullName, email, password, username].some((field)=>{
    //     return field?.trim()=== "";
    // })){
    //     throw new ApiError(400, "All field are required");
    // }

    // uper wale ka simpler version
    // trim removes spaces in string

    const { fullName, email, password, username } = req.body;
    const fields = [fullName, email, username, password];

    for (let field of fields) {
        if (!field || field.trim() === "") {
            throw new ApiError(400, "All fields are required");
        }
    }
    const existedUsers = await user.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUsers) {
        throw new ApiError(409, "User alredy existed");
    }

    // console.log(req.files);
    // this is req.files
    // req.files = {
    //     avatar: [
    //         {
    //             fieldname: "avatar",
    //             originalname: "photo.png",
    //             filename: "photo.png",
    //             path: "./public/temp/photo.png"
    //         }
    //     ],

    //     coverImage: [
    //         {
    //             fieldname: "coverImage",
    //             originalname: "cover.jpg",
    //             filename: "cover.jpg",
    //             path: "./public/temp/cover.jpg"
    //         }
    //     ]
    // }
    // req.files.avatar is an array 

    // console.log("req.files:", req.files);
    // console.log("req.body:", req.body);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    // checks if req.files is not undefined and req.files is array only no and req.files.length is > 0 only no if so cover image is uploaded
    if (req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0) {
        coverImageLocalPath = req.files.coverimage[0].path
    }

    // checks if avatar is uploaded or not if not uploaded 
    // avatarLocalPath is undefined and !undefined === true returns error
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    // if avatar image is uploaded then upload it on cloudinary 
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    // console.log("Cloudinary Response:", avatar);
    // here it checks it avatar image while uploading on cloudinary is failed returns error
    // !null === true
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // store data in mongoDB by .create
    const storeduser = await user.create({
        fullName,
        avatar: avatar.url, // only stores avatar ka url
        coverimage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // .select tells us what to include and what to exclude "-" means exclude
    const createdUser = await user.findById(storeduser._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})

const loginUser = requesthandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const User = await user.findOne({
        $or: [{username}, {email}]
    })

    if (!User) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await User.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(User._id)

    const loggedInUser = await user.findById(User._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                User: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

/*
Removes the Refresh Token from the database using $unset, so it can't be used to generate new Access Tokens.
Clears both the Access Token and Refresh Token cookies from the browser.
Returns a success response, completing the logout process.
*/
const logoutUser = requesthandler(async(req, res) => {
    await user.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})


// jab accesstoken khatam ho jata tab vo silently refreshtoken ko call karta hai fir backend refresh token to verify karta 
// agr verify ho gaya toh new access aur refresh token generate karta hai aur checks old refreshtoken and newrefreshtoken this 
// is called refreshtokenrotation
const refreshAccessToken = requesthandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const User = await user.findById(decodedToken?._id)
    
        if (!User) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== User?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(User._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})


export { registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
 };