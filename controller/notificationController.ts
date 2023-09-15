import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import NotificationModel from "../models/notificationModels";
import corn from 'node-cron'

// get all notification
export const getAllNotification = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notifications = await NotificationModel.find().sort({
        createdAt: -1,
      });

      if (!notifications) {
        next(new ErrorHandler("No notification found", 404));
      }

      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error) {
      next(new ErrorHandler(error.message, 500));
    }
  }
);

// update notification status
export const updateNotificationStatus = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notification = await NotificationModel.findById(req.params.id);

      if (!notification) {
        next(new ErrorHandler("No notification found", 404));
      } else {
        notification.status
          ? notification.status = "read"
          : notification.status;
      }

      await notification?.save();

      const notifications = await NotificationModel.find().sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error) {
      next(new ErrorHandler(error.message, 500));
    }
  }
);

//  delete notification 
corn.schedule("0 0 0 * * *", async() => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await NotificationModel.deleteMany({status:"read",createdAt: {$lt: thirtyDaysAgo}});
});