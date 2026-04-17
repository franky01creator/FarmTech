import "../env.js";
import mongoose from "mongoose";
import { ServerApiVersion } from "mongodb";

export async function connectDB() {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        console.error("DB not Connected: MONGO_URI is not set");
        process.exit(1);
    }

    try {
        await mongoose.connect(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        });

        await mongoose.connection.db.admin().command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (error) {
        console.error("DB not Connected", error);
        process.exit(1);
    }
}
