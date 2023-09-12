import express from 'express'
import { addQuestion, allCourses, editCourse, getCourseContent, getSingleCourse, questionReplay, uploadCourse } from '../controller/courseController'
import { authorizeRoles, isAuthenticated } from '../middleware/auth'

const router = express.Router()

// user api route
router.post("/course", isAuthenticated, uploadCourse)
router.put("/edit-course/:id", isAuthenticated, editCourse)
router.get("/course/:id", getSingleCourse)
router.get("/course", allCourses)

router.get("/course-content/:id", isAuthenticated, getCourseContent)

router.put('/add-question', isAuthenticated, addQuestion)
router.put('/question-replay', isAuthenticated, questionReplay)


export default router

