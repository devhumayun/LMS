import mongoose, {Document, Model, Schema} from "mongoose";
import bcrypt from 'bcryptjs'

const emailRegexPattern: RegExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    avater : {
        public_id: string,
        url: string
    };
    role: string;
    isVerified: boolean;
    courses: Array<{courseId: string}>;
    comparePassword: ( password: string) => Promise<boolean>;
}

const userSchema: Schema<IUser> = new Schema({
    name: {
        type: String,
        required: [true, "Name is required"]
    },
    email: {
        type: String, 
        unique: true,
        required: [true, "Email is requried"],
        validate: {
            validator : function(value:string)  {
                return emailRegexPattern.test(value)
            },
            message: "please inter a valid email"
        }
    },
    password: {
        type: String,
        required: [true, "Password is requried"],
        set: (v:string) => bcrypt.hashSync(v, bcrypt.genSaltSync(10)),
        minlength: [6, "Password must be at least 6 characters long"],
        select: false
    },
    avater: {
        public_id: String,
        url: String
    },
    role: {
        type: String,
        default: "user"
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    courses: [
        {
            courseId: String
        }
    ]
}, {timestamps: true})


const userModel: Model<IUser> = mongoose.model("User", userSchema)

export default userModel