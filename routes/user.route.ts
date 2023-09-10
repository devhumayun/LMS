import express from 'express'
import { activateUser, authorizedRoles, getUserInfo, loginUser, logout, socialLogin, updateAccessToken, updateUserInfo, userRegistration } from '../controller/user.controller'
import { isAuthenticated } from '../middleware/auth'
const router = express.Router()

// user api route
router.post("/registration", userRegistration)
router.post("/activate-user", activateUser)
router.post("/login", loginUser)
router.get("/logout", isAuthenticated, logout)
router.get("/refresh-token", updateAccessToken)
router.get("/me", isAuthenticated, getUserInfo)
router.post("/social-login", socialLogin)
router.put("/update-user", isAuthenticated, updateUserInfo)

export default router
