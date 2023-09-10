import express from 'express'
import { activateUser, authorizedRoles, loginUser, logout, updateAccessToken, userRegistration } from '../controller/user.controller'
import { isAuthenticated } from '../middleware/auth'
const router = express.Router()

// user api route
router.post("/registration", userRegistration)
router.post("/activate-user", activateUser)
router.post("/login", loginUser)
router.get("/logout", isAuthenticated, logout)
router.get("/refresh-token", updateAccessToken)

export default router