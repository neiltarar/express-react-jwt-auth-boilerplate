import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { findRefreshToken } from "../models/sessionModel";
import { Request, Response, NextFunction } from "express";
import { verifyJWTToken } from "./validateTokens";

dotenv.config();

export const authenticateToken = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { accessToken, refreshToken } = req.cookies;

	if (!accessToken || !refreshToken) {
		// If there's no token, return 401 (Unauthorised)
		return res.status(401).json({ error: "Unauthorised" });
	}

	try {
		const user = await verifyJWTToken(
			accessToken,
			process.env.ACCESS_TOKEN_SECRET_KEY!
		);
		//@ts-ignore
		req.user = user;
		next();
	} catch (err) {
		if (err instanceof jwt.TokenExpiredError) {
			const storedRefreshToken = await findRefreshToken(refreshToken);
			if (!storedRefreshToken) return res.sendStatus(403);

			try {
				const user = await verifyJWTToken(
					refreshToken,
					process.env.REFRESH_TOKEN_SECRET_KEY!
				);

				const newAccessToken = jwt.sign(
					{
						userId: user.id,
						name: user.first_name,
					},
					process.env.ACCESS_TOKEN_SECRET_KEY!,
					{ expiresIn: "10m" }
				);

				res.cookie("accessToken", newAccessToken, {
					httpOnly: true,
					secure: true,
				});
				//@ts-ignore
				req.user = user;
				next();
			} catch (err) {
				console.error("Refresh token verification error:", err);
				return res
					.status(403)
					.json({ message: "Session expired, please log in again" });
			}
		} else {
			console.error("Access token verification error:", err);
			return res.status(403).redirect("/");
		}
	}
};
