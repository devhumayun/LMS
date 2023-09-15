import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { createCourse } from "../services/courseServices";
import Course from "../models/courseModels";
import { redis } from "../config/redis";
import mongoose from "mongoose";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";

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

// get course content
export const getCourseContent = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req?.user?.courses;
      const courseId = req.params.id;

      // course is exists
      const isExitsCourse = userCourseList.find(
        (course: any) => course._id.toString() === courseId
      );
      if (!isExitsCourse) {
        next(
          new ErrorHandler(
            "You are not eligiable to access to this resource. To access this resource purchased",
            404
          )
        );
      }

      const course = await Course.findById(courseId);
      const content = course?.courseData;

      res.status(200).json({
        success: true,
        content,
      });
    } catch (error) {
      next(new ErrorHandler(error.message, 400));
    }
  }
);

//  add question to course
interface IAddQuestion {
  question: string;
  courseId: string;
  contentId: string;
}
export const addQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId }: IAddQuestion = req.body;

      const course = await Course.findById(courseId);
      // check courseid is exists on mongoose's courseid
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        next(new ErrorHandler("Invalid Course id", 400));
      }

      // math the course content id
      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );
      if (!courseContent) {
        next(new ErrorHandler("Invalid content id", 400));
      }

      const newQues: any = {
        user: req.user,
        question,
        questionReplies: [],
      };

      // push the question to database
      courseContent.questions.push(newQues);

      course.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error) {
      next(new ErrorHandler(error.message, 400));
    }
  }
);

// Questions replay
interface IQuestionReplay {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}
export const questionReplay = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId }: IQuestionReplay =
        req.body;

      const course = await Course.findById(courseId);
      // check courseid is exists on mongoose's courseid
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        next(new ErrorHandler("Invalid Course id", 400));
      }

      // math the course content id
      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );
      if (!courseContent) {
        next(new ErrorHandler("Invalid content id", 400));
      }

      // match the question id
      const question = courseContent.questions.find((item: any) =>
        item._id.equals(questionId)
      );
      if (!question) {
        next(new ErrorHandler("Invalid question id", 400));
      }

      const newAns: any = {
        user: req.user,
        answer,
      };

      question.questionReplies.push(newAns);

      course.save();

      if (req.user._id === question.user._id) {
        // create a notification
      } else {
        const data = {
          name: question.user.name,
          title: courseContent.title,
        };

        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/question-reply.ejs"),
          data
        );

        try {
          sendMail({
            email: question.user.email,
            subject: "Question Reply",
            template: "question-reply.ejs",
            data,
          });
        } catch (error) {
          next(new ErrorHandler(error.message, 400));
        }
      }

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error) {
      next(new ErrorHandler(error.message, 400));
    }
  }
);


// add review
interface IAddReview {
  review: string,
  rating: number
}
export const addReview = CatchAsyncError(async(req: Request, res:Response, next: NextFunction) => {
  try {
    const userCourseList = req.user?.courses

    res.status(200).json({
      success: true,
      userCourseList
    });

    return
    const courseId = req.params.id;

    // check if courseId already exists in userCourseList based on _id
    const courseExists = userCourseList?.some(
      (course: any) => course._id.toString() === courseId.toString()
    );

    if (!courseExists) {
      return next(
        new ErrorHandler("You are not eligible to access this course", 404)
      );
    }

    const course = await Course.findById(courseId);

    const { review, rating } = req.body as IAddReview;

    const reviewData: any = {
      user: req.user,
      rating,
      comment: review,
    };

    course?.reviews.push(reviewData);

    let avg = 0;

    course?.reviews.forEach((rev: any) => {
      avg += rev.rating;
    });

    if (course) {
      course.ratings = avg / course.reviews.length;
    }

    await course?.save();

    await redis.set(courseId, JSON.stringify(course), "EX", 604800); // 7days

    // create notification

  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
})



// get All course only for admin
export const getAllCourse = CatchAsyncError(async(req:Request, res:Response, next:NextFunction) => {
  try {
    const allCourses = await Course.find().sort({createdAt: -1})
    if(!allCourses){
      next(new ErrorHandler("No Course Found", 500))
    }
    res.status(200).json({
      success: true,
      allCourses
    })
  } catch (error) {
    next(new ErrorHandler(error.message, 500))
  }
})