import express from 'express'
import { allCourses, editCourse, getSingleCourse, uploadCourse } from '../controller/courseController'
import { authorizeRoles, isAuthenticated } from '../middleware/auth'

const router = express.Router()

// user api route
router.post("/course", isAuthenticated, uploadCourse)
router.put("/edit-course/:id", isAuthenticated, editCourse)
router.get("/course/:id", getSingleCourse)
router.get("/course", allCourses)


export default router

