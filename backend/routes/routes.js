import express from "express";
import { registerUser, loginUser, getUserProfile, googleAuth, googleCallback } from "../controllers/authController.js";
import { createProduct, getMyListings, getAllProducts, getSupplierProducts, updateProduct, deleteProduct } from '../controllers/productController.js';
import { askKnowledgeAssistant } from "../controllers/knowledgeController.js";
import { createOrders, getMyOrders, getIncomingOrders, updateOrderStatus } from "../controllers/orderController.js";
import { protect } from '../middleware/authMiddleware.js';
import passport from "../config/passport.js";

const router = express.Router();
const hasValidGoogleOAuthConfig = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) return false;
    if (clientId.includes("your-client-id-here")) return false;
    if (clientSecret.includes("your-client-secret-here")) return false;

    return true;
};

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get('/profile', protect, getUserProfile);

// Google OAuth Routes (only if configured)
if (hasValidGoogleOAuthConfig()) {
    router.get("/auth/google", googleAuth, passport.authenticate('google', { scope: ['profile', 'email'] }));
    router.get("/auth/google/callback", passport.authenticate('google', { session: false }), googleCallback);
} else {
    // Fallback routes if Google OAuth is not configured
    router.get("/auth/google", (req, res) => {
        res.status(503).json({ message: "Google Sign-In is not configured. Please contact the administrator." });
    });
    router.get("/auth/google/callback", (req, res) => {
        res.status(503).json({ message: "Google Sign-In is not configured. Please contact the administrator." });
    });
}

router.post('/products', protect, createProduct);
router.get('/products/my-listings', protect, getMyListings);
router.get('/products', protect, getAllProducts);
router.get('/products/supplier', protect, getSupplierProducts);
router.put('/products/:id', protect, updateProduct);
router.delete('/products/:id', protect, deleteProduct);
router.post('/knowledge/assist', protect, askKnowledgeAssistant);
router.post('/orders', protect, createOrders);
router.get('/orders/my', protect, getMyOrders);
router.get('/orders/incoming', protect, getIncomingOrders);
router.patch('/orders/:id/status', protect, updateOrderStatus);


// router.get("/", (req,res) => { 
//     res.status(200).send("post created sucessfully");
// });





export default router;



