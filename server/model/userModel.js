import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    um_firstName: {
        type: String,
        required: true
    },
    um_lastName: {
        type: String,
        required: true
    },
    um_userType: {
        type: String,
        required: true
    },
    um_username: {
        type: String,
        required: true,
        unique: true
    },
    um_userPassword: {
        type: String,
        required: true
    }
})

export default mongoose.model("Users", userSchema)
