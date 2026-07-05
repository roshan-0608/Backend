import { Router } from "express"
import { loginUser, 
    logoutUser, 
    registerUser, 
    refreshAccessToken,
    changePassword,
    getUserProfile,
    updateUserProfile,
    uploadUserAvatar,
    uploadUserCoverImage,
    getUserChannelProfile,
    getUserWatchHistory
 } from "../controllers/user.controller.js";
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
router.route("/refresh-access-token").post(refreshAccessToken) // why verfiyJWT is not used here 
// because if we put veryifyJWT here it will check the expiry token so refreshacesstoken will never be called 
// we are using refresh token to generate new access token so we don't need to verify access token here

router.route("/change-password").post(verifyJWT, changePassword)
router.route("/get-User-Profile").get(verifyJWT, getUserProfile)
router.route("/update-User-Profile").patch(verifyJWT, updateUserProfile)

router.route("/upload-User-Avatar").patch(verifyJWT, upload.single("avatar"), uploadUserAvatar)
router.route("/upload-User-Cover-Image").patch(verifyJWT, upload.single("coverimage"), uploadUserCoverImage)
router.route("/get-User-Channel-Profile/:username").get(verifyJWT, getUserChannelProfile)
router.route("/get-User-Watch-History").get(verifyJWT, getUserWatchHistory)

export default router;