import { ApiError } from "../utils/ApiError.js";
import { requesthandler } from "../utils/requesthandler.js";
import jwt from "jsonwebtoken"
import { user } from "../models/user.model.js";

/*
when someone calls get/profile how does the backend knows who is giving this request
so it checks its access token, if found it process the request if not throws error
Reads Access Token from cookie/header.
Verifies token using JWT Secret.
Fetches user from database.
Stores user in req.user.
Calls next() if authenticated, otherwise returns 401 Unauthorized.
*/

export const verifyJWT = requesthandler(async(req, _, next) => {
    try {

        // ?. optinal chaining operator => if req.cookies exit ,
        // get accesstoken otherwise it safely returns undefined without thrwing error
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        // console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const User = await user.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!User) {
            
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = User;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    
})