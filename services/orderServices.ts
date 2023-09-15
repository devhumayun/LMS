import { NextFunction, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import Order from "../models/orderModels";


export const newOrderService = CatchAsyncError(async(res:Response, data:any) => {

    const order = await Order.create(data)
    res.status(201).json({
        success: true,
        order
    })
})