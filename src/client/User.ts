import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    displayName: String,
    googleId: String,
    email: String,
    photo: String,
    stats: Array,
    chessUsername: String,

    subscription: {
        status: {type: String, default: 'free'},
        stripeCustomerId: {type: String, default: null},
        stripeSubscriptionId: {type: String, default: null},
        currentPeriodEnd: {type: Date, default: null}
    },

    gameStats: {
        positionsPracticed: {type: Number, default: 11},
        nextAvaliable: {type: Date || null, default: null}
    }
});

export default mongoose.model('User', userSchema)