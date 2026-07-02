import { requesthandler } from "../utils/requesthandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiresponse.js";
import { user } from '../models/user.model.js';
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

export { registerUser };