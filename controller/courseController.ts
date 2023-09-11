import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { createCourse } from "../services/courseServices";
import Course from "../models/courseModels";
import { redis } from "../config/redis";

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

// get single course -- without purchase
export const getSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      // check cache is exists in redis
      const isCacheExist = await redis.get(courseId);
      if (isCacheExist) {
        const coursedata = await JSON.parse(isCacheExist);
        res.status(200).json({
          success: true,
          coursedata,
        });
      } else {
        
        const course = await Course.findById(courseId).select(
          "-courseData.videoUrl -courseData.questions -courseData.links"
        );
         // set course data in redis as cache
        await redis.set(courseId, JSON.stringify(course));

        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error) {
      next(new ErrorHandler(error.message, 400));
    }
  }
);

//  get all course -- without purchase
export const allCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // check cache is exists in redis
      const isCacheExist = await redis.get("allCourses");
      if (isCacheExist) {
        const courses = JSON.parse(isCacheExist);

        res.status(200).json({
          success: true,
          courses,
        });
      } else {
        const courses = await Course.find();

         // set course data in redis as cache
        await redis.set("allCourses", JSON.stringify(courses));

        res.status(200).json({
          success: true,
          courses,
        });
      }
    } catch (error) {
      next(new ErrorHandler(error.message, 400));
    }
  }
);
