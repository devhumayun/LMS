import { PORT, app } from "./app";
import { ConnectDB } from "./config/db";

// server listener
app.listen(PORT, () => {
    console.log(`Server is runing on Port: ${PORT}`);
    ConnectDB()
})

