import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";

export async function POST(request: Request) {
	await dbConnect();

	try {
		const { username, code } = await request.json();

    // decodedURIComponent is used to decode the value from the url eg " "(space) become %20
    const decodedUsername = decodeURIComponent(username)

    const user = await UserModel.findOne({username:decodedUsername})
    if (!user) {
      return Response.json(
        {
          success: false,
          message: "User not found"
        },
        {status: 500}
      )
    }

    const isCodeValid = user.verifyCode === code
    const isCodeNotExpired = new Date(user.verifyCodeExpiry)> new Date()

    if (isCodeValid && isCodeNotExpired) {
      user.isVerified = true
      await user.save();
      return Response.json(
        {
          success: true,
          message:"Account verified successfully"
        },
        {status :200}
      )
    } else if (!isCodeNotExpired) {
			return Response.json(
				{
					success: false,
					message: "Verification code has expired, please signup again to get a new code",
				},
				{ status: 400 }
			);
    }
    else {
			return Response.json(
				{
					success: false,
					message:
						"Incorret verification code",
				},
				{ status: 400 }
			);
      
    }

	} catch (error) {
		console.error("Error checking username", error);
		return Response.json(
			{
				success: false,
				message: "Error checking username",
			},
			{ status: 500 }
		);
	}
}
