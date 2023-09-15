import { NextFunction, Response } from "express";
import User from "../models/user.model";
import { redis } from "../config/redis";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";

// get user by id
export const getUserById = async (id: string, res: Response) => {
  const userJson = await redis.get(id);
  if (userJson) {
    const user = JSON.parse(userJson);
    res.status(200).json({
      success: true,
      user,
    });
  }
};

//  get all users only for admin
export const getAllUsersServices = CatchAsyncError(
  async (req: Response, res: Response, next: NextFunction) => {
    const allUsers = await User.find().sort({ createdAt: -1 });

    if (!allUsers) {
      next(new ErrorHandler("No Course Found", 500));
    }

    res.status(200).json({
      success: true,
      allUsers,
    });
  }
);

// update user role only for admin
export const updateUserRoleServices = CatchAsyncError(
  async (res: Response, id: string, role: string) => {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    );

    res.status(200).json({
      success: true,
      updatedUser,
    });
  }
);
