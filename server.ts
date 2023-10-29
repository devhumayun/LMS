require("dotenv").config()
import { PORT, app } from "./app";
import { ConnectDB } from "./config/db";
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    secret_key: process.env.CLOUDE_SECRET_KEY
})

// server listener
app.listen(PORT, () => {
    console.log(`Server is runing on Port: ${PORT}`);
    ConnectDB()
})


