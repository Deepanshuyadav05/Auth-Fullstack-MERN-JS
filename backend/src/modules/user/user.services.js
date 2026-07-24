import { User } from "../auth/auth.model.js"
import ApiError from "../../common/utils/apiError.js"


//getMe service
const getMe = async (userId) => {
    //Although we already have extracted the user in the authenticate middleware but
    //Just to keep it safe, if we had forgotten to mark the option select false for some sensitive field
    //We call the user again and select the field we want by ourselves.
    const user = await User.findById(userId)
    .select("name email isEmailVerified createdAt") //Here we only get these three fields that we have selected because we have not used the '+' symbol inside the select.

    if(!user) throw ApiError.notFound("user not found")

    return user
}




export { getMe }