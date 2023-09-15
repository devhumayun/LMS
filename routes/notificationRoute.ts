import express from 'express'
import { authorizeRoles, isAuthenticated } from '../middleware/auth'
import { createOrder } from '../controller/orderController'
import { getAllNotification, updateNotificationStatus } from '../controller/notificationController'
const router = express.Router()

// user api route
router.get("/all-notification", isAuthenticated, authorizeRoles("admin"), getAllNotification)
router.put("/update-notification-status/:id", isAuthenticated, authorizeRoles("admin"), updateNotificationStatus)


export default router