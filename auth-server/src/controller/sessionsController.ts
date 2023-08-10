import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { user as userModels } from "../models/userModel";
import {
	saveRefreshToken,
	deleteRefreshToken,
	deleteRefreshTokenForUser,
} from "../models/sessionModel";

export const signin = async (req: Request, res: Response) => {
	const { email, password } = req.body;
	let user;

	try {
		user = await userModels.findUserByEmail(email);
	} catch (err) {
		console.error("Error fetching user:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}

	// Check if user exists
	if (!user) {
		return res.status(400).json({ message: "Unauthorized" });
	}

	// Check if user is activated by the admin
	if (!user.is_activated) {
		const passwordValid = await bcrypt.compare(
			password,
			(user as any).password_hash
		);
		if (passwordValid) {
			return res
				.status(400)
				.json({ message: "User is not activated by the admin" });
		} else {
			return res.status(400).json({ message: "Unauthorized" });
		}
	}

	// Password validation
	try {
		const isPasswordValid = await bcrypt.compare(
			password,
			(user as any).password_hash
		);
		if (!isPasswordValid) {
			return res.status(400).json({ message: "Unauthorized" });
		}
	} catch (err) {
		console.error("Error during password comparison:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}

	// Create JWT tokens
	const payload = {
		userId: user.id,
		email: user.email,
	};

	const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET_KEY!, {
		expiresIn: "10m",
	});

	const refreshToken = jwt.sign(
		payload,
		process.env.REFRESH_TOKEN_SECRET_KEY!,
		{
			expiresIn: "48h",
		}
	);

	// Refresh token management
	try {
		await deleteRefreshTokenForUser(user.id);
		const result = await saveRefreshToken(user.id, refreshToken);
		if (!result) {
			throw new Error("Failed to save refresh token");
		}
	} catch (err) {
		console.error("Error managing refresh tokens:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}

	// Set cookies and respond
	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: false, // Consider setting this to true if using HTTPS
	});
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: false, // Consider setting this to true if using HTTPS
	});

	res.status(200).json({
		message: "Successful Login",
		user: {
			name: (user as any).first_name,
			id: user.id,
		},
	});
};

export const signout = async (req: Request, res: Response) => {
	const refreshToken = req.cookies.refreshToken;

	// If there's a refresh token, delete it from the database
	if (refreshToken) {
		try {
			await deleteRefreshToken(refreshToken);
		} catch (error) {
			console.error("Failed to delete refresh token:", error);
			return res.sendStatus(500);
		}
	}

	// Clear the access token and refresh token cookies
	res.clearCookie("accessToken");
	res.clearCookie("refreshToken");
	res.status(200).json({ message: "Successfully logged out" });
};
