import  jwt  from 'jsonwebtoken';
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


  // fallback values
  const accessTokenExpire = parseInt(
    process.env.ACCESS_TOKEN_EXPEIR || "300",
    10
  );
  const refreshTokenExpire = parseInt(
    process.env.REFRESH_TOKEN_EXPEIR || "1200",
    10
  );


  // cookie options
  export const accessTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
    maxAge: accessTokenExpire * 60 * 60 * 1000,
    httpOnly: true,
    samaSite: "lax",
  };
  export const refreshTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire * 24 * 60 * 60 * 1000),
    maxAge: accessTokenExpire * 24 * 60 * 60 * 1000,
    httpOnly: true,
    samaSite: "lax",
  };

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();

  // upload session to redis
  redis.set(user._id, JSON.stringify(user) as any);

  // only the secure true in porduction
  if (process.env.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
  }

  // const accessToken = jwt.sign({id: user._id}, process.env.ACCESS_TOKEN_KEY, {
  //   expiresIn: "10m"
  // })
  // const refreshToken = jwt.sign({id: user._id}, process.env.REFRESH_TOKEN_KEY, {
  //   expiresIn: "3d"
  // })

  // send token to cookie
  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);

  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};
