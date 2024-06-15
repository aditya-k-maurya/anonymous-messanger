"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { signUpSchema } from "@/schemas/signUpSchema";
import axios, { AxiosError } from "axios";
import { ApiResponse } from "@/types/ApiResponse";

const page = () => {
	const [username, setUsername] = useState("");
	const [usernameMessage, setUsernameMessage] = useState("");
	const [isCheckingUsername, setIsCheckingUsername] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const debouncedUsername = useDebounceValue(username, 300);
	const { toast } = useToast();
	const router = useRouter();

	//zod implementation
	const form = useForm({
		resolver: zodResolver(signUpSchema),
		defaultValues: {
			username: "",
			email: "",
			password: "",
		},
	});

	useEffect(() => {
		const checkUsernameUnique = async () => {
			if (debouncedUsername) {
				setIsCheckingUsername(true);
				setUsernameMessage("");
				try {
					const response = await axios.get(
						`/api/check-username-unique?usernme=${debouncedUsername}`
					);
					setUsername(response.data.message);
				} catch (error) {
					const axiosError = error as AxiosError<ApiResponse>;
					setUsernameMessage(
						axiosError.response?.data.message ?? "Error chicking username"
					);
				} finally {
					setIsCheckingUsername(false);
				}
			}
		};
		checkUsernameUnique();
	}, [debouncedUsername]);

	const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
		try {
			const response = await axios.post<ApiResponse>("/api/sign-up", data);
			toast({
				title: "Success",
				description: response.data.message,
			});

			router.replace(`/verify/${username}`);
			setIsSubmitting(false);
		} catch (error) {
			console.error("Error in signup of user ", error);
			const axiosError = error as AxiosError<ApiResponse>;
			let errorMessage = axiosError.response?.data.message;

			toast({
				title: "signup failed",
				description: errorMessage,
				variant: "destructive",
			});
			setIsSubmitting(false);
		}
	};

	return <div>page</div>;
};

export default page;
