import express from 'express'
import { editCourse, uploadCourse } from '../controller/courseController'
import { authorizeRoles, isAuthenticated } from '../middleware/auth'

const router = express.Router()

// user api route
router.post("/", isAuthenticated, uploadCourse)
router.put("/edit-course/:id", isAuthenticated, editCourse)


export default router

