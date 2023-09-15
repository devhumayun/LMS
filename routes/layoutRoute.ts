import express from 'express'
import { authorizeRoles, isAuthenticated } from '../middleware/auth'
import { createlayout } from '../controller/layoutController'
const router = express.Router()

// user api route
router.post("/create-layout", isAuthenticated, authorizeRoles("admin"), createlayout)


export default router