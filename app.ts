import express, { NextFunction, Request, Response } from 'express'
import userRoute from './routes/user.route'
import courseRoute from './routes/courseRoute'
import orderRoute from './routes/orderRoute'
import analyticRoute from './routes/analyticRouter'
import notificationRoute from './routes/notificationRoute'
import layoutRoute from './routes/layoutRoute'
export const app = express()
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import errorMiddleware from './middleware/errorMiddleware'

// environment variable
dotenv.config()
export const PORT = process.env.SERVER_PORT
export const mongoURL = process.env.MONGO_STRING
// export const redisURL = process.env.REDIS_URL
const ORGIN = process.env.ORGIN

// body cookie-parser
app.use(cookieParser())

// body parser
app.use(express.json({ limit: "50mb"}))

// cors setting => cors orgin resource sharing 
app.use(
    cors({
      origin: ["http://localhost:3000"],
      credentials: true,
    })
  );

// api routing
app.use("/api/v1", userRoute)
app.use("/api/v1", courseRoute)
app.use("/api/v1", orderRoute)
app.use("/api/v1", notificationRoute)
app.use("/api/v1", analyticRoute)
app.use("/api/v1", layoutRoute)

// testing api
app.get("test", (req:Request, res:Response, next:NextFunction) => {
    res.status(200).json({
        success: true,
        message: "Api is working"
    })
})

// unknown route
app.all("*", (req:Request, res:Response, next:NextFunction) => {
    const error = new Error(`Route ${req.originalUrl} not found`) as any;
    error.statusCode = 404
    next(error)
})

// global error
app.use(errorMiddleware)
