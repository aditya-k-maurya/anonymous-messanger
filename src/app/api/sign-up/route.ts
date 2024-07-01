import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import bcrypt from "bcryptjs";
import { sendVerification } from "@/helpers/sendVerificationEmail";
import { NextResponse } from "next/server";

// Define the structure of the request payload
interface RequestPayload {
	username: string;
	email: string;
	password: string;
}

export async function POST(request: Request) {
	await dbConnect();

	try {
		const { username, email, password }: RequestPayload = await request.json();

		// Check if a verified user with the same username already exists
		const existingUserVerifiedByUsername = await UserModel.findOne({
			username,
			isVerified: true,
		});

		if (existingUserVerifiedByUsername) {
			return NextResponse.json(
				{
					success: false,
					message: "Username is already taken",
				},
				{ status: 400 }
			);
		}

		// Check if a user with the same email already exists
		const existingUserByEmail = await UserModel.findOne({ email });

		// Verification code generation
		const verifyCode = "93u4rowjrr902w3"; // Ideally, generate a secure random code

		if (existingUserByEmail) {
			if (existingUserByEmail.isVerified) {
				return NextResponse.json(
					{
						success: false,
						message: "User already exists with this email",
					},
					{ status: 400 }
				);
			} else {
				const hashedPassword = await bcrypt.hash(password, 10);
				existingUserByEmail.password = hashedPassword;
				existingUserByEmail.verifyCode = verifyCode;
				existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000); // 1 hour expiry
				await existingUserByEmail.save();
			}
		} else {
			const hashedPassword = await bcrypt.hash(password, 10);
			const expiryDate = new Date();
			expiryDate.setHours(expiryDate.getHours() + 1);

			const newUser = new UserModel({
				username,
				email,
				password: hashedPassword,
				verifyCode,
				verifyCodeExpiry: expiryDate,
				isVerified: false,
				isAcceptingMessages: true,
				messages: [],
			});

			await newUser.save();
		}

		const emailResponse = await sendVerification(email, username, verifyCode);

		if (!emailResponse.success) {
			return NextResponse.json(
				{
					success: false,
					message: "Failed to send verification email",
				},
				{ status: 500 }
			);
		}

		return NextResponse.json(
			{
				success: true,
				message: "User registered successfully. Please verify your email.",
			},
			{ status: 201 }
		);
	} catch (error: any) {
		console.error("Error registering user", error);
		return NextResponse.json(
			{
				success: false,
				message: "Error registering user",
			},
			{ status: 500 }
		);
	}
}
