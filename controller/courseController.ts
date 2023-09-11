import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { createCourse } from "../services/courseServices";
import Course from "../models/courseModels";

// upload new course
export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseData = req.body;
      const thumbnail = courseData.thumbnail;
      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        courseData.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      createCourse(courseData, res, next);
    } catch (error) {
      next(new ErrorHandler(error.message, 400));
    }
  }
);

// edit course
export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseData = req.body;
      const thumbnail = courseData.thumbnail;
      if (thumbnail) {
        await cloudinary.v2.uploader.destroy(thumbnail.public_id);
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        courseData.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      const courseId = req.params.id;
      console.log(courseId);
      
      const updatedCourseData = await Course.findByIdAndUpdate(
        courseId,
        {
          $set: courseData,
        },
        {
          new: true,
        }
      );

      res.status(201).json({
        success: true,
        updatedCourseData,
      });
    } catch (error) {
      next(new ErrorHandler(error.message, 400));
    }
  }
);
