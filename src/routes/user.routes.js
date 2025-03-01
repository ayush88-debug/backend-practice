import { Router } from "express";
import { userRegister , 
    userLogin, 
    userLogout,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getChannelProfile,
    getWatchHistory
 } from "../controller/user.controllers.js";
import {upload} from "../middlewares/multer.middlewares.js"
import {varifyJWT} from "../middlewares/auth.middlewares.js"


const router =Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        },
    ]),
    userRegister
)

router.route("/login").post(userLogin)

router.route("/refresh-access-token").post(refreshAccessToken)

//secure routes
router.route("/logout").post(varifyJWT , userLogout)

router.route("/change-password").patch(varifyJWT, changeCurrentPassword)

router.route("/current-user").get(varifyJWT, getCurrentUser)

router.route("/update-account-details").patch(varifyJWT,updateAccountDetails )

router.route("/update-avatar").patch(varifyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/update-coverImage").patch(varifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(varifyJWT, getChannelProfile)

router.route("/watch-history").get(varifyJWT, getWatchHistory)

export default router