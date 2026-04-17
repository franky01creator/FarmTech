import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        productName: {
            type: String,
            required: true
        },
        unit: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        lineTotal: {
            type: Number,
            required: true
        }
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        buyer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        sellerRole: {
            type: String,
            enum: ["farmer", "supplier"],
            required: true
        },
        items: {
            type: [orderItemSchema],
            required: true
        },
        subtotal: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
            default: "pending"
        },
        deliveryDetails: {
            customerName: String,
            customerPhone: String,
            deliveryAddress: String,
            paymentMethod: String,
            organization: String,
            contact: String,
            notes: String
        }
    },
    { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
