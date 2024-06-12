import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import bcrypt from "bcryptjs";
import { sendVerification } from "@/helpers/sendVerificationEmail";

export async function POST(request: Request) {
	await dbConnect();

	try {
		const { username, email, password } = await request.json();
		const existingUserVerifiedByUsername = await UserModel.findOne({
			username,
			isVerified: true,
		});

		if (existingUserVerifiedByUsername) {
			return Response.json(
				{
					success: false,
					message: "Username is already taken",
				},
				{ status: 400 }
			);
		}

    const existingUserByEmail = await UserModel.findOne({ email });
    
    const verifyCode = "93u4rowjrr902w3"

    if (existingUserByEmail) {
      if (existingUserByEmail.isVerified) {
        return Response.json({
          success: false,
          message:"User already exist with this email"
        },{ status:400})
      }
      else {
        const hashedPassword = await bcrypt.hash(password, 10)
        existingUserByEmail.password = hashedPassword
        existingUserByEmail.verifyCode = verifyCode;
        existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 360000)
        await existingUserByEmail.save()
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
        expiryDate,
        isVerified: false,
        isAcceptingMessage: true,
        messages:[]

      });
      
      await newUser.save()
		}

    const emailResponse  = await sendVerification(
      email,
      username,
      verifyCode
    )

    if (!emailResponse.success) {
      return Response.json({
        success: false,
        message: "Username is already taken"
      },{status: 500})
    }

    return Response.json({
      success: true,
      message:"User registered successfully. Please verify your email"
    },{status: 201})

	} catch (error) {
		console.error("Error registering user", error);
		return Response.json({
			success: false,
			message: "Error registering user",
		});
	}
}
