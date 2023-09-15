import express from 'express'
import { isAuthenticated } from '../middleware/auth'
import { createOrder } from '../controller/orderController'
const router = express.Router()

// user api route
router.post("/create-order", isAuthenticated, createOrder)


export default router

