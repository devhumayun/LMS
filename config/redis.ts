import {Redis} from 'ioredis'
import { redisURL } from '../app'

const redisClient = () => {
    if(!redisURL){
        throw new Error("Redis connection failed")
    }

    return redisURL
}

export const redis = new Redis(redisClient())