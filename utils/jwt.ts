require("dotenv").config();
import { IUser } from "../models/user.model";
import { Response } from "express";
import {redis} from "../config/redis";
interface ITokenOptions {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  samaSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}
export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();

  // fallback values
  const accessTokenExpire = parseInt(
    process.env.ACCESS_TOKEN_EXPEIR || "300",
    10
  );
  const refreshTokenExpire = parseInt(
    process.env.REFRESH_TOKEN_EXPEIR || "1200",
    10
  );

  // upload session to redis
  redis.set(user._id, JSON.stringify(user) as any);
  // cookie options
  const accessTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire * 1000),
    maxAge: accessTokenExpire * 1000,
    httpOnly: true,
    samaSite: "lax",
  };
  const refreshTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire * 1000),
    maxAge: accessTokenExpire * 1000,
    httpOnly: true,
    samaSite: "lax",
  };

  // only the secure true in porduction
  if (process.env.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
  }

  // send token to cookie
  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", accessToken, refreshTokenOptions);

  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};
