require("dotenv").config()
import { NextFunction, Request } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { CatchAsyncError } from './catchAsyncError'
import ErrorHandler from '../utils/ErrorHandler'
import { redis } from '../config/redis'

//  Is user authenticated
export const isAuthenticated = CatchAsyncError( async (req:Request, res:Response, next:NextFunction) => {
    const access_token = req.cookies.access_token
    if(!access_token){
        next( new ErrorHandler("Please login to access this resource", 400))
    }

    // verify token
    const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN_KEY as string) as JwtPayload
    if(!decoded){
        next( new ErrorHandler("Invalid Token", 400))
    }
    
    const user = await redis.get(decoded.id)
    if(!user){
        next( new ErrorHandler("User no found", 400))
    }

    req.user = JSON.parse(user)

    next()
})

// role base permission
// export const authorizedRoles = (...role: string[]) => {
//     return (req: Request, res: Response, next: NextFunction) => {
//       if (!role.includes(req.user?.role || "")) {
//         return next(
//           new ErrorHandler(
//             `Role: ${req.user?.role} is not allowed to access this resources`,
//             403
//           )
//         );
//       }
//     };
// };

// validate user role
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || "")) {
      return next(
        new ErrorHandler(
          `Role: ${req.user?.role} is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};


  