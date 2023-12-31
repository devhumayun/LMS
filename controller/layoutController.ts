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

// edit layout --admin

export const editLayout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;

      // upload image
      if (type === "BANNER") {
        const bannerInfo: any = await LayoutModel.findOne({ type: "BANNER" });
        if (bannerInfo) {
          await cloudinary.v2.uploader.destroy(bannerInfo.public_id);
        }
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
        await LayoutModel.findByIdAndUpdate(bannerData);
      }

      // add faq
      if (type === "FAQ") {
        const { faq } = req.body;
        const faqItem = await LayoutModel.findOne({ type: "FAQ" });
        const faqData = await Promise.all(
          faq.map(async (item: any) => {
            return {
              question: item.question,
              answer: item.answer,
            };
          })
        );
        await LayoutModel.findByIdAndUpdate(
          faqItem._id,
          { type: "FAQ", faq: faqData },
          { new: true }
        );
      }

      // add category
      if (type === "CATEGORY") {
        const { categories } = req.body;
        const categoryItem = await LayoutModel.findOne({ type: "CATEGORY" });
        const categoryData = await Promise.all(
          categories.map(async (item: any) => {
            return {
              title: item.title,
            };
          })
        );
        await LayoutModel.findByIdAndUpdate(
          categoryItem._id,
          {
            type: "CATEGORY",
            categories: categoryData,
          },
          { new: true }
        );
      }

      res.status(200).json({
        success: true,
        message: "Layout updated successfull",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//   get layout by type
export const getLayout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      const layout = await LayoutModel.findOne({ type });
      if (!layout) {
        return next(new ErrorHandler("Type data not found", 404));
      }
      res.status(200).json({
        success: true,
        layout,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
