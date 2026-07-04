import { Router } from "express"
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

// Express understands JSON and URL-encoded data, 
// but it does not understand file uploads (multipart/form-data) by itself.

//upload.fields() is provided by Multer.

// It says: "If this request contains files, I'll process them first."
// So before registerUser runs, Multer:
// Reads the incoming request.
// Finds the uploaded files.
// Saves them temporarily (e.g., ./public/temp).
// Adds information about those files to req.files.
// Calls next() so your controller can execute.

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverimage",
            maxCount: 1
        }
    ]), 
    registerUser)

router.route("/login").post(loginUser)

/*
Checks whether an Access Token is present in cookies or the Authorization header.
Verifies that the token is valid, unexpired, and signed with the correct secret key.
Checks whether the corresponding user still exists in the database.
Stores the authenticated user in req.user and calls next() 
to allow access to protected routes. If any check fails, it returns 401 Unauthorized.
*/
router.route("/logout").post(verifyJWT,logoutUser)

export default router;