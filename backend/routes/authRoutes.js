import express from 'express';
import authController from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import {
	validateEmail,
	validateLogin,
	validateRegistration,
	validateOtp,
	validateOtpRegistration,
	validateResetPassword,
} from '../middleware/validation.middleware.js';

const router = express.Router();

// OTP
router.post('/send-otp', validateEmail, authController.sendOtp);
router.post('/verify-otp', validateOtpRegistration, authController.verifyOtpAndRegister);

// Standard auth
router.post('/register', validateRegistration, authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', validateEmail, authController.resendVerification);
router.post('/login', validateLogin, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Password reset
router.post('/forgot-password', validateEmail, authController.forgotPassword);
router.post('/reset-password', validateResetPassword, authController.resetPassword);

// Protected
router.get('/profile', authMiddleware, async (req, res) => {
	try {
		const user = await (await import('../models/User.js')).default.findById(req.user.user_id).select('-password_hash');
		res.json({ user });
	} catch (err) {
		res.status(500).json({ error: 'Failed to load profile' });
	}
});

router.get('/activity', authMiddleware, authController.getActivity);
router.get('/sessions', authMiddleware, authController.getSessions);
router.post('/revoke-session', authMiddleware, authController.revokeSession);

export default router;
