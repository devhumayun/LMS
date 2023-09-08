require("dotenv").config();
import { NextFunction, Request, Response } from "express";
import ejs from "ejs";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import User from "../models/user.model";
import jwt from "jsonwebtoken";
import path from "path";
import sendMail from "../utils/sendMail";

// user registration interface
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avater?: string;
}

// user registration
export const userRegistration = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, avater } = req.body;

      // check usre isexists
      const isUserExists = await User.findOne({ email });
      if (isUserExists) {
        return next(
          new ErrorHandler("Email already exists. Please login", 400)
        );
      }

      const user: IRegistrationBody = {
        name,
        email,
        password,
      };

      const activationToken = createActivationToken(user);
      const activationCode = activationToken.activationCode;

      const data = { user: { name: user.name }, activationCode };

      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activation-mail.ejs"),
        data
      );

      try {
        await sendMail({
          email: user.email,
          subject: "Activate your account",
          template: "activation-mail.ejs",
          data,
        });

        res.status(201).json({
          success: true,
          message: `Please check your email: ${user.email} to activate your account!`,
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      next(new ErrorHandler(error.message, 400));
    }
  }
);

// activation token interface
interface IActivationToken {
  token: string;
  activationCode: string;
}

// create a activation token
export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9999).toString();

  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_TOKEN_SECRET,
    {
      expiresIn: "10m",
    }
  );

  return { token, activationCode };
};
