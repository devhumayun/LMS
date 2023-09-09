import express from 'express'
import { activateUser, userRegistration } from '../controller/user.controller'
const router = express.Router()

// user api route
router.post("/registration", userRegistration)
router.post("/activate-user", activateUser)

export default router