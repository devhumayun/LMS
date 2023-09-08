import mongoose from "mongoose";
import { mongoURL } from "../app";


export const ConnectDB = async () => {
    try {
        await mongoose.connect(mongoURL).then((data:any) => {
            console.log(`Database connected with ${data.connection.host} successfull`);
        })
    } catch (error) {
        console.log(error.message);
        
    }
}