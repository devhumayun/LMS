import express from 'express'
import { activateUser, loginUser, logout, userRegistration } from '../controller/user.controller'
const router = express.Router()

// user api route
router.post("/registration", userRegistration)
router.post("/activate-user", activateUser)
router.post("/login", loginUser)
router.get("/logout", logout)

export default router