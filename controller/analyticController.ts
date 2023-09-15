import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import { generateLast12MothsData } from "../utils/analyticGeneretor";
import User from "../models/user.model";
import Order from "../models/orderModels";
import Course from "../models/courseModels";

// user analytic only for admin
export const userAnalytic = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await generateLast12MothsData(User);

      res.status(200).json({
        success: true,
        users,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Order analytic only for admin
export const orderAnalytic = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const orders = await generateLast12MothsData(Order);
  
        res.status(200).json({
          success: true,
          orders,
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
);


// course analytic only for admin
export const courseAnalytic = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const courses = await generateLast12MothsData(Course);
  
        res.status(200).json({
          success: true,
          courses,
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
);
