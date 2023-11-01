import {
  getAllUsersServices,
  updateUserRoleServices,
} from "./../services/userServices";
import bcrypt from "bcryptjs";
import cloudinary from "cloudinary";
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
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt";
import { redis } from "../config/redis";
import { getUserById } from "../services/userServices";

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
        password
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

// update access token using refresh token
export const updateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get refresh token from cookie
      const refresh_token = req.cookies.refresh_token as string;

      if (!refresh_token) {
        return next(new ErrorHandler("Refresh token not found", 404));
      }
      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN_KEY as string
      ) as JwtPayload;
      if (!decoded) {
        return next(new ErrorHandler("Refresh token not found", 404));
      }
      const session = await redis.get(decoded.id as string);
      if (!session) {
        return next(new ErrorHandler("Your session has expired. Please login to access this resource", 404));
      }

      const user = JSON.parse(session);

      // create Token
      const accessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN_KEY,
        {
          expiresIn: "10m",
        }
      );
      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN_KEY,
        {
          expiresIn: "3d",
        }
      );

      req.user = user;

      // set token to cookie
      res.cookie("access_token", accessToken, accessTokenOptions);
      res.cookie("refresh_token", refreshToken, refreshTokenOptions);

      await redis.set(user._id, JSON.stringify(user), "EX", 604800);

      res.status(200).json({
        success: true,
        user,
        accessToken,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get user info
export const getUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      await getUserById(userId, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Social Login
interface ISocialLogin {
  email: string;
  name: string;
  avater: string;
}

export const socialLogin = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, avater } = req.body as ISocialLogin;

      const user = await User.findOne({ email });
      if (!user) {
        const newUser = await User.create({ name, email, avater });
        sendToken(newUser, 201, res);
      } else {
        sendToken(user, 201, res);
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update user info
interface IUserInfoUpdate {
  name: string;
  email: string;
}
export const updateUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email } = req.body as IUserInfoUpdate;
      const userId = req.user?._id;
      console.log(userId);

      const user = await User.findById(userId);

      if (name && user) {
        user.name = name;
      }

      user?.save();
      await redis.set(userId, JSON.stringify(user));

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update password
interface IUpdatePassword {
  oldPassword: string;
  newPassword: string;
}

export const updatepassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body as IUpdatePassword;

      const user = await User.findById(req.user?._id).select("+password");
      if (!oldPassword || !newPassword) {
        return next(new ErrorHandler("Please enter old and new password", 400));
      }

      if (user?.password === "undefined") {
        return next(new ErrorHandler("Invalid user", 400));
      }

      const isPasswordPatch = await bcrypt.compare(oldPassword, user.password);

      if (!isPasswordPatch) {
        return next(new ErrorHandler("Wrong old password", 400));
      }

      user.password = newPassword;

      await user.save();
      await redis.set(req.user?._id, JSON.stringify(user));

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// user profile update
interface IUserProfileUpdate {
  avater: string;
}

export const updateUserProfile = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avater } = req.body as IUserProfileUpdate;
      const userId = req.user?._id;

      const user = await User.findById(userId);

      if (avater && user) {
        if (user?.avater?.public_id) {
          cloudinary.v2.uploader.destroy(user?.avater?.public_id);
          const myCloud = await cloudinary.v2.uploader.upload(avater, {
            folder: "avaters",
            width: 150,
          });

          user.avater = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        } else {
          const myCloud = await cloudinary.v2.uploader.upload(avater, {
            folder: "avaters",
            width: 150,
          });

          user.avater = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        }
      }

      user?.save();
      await redis.set(userId, JSON.stringify(user));
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get all users only for admin
export const getAllusers = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllUsersServices(req, res, next);
    } catch (error) {
      next(new ErrorHandler(error.message, 500));
    }
  }
);

// update user role only for admin
export const updateUserRole = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, role } = req.body;

      if (!id || !role) {
        new ErrorHandler("Id and Role is requried", 400);
      }
      const user = await User.findByIdAndUpdate(id, { role }, { new: true });

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      next(new ErrorHandler(error.message, 500));
    }
  }
);

// delete user for admin
export const deleteUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const user = await User.findByIdAndDelete(id);

      if (!user) {
        next(new ErrorHandler("User Not found", 404));
      }

      await redis.del(id);

      res.status(200).json({
        success: true,
        message: "User deleted successfull",
      });
    } catch (error) {
      next(new ErrorHandler(error.message, 500));
    }
  }
);
