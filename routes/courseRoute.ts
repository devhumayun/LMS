import express from "express";
import {
  addQuestion,
  addReview,
  allCourses,
  deleteCourse,
  editCourse,
  generateVideoUrl,
  getAllCourse,
  getCourseContent,
  getSingleCourse,
  getVideoUrl,
  questionReplay,
  uploadCourse,
} from "../controller/courseController";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";

const router = express.Router();

// course api route

router.post("/course", isAuthenticated, uploadCourse);
router.put("/edit-course/:id", isAuthenticated, editCourse);
router.get("/course/:id", getSingleCourse);
router.get("/course", allCourses);

router.get("/course-content/:id", isAuthenticated, getCourseContent);

router.put("/add-question", isAuthenticated, addQuestion);
router.put("/question-replay", isAuthenticated, questionReplay);
router.put("/add-review/:id", isAuthenticated, addReview);
router.get(
  "/all-course",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllCourse
);


router.post("/getVideo-getVdoCipherOTP", generateVideoUrl);

router.post("/getVideoUrl", getVideoUrl)


router.delete(
  "/delete-course/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  deleteCourse
);

export default router;
