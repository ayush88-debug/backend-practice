import { Router } from "express";
import { userRegister , 
    userLogin, 
    userLogout,
    refreshAccessToken } from "../controller/user.controllers.js";
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

//secure routes
router.route("/logout").post(varifyJWT , userLogout)

router.route("/refresh-access-token").post(refreshAccessToken)

export default router