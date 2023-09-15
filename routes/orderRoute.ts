import express from 'express'
import { authorizeRoles, isAuthenticated } from '../middleware/auth'
import { createOrder, getAllOrders } from '../controller/orderController'
const router = express.Router()

// user api route
router.post("/create-order", isAuthenticated, createOrder)
router.get("/all-orders", isAuthenticated, authorizeRoles("admin"), getAllOrders)


export default router

