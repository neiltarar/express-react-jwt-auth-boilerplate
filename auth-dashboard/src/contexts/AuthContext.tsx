import { createContext, useContext, useState } from "react";
import axios from "axios";

// @ts-ignore
const AuthContext = createContext();

export const useAuth = () => {
	return useContext(AuthContext);
};

// @ts-ignore
export const AuthProvider = ({ children }) => {
	const [currentUser, setCurrentUser] = useState(() => {
		const storedUser = localStorage.getItem("currentUser");
		return storedUser ? JSON.parse(storedUser) : null;
	});
	const [loading, setLoading] = useState(() => {
		const storedLoadingState = localStorage.getItem("loading");
		return storedLoadingState ? JSON.parse(storedLoadingState) : false;
	});

	// @ts-ignore
	const signup = async (values) => {
		console.log("values: ", values);
		try {
			const response = await axios.post(`/users/signup`, values, {
				withCredentials: true,
			});
			return response;
		} catch (error) {
			console.log(error);
			return null;
		}
	};

	// @ts-ignore
	const signin = async (values) => {
		try {
			const response = await axios.post(`/sessions/signin`, values, {
				withCredentials: true,
			});
			if (response.status === 200) {
				setCurrentUser({
					user: { name: response.data.user.name, id: response.data.user.id },
				});
				setLoading(true);
				localStorage.setItem(
					"currentUser",
					JSON.stringify({ user: response.data.user })
				);
				localStorage.setItem("loading", JSON.stringify(true));
			}
			return response;
		} catch (error) {
			localStorage.removeItem("currentUser");
			localStorage.setItem("loading", JSON.stringify(false));
			setLoading(false);
			setCurrentUser(null);
			//@ts-ignore
			console.log(error);
			return error;
		}
	};

	const signout = async () => {
		try {
			const response = await axios.post(
				`/sessions/signout`,
				{}, // empy post req body, this is needed for the credentials to be read.
				{
					withCredentials: true,
				}
			);
			localStorage.removeItem("currentUser");
			localStorage.setItem("loading", JSON.stringify(false));
			setLoading(false);
			setCurrentUser(null);
			return response;
		} catch (error) {
			console.log(error);
			return null;
		}
	};

	const value = {
		currentUser,
		signup,
		signin,
		signout,
		loading,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
