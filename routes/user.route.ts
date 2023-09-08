import express from 'express'
import { userRegistration } from '../controller/user.controller'
const router = express.Router()

// user api route
router.post("/registration", userRegistration)

export default router