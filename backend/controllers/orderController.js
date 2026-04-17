import mongoose from "mongoose";
import Order from "../models/order.js";
import Product from "../models/product.js";

const ALLOWED_STATUS = new Set(["pending", "confirmed", "shipped", "delivered", "cancelled"]);

export const createOrders = async (req, res) => {
    const buyerId = req.user?._id;
    const { items, deliveryDetails } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Order items are required." });
    }

    const normalizedItems = [];
    for (const item of items) {
        const productId = item?.productId || item?._id;
        const quantity = Number(item?.quantity ?? item?.cartQuantity ?? 0);
        if (!productId || !mongoose.Types.ObjectId.isValid(productId) || !Number.isFinite(quantity) || quantity <= 0) {
            return res.status(400).json({ message: "Invalid item payload." });
        }
        normalizedItems.push({ productId, quantity });
    }

    try {
        const productIds = [...new Set(normalizedItems.map((i) => i.productId.toString()))];
        const products = await Product.find({ _id: { $in: productIds } }).populate("farmer", "role fullName");
        const productMap = new Map(products.map((p) => [p._id.toString(), p]));

        const groupedBySeller = new Map();

        for (const line of normalizedItems) {
            const product = productMap.get(line.productId.toString());
            if (!product) {
                return res.status(404).json({ message: "One or more products no longer exist." });
            }

            if (product.quantity < line.quantity) {
                return res.status(400).json({ message: `Not enough stock for ${product.productName}.` });
            }

            const sellerId = product.farmer?._id?.toString() || product.farmer?.toString();
            const sellerRole = product.farmer?.role === "supplier" ? "supplier" : "farmer";

            if (!sellerId) {
                return res.status(400).json({ message: "Product has no seller information." });
            }

            if (!groupedBySeller.has(sellerId)) {
                groupedBySeller.set(sellerId, {
                    seller: sellerId,
                    sellerRole,
                    items: [],
                    subtotal: 0
                });
            }

            const bucket = groupedBySeller.get(sellerId);
            const price = Number(product.price) || 0;
            const lineTotal = price * line.quantity;

            bucket.items.push({
                product: product._id,
                productName: product.productName,
                unit: product.unit,
                price,
                quantity: line.quantity,
                lineTotal
            });
            bucket.subtotal += lineTotal;
        }

        const createdOrders = [];
        for (const grouped of groupedBySeller.values()) {
            const order = await Order.create({
                buyer: buyerId,
                seller: grouped.seller,
                sellerRole: grouped.sellerRole,
                items: grouped.items,
                subtotal: grouped.subtotal,
                deliveryDetails: deliveryDetails || {}
            });
            createdOrders.push(order);
        }

        // Reduce stock only after orders are created
        for (const line of normalizedItems) {
            await Product.findByIdAndUpdate(line.productId, { $inc: { quantity: -line.quantity } });
        }

        return res.status(201).json({
            message: "Order placed successfully.",
            orders: createdOrders
        });
    } catch (error) {
        console.error("Error creating order:", error);
        return res.status(500).json({ message: "Server error creating order." });
    }
};

export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ buyer: req.user._id })
            .populate("seller", "fullName role email")
            .sort({ createdAt: -1 });
        return res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching my orders:", error);
        return res.status(500).json({ message: "Server error fetching orders." });
    }
};

export const getIncomingOrders = async (req, res) => {
    try {
        const orders = await Order.find({ seller: req.user._id })
            .populate("buyer", "fullName role email")
            .sort({ createdAt: -1 });
        return res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching incoming orders:", error);
        return res.status(500).json({ message: "Server error fetching incoming orders." });
    }
};

export const updateOrderStatus = async (req, res) => {
    const { status } = req.body || {};
    if (!ALLOWED_STATUS.has(status)) {
        return res.status(400).json({ message: "Invalid order status." });
    }

    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        if (order.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this order." });
        }

        order.status = status;
        await order.save();
        return res.status(200).json(order);
    } catch (error) {
        console.error("Error updating order status:", error);
        return res.status(500).json({ message: "Server error updating order status." });
    }
};
