import express from "express";

import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { courseAnalytic, orderAnalytic, userAnalytic } from "../controller/analyticController";

const router = express.Router();

router.get("/user-analytic", isAuthenticated, authorizeRoles("admin"), userAnalytic);
router.get("/order-analytic", isAuthenticated, authorizeRoles("admin"), orderAnalytic);
router.get("/course-analytic", isAuthenticated, authorizeRoles("admin"), courseAnalytic);


export default router;
