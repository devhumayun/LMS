import express from 'express'
import { authorizeRoles, isAuthenticated } from '../middleware/auth'
import { createlayout, editLayout, getLayout } from '../controller/layoutController'
const router = express.Router()

// user api route
router.post("/create-layout", isAuthenticated, authorizeRoles("admin"), createlayout)
router.put("/edit-layout", isAuthenticated, authorizeRoles("admin"), editLayout)
router.get("/get-layout", getLayout)


export default router