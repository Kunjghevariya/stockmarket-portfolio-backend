import { User } from '../model/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const generateTokens = async (user) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

export const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;
  if ([fullname, email, username, password].some(f => !f)) throw new ApiError(400, 'All fields are required');

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) throw new ApiError(409, 'User already exists');

  const user = await User.create({ fullName: fullname, email, username, password });
  const createdUser = await User.findById(user._id).select('-password -refreshToken');
  return res.status(201).json(new ApiResponse(201, createdUser, 'User registered successfully'));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) throw new ApiError(400, 'Username and password required');

  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) throw new ApiError(404, 'User not registered');

  const valid = await user.isPasswordCorrect(password);
  if (!valid) throw new ApiError(401, 'Invalid credentials');

  const tokens = await generateTokens(user);
  const loggedUser = await User.findById(user._id).select('-password -refreshToken');

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  return res
    .cookie('accessToken', tokens.accessToken, cookieOptions)
    .cookie('refreshToken', tokens.refreshToken, cookieOptions)
    .status(200)
    .json(new ApiResponse(200, { user: loggedUser, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }, 'User logged in successfully'));
});

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: '' } });
  const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' };
  return res.clearCookie('accessToken', cookieOptions).clearCookie('refreshToken', cookieOptions).status(200).json(new ApiResponse(200, {}, 'User logged out'));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefresh = req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefresh) throw new ApiError(401, 'Unauthorized request');

  // verify and rotate
  // note: keep consistent with user.refreshToken
  const decoded = jwt.verify(incomingRefresh, process.env.REFRESH_TOKEN_SECRET);
  const user = await User.findById(decoded._id);
  if (!user || user.refreshToken !== incomingRefresh) throw new ApiError(401, 'Invalid refresh token');

  const tokens = await generateTokens(user);
  const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' };
  return res.cookie('accessToken', tokens.accessToken, cookieOptions).cookie('refreshToken', tokens.refreshToken, cookieOptions).status(200).json(new ApiResponse(200, { accessToken: tokens.accessToken }, 'Access token refreshed'));
});
