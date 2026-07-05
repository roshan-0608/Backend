import mongoose , { Schema } from 'mongoose';

const subscriptionSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "user",
            required: [true, "User ID is required"]
        },
        channel: { 
            type: Schema.Types.ObjectId,
            ref: "user",
        }
    },
    {
        timestamps: true
    }
);

export const subscription = mongoose.model("Subscription", subscriptionSchema);