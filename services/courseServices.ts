import { Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import Course from "../models/courseModels";

export const createCourse = CatchAsyncError(async(data: any, res:Response) => {
    const course = await Course.create(data)

    res.status(200).json({
        success: true,
        course
    })
})