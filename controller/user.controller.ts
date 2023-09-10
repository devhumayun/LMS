import bcrypt from "bcryptjs";
import { IUser } from "./../models/user.model";
require("dotenv").config();
import { NextFunction, Request, Response } from "express";
import ejs from "ejs";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import User from "../models/user.model";
import jwt, { JwtPayload } from "jsonwebtoken";
import path from "path";
import sendMail from "../utils/sendMail";
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../utils/jwt";
import { redis } from "../config/redis";

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
      const { name, email, password, avater }: IRegistrationBody = req.body;

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

// activate user

interface IActivateUser {
  activation_token: string;
  activation_code: string;
}

export const activateUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } = req.body as IActivateUser;

      const docoded: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_TOKEN_SECRET as string
      ) as { user: IUser; activationCode: string };

      if (docoded.activationCode !== activation_code) {
        return next(new ErrorHandler("Invalid activation code", 400));
      }

      const { name, email, password } = docoded.user;

      const userCheck = await User.findOne({ email });
      if (userCheck) {
        return next(
          new ErrorHandler("User already exists with this email", 400)
        );
      }

      // create hash password
      const solt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, solt);

      const user = await User.create({
        name,
        email,
        password: hashPassword,
      });

      res.status(201).json({
        success: true,
      });
    } catch (error) {
      next(new ErrorHandler(error.message, 400));
    }
  }
);

// user login
interface ILoginRequest {
  email: string;
  password: string;
}

export const loginUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;
      if (!email || !password) {
        return next(new ErrorHandler("Email and Password is requried", 400));
      }

      // check user
      const userCheck = await User.findOne({ email }).select("+password");
      if (!userCheck) {
        return next(new ErrorHandler("No user found by this email", 404));
      }

      const isPassword = await bcrypt.compare(password, userCheck.password);
      if (!isPassword) {
        return next(new ErrorHandler("Wrong password", 401));
      }

      sendToken(userCheck, 200, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// logout user
export const logout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");

      // delete user from redis
      const userId = req?.user._id || "";
      redis.del(userId);
      console.log(req.user._id);

      res.status(200).json({
        success: true,
        message: "Logout successfull",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// role base permission
export const authorizedRoles = (...role: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!role.includes(req.user?.role || "")) {
      return next(
        new ErrorHandler(
          `Role: ${req.user?.role} is not allowed to access this resources`,
          403
        )
      );
    }
  };
};

// update access token using refresh token
export const updateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get refresh token from cookie
      const refresh_token = req.cookies.refresh_token as string;
      
      if (!refresh_token) {
        return next(
          new ErrorHandler("Refresh token not found", 404)
        );
      }
      const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_KEY as string) as JwtPayload
      if (!decoded) {
        return next(
          new ErrorHandler("Refresh token not found", 404)
        );
      }
      const session = await redis.get(decoded.id as string)
      if (!session) {
        return next(
          new ErrorHandler("Invalid Token. Please login", 404)
        );
      }

      const user = JSON.parse(session)

      // create Token
      const accessToken = jwt.sign({id: user._id}, process.env.ACCESS_TOKEN_KEY, {
        expiresIn: "10m"
      })
      const refreshToken = jwt.sign({id: user._id}, process.env.REFRESH_TOKEN_KEY, {
        expiresIn: "3d"
      })

      // set token to cookie
      res.cookie("access_token", accessToken, accessTokenOptions )
      res.cookie("refresh_token", refreshToken, refreshTokenOptions )
      
      res.status(200).json({
        success: true,
        user, 
        accessToken
      })

    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
