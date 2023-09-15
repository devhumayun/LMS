import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import { IOrder } from "../models/orderModels";
import User, { IUser } from "../models/user.model";
import Course, { ICourse } from "../models/courseModels";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import { redis } from "../config/redis";
import NotificationModel from "../models/notificationModels";
import { newOrderService } from "../services/orderServices";

export const createOrder = CatchAsyncError(

    async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { courseId, payment_info } = req.body as IOrder;

    
          const user = await User.findById(req.user?._id);
    
          const courseExistInUser = user?.courses.some(
            (course: any) => course._id.toString() === courseId
          );
    
          if (courseExistInUser) {
            return next(
              new ErrorHandler("You have already purchased this course", 400)
            );
          }
    
          const course:ICourse | null = await Course.findById(courseId);
    
          if (!course) {
            return next(new ErrorHandler("Course not found", 404));
          }
    
          const data: any = {
            courseId: course._id,
            userId: user?._id,
            payment_info,
          };
    
          const mailData = {
            order: {
              _id: course._id.toString().slice(0, 6),
              name: course.name,
              price: course.price,
              date: new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
            },
          };
    
          const html = await ejs.renderFile(
            path.join(__dirname, "../mails/order-confirmation.ejs"),
            { order: mailData }
          );
    
          try {
            if (user) {
              await sendMail({
                email: user.email,
                subject: "Order Confirmation",
                template: "order-confirmation.ejs",
                data: mailData,
              });
            }
          } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
          }
    
          user?.courses.push(course?._id);
    
          await redis.set(req.user?._id, JSON.stringify(user));
    
          await user?.save();
    
          await NotificationModel.create({
            user: user?._id,
            title: "New Order",
            message: `You have a new order from ${course?.name}`,
          });
    
          course.purchased = course.purchased + 1;
    
          await course.save();
          newOrderService(data, res, next);
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
        }
      }


    // try {
    //   const { courseId, payment_info } = req.body as IOrder;
    //   const userID = req.user._id;
    //   const user:IUser | null = await User.findById(userID);

    //   // check course is exists
    //   const checkCourseIsExistsInUser = user?.courses?.some(
    //     (course: any) => course._id.toString() === courseId
    //   );

    //   if (checkCourseIsExistsInUser) {
    //     next(new ErrorHandler("You are already enrolled this course", 400));
    //   }
    //   const course:ICourse | null = await Course.findById(courseId);
    //   if (!course) {
    //     next(new ErrorHandler("Course not found", 404));
    //   }

    //   const data:any = {
    //     courseId: course?._id,
    //     userId: user?._id,
    //     // payment_info,
    //   };

    //   console.log(data);
      
    //   const emailData = {
    //     order: {
    //       _id: course._id,
    //       name: course.name,
    //       price: course.price,
    //       date: new Date().toLocaleDateString("en-US", {
    //         year: "numeric",
    //         month: "long",
    //         day: "numeric",
    //       }),
    //     },
    //   };


    //   const html = await ejs.renderFile(
    //     path.join(__dirname, "../mails/order-confirmation.ejs"),
    //     {
    //       order: emailData,
    //     }
    //   );

    //   try {
    //     sendMail({
    //       email: user.email,
    //       subject: "Order Confirmation",
    //       template: "order-confirmation.ejs",
    //       data: emailData,
    //     });
    //   } catch (error) {
    //     next(new ErrorHandler(error.message, 500));
    //   }

    //   user?.courses?.push(course?._id);
    //   redis.set(userID, JSON.stringify(user));

    //   // send notification to admin
    //   await NotificationModel.create({
    //     user: user._id,
    //     title: "You have a new order",
    //     message: `${user.name} has create a new order to ${course.name} course`,
    //   });

    //   course.purchased = course.purchased + 1;

    //   course?.save();
    //   newOrderService(data, res, next);
    // } catch (error) {
    //   next(new ErrorHandler(error.message, 500));
    // }
  
);
