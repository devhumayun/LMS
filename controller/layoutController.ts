import cloudinary from "cloudinary";
import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import LayoutModel from "../models/layoutModel";

export const createlayout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;

      // check type is exists
      const checkTypeIsExists = await LayoutModel.findOne({ type });
      if (checkTypeIsExists) {
        return next(new ErrorHandler(`${type} already exists`, 400));
      }

      // upload image
      if (type === "BANNER") {
        const { image, title, subTitme } = req.body;

        const myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: "Layout",
        });
        const bannerData = {
          banner: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          },
          title,
          subTitme,
        };
        await LayoutModel.create(bannerData);
      }

      // add faq
      if (type === "FAQ") {
        const { faq } = req.body;
        const faqData = await Promise.all(
          faq.map(async (item: any) => {
            return {
              question: item.question,
              answer: item.answer,
            };
          })
        );
        await LayoutModel.create({ type: "FAQ", faq: faqData });
      }

      // add category
      if (type === "CATEGORY") {
        const { categories } = req.body;

        const categoryData = await Promise.all(
          categories.map(async (item: any) => {
            return {
              title: item.title,
            };
          })
        );
        await LayoutModel.create({
          type: "CATEGORY",
          categories: categoryData,
        });
      }

      res.status(200).json({
        success: true,
        message: "Layout create successfull",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// 
