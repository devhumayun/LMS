import { app } from "./app";
import dotenv from 'dotenv'
dotenv.config()
const PORT = process.env.SERVER_PORT





// server listener
app.listen(PORT, () => {
    console.log(`Server is runing on Port: ${PORT}`);
})