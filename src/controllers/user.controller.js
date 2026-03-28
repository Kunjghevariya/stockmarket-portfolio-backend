import jwt from 'jsonwebtoken';
import { User } from '../model/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { buildDemoCredentials, seedDemoData } from '../services/demoAccount.js';

const generateTokens = async (user) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

const sanitizeUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  fullName: user.fullName,
  isDemo: Boolean(user.isDemo),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const registerUser = asyncHandler(async (req, res) => {
  const fullname = String(req.body.fullname || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const username = String(req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if ([fullname, email, username, password].some(f => !f)) throw new ApiError(400, 'All fields are required');

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) throw new ApiError(409, 'User already exists');

  const user = await User.create({ fullName: fullname, email, username, password });
  const createdUser = await User.findById(user._id).select('-password -refreshToken');
  return res.status(201).json(new ApiResponse(201, sanitizeUser(createdUser), 'User registered successfully'));
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

  return res
    .cookie('accessToken', tokens.accessToken, cookieOptions)
    .cookie('refreshToken', tokens.refreshToken, cookieOptions)
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          user: sanitizeUser(loggedUser),
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
        'User logged in successfully'
      )
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  return res
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .status(200)
    .json(new ApiResponse(200, {}, 'User logged out'));
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
  return res
    .cookie('accessToken', tokens.accessToken, cookieOptions)
    .cookie('refreshToken', tokens.refreshToken, cookieOptions)
    .status(200)
    .json(new ApiResponse(200, { accessToken: tokens.accessToken }, 'Access token refreshed'));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, sanitizeUser(req.user), 'Current user fetched successfully'));
});

export const loginDemoUser = asyncHandler(async (req, res) => {
  const credentials = buildDemoCredentials();
  const demoUser = await User.create({
    username: credentials.username,
    email: credentials.email,
    fullName: credentials.fullName,
    password: credentials.password,
    isDemo: true,
  });

  await seedDemoData(demoUser._id);
  const tokens = await generateTokens(demoUser);
  const loggedUser = await User.findById(demoUser._id).select('-password -refreshToken');

  return res
    .cookie('accessToken', tokens.accessToken, cookieOptions)
    .cookie('refreshToken', tokens.refreshToken, cookieOptions)
    .status(201)
    .json(
      new ApiResponse(
        201,
        {
          user: sanitizeUser(loggedUser),
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          demoCredentials: {
            username: credentials.username,
            password: credentials.password,
          },
        },
        'Demo account created successfully'
      )
    );
});
