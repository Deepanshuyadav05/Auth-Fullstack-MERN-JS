import * as userService from './user.services.js';
import asyncHandler from '../../common/utils/asyncHandler.js';
import ApiResponse from '../../common/utils/apiResponse.js';

//getMe controller
const getMe = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const user = await userService.getMe(userId);
    ApiResponse.ok(res, "User retrieved successfully", { user });
})




export { getMe }