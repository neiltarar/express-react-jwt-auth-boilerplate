import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Layout from "../Layout";
import LogoutButton from "../Auth/LogoutButton";
import { useAuth } from "../../contexts/AuthContext";
import { Box } from "@mui/material";

const API_URL =
	process.env.NODE_ENV === "production"
		? process.env.REACT_APP_API_URL_DEPLOY
		: process.env.REACT_APP_API_URL_DEV;

interface Props {
	currentUser: { user: { name: string; id: number } };
}

const Home: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	// @ts-ignore
	const { currentUser } = useAuth();

	useEffect(() => {
		if (!currentUser) {
			navigate("/signin");
		}
	}, [currentUser, navigate]);

	return (
		<Layout>
			<LogoutButton />
			<Box
				display='flex'
				flexDirection='column'
				alignItems='center'
				justifyContent='center'
				height='100vh'
				textAlign='center'
			>
				<h1>Welcome Home, {currentUser && currentUser.user.name}!</h1>
				<p>
					Feel free to implement this authoentication strategy to your app and
					your needs. You can log out at any time by clicking the logout button.
				</p>
			</Box>
		</Layout>
	);
};

export default Home;
