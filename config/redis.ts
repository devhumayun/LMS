require("dotenv").config()
import {Redis} from 'ioredis'

const redisClient = () => {
    if(!process.env.REDIS_URL){
        throw new Error("Redis connection failed")
    }
    return process.env.REDIS_URL
}

export const redis = new Redis(redisClient())