import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    displayName: String,
    googleId: String,
    email: String,
    photo: String,
    games: Array,
    stats: Array,
    chessUsername: String,
});

export default mongoose.model('User', userSchema)