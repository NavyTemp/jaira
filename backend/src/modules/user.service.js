import fs from "fs";
import UserModel from "../models/user.model.js";
import OtpModel from "../models/otp.js";
import RevokedTokenModel from "../models/revokedtoken.model.js";
import { hashPassword, comparePassword, crypt_phone } from "../utlis/encrypt/encrypt.js";
import { userRole } from "../utlis/genral_emun.js";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import cloudinary from "../service/cloudinary.js";
import { emitter } from "../utlis/events/events.js";

const removeTempFile = (filePath) => {
  if (!filePath) return;
  fs.unlink(filePath, () => {});
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getSignature = (role) => {
  return role === userRole.admin
    ? process.env.SIGNATURE_ADMIN
    : process.env.SIGNATURE_USER;
};

const issueTokens = (user) => {
  const signature = getSignature(user.role);
  const access_token = jwt.sign(
    { userId: user._id, email: user.email, userrole: user.role },
    signature,
    { expiresIn: "1y", jwtid: nanoid() },
  );
  const refresh_token = jwt.sign(
    { userId: user._id, email: user.email, userrole: user.role },
    signature,
    { expiresIn: "7y", jwtid: nanoid() },
  );
  return { access_token, refresh_token };
};

// ─── AUTH ─────────────────────────────────────────────────

export const signup = async (req, res, next) => {
  try {
    const { name, email, password, phone, gender, age } = req.body;

    const exist_user = await UserModel.findOne({ email });
    if (exist_user) {
      return res.status(400).json({ message: "user already exists" });
    }

    const hash_password = await hashPassword({ password });
    const encryptedPhone = crypt_phone({ phone });

    const user = await UserModel.create({
      name,
      email,
      password: hash_password,
      phone: encryptedPhone,
      role: userRole.user,
      gender,
      age,
    });

    const otp = generateOtp();
    await OtpModel.create({
      email,
      otp,
      purpose: "VERIFY_EMAIL",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    emitter.emit("sendEmail", { email, code: otp, userName: name });

    return res.status(201).json({
      message: "signup successful, check your email for verification code",
      userId: user._id,
    });
  } catch (error) {
    return next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await OtpModel.findOne({
      email,
      purpose: "VERIFY_EMAIL",
      isUsed: false,
      
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ message: "no pending verification found" });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired, request a new one" });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(429).json({ message: "too many attempts, request a new OTP" });
    }

    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ message: "invalid OTP" });
    }

    otpRecord.isUsed = true;
    await otpRecord.save();

    await UserModel.findOneAndUpdate({ email }, { confirm: true, status: "active" });

    return res.status(200).json({ message: "email verified successfully" });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user || user.isDeleted) {
      return res.status(401).json({ message: "Invalid credentials beacuse user not found or deleted" });
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials please make sure your password is correct" });
    }

    if (!user.confirm) {
      return res.status(403).json({ message: "please verify your email first" });
    }

    const { access_token, refresh_token } = issueTokens(user);

    return res.status(200).json({
      message: "login success",
      access_token,
      refresh_token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    await RevokedTokenModel.create({
      tokenId: req.decoded.jti,
      expireAt: new Date(req.decoded.exp * 1000),
    });
    return res.status(200).json({ message: "logout success" });
  } catch (error) {
    return next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const user = req.user;

    await RevokedTokenModel.create({
      tokenId: req.decoded.jti,
      expireAt: new Date(req.decoded.exp * 1000),
    });

    const { access_token, refresh_token } = issueTokens(user);

    return res.status(200).json({
      message: "token refreshed",
      access_token,
      refresh_token,
    });
  } catch (error) {
    return next(error);
  }
};

// ─── FORGOT / RESET PASSWORD ────────────────────────────

export const forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await UserModel.findOne({ email, isDeleted: false });
    if (!user) {
      return res.status(200).json({ message: "if that email exists, a reset code was sent" });
    }

    const otp = generateOtp();
    await OtpModel.create({
      email,
      otp,
      purpose: "RESET_PASSWORD",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    emitter.emit("forgetPassword", { email, otp, userName: user.name });

    return res.status(200).json({ message: "if that email exists, a reset code was sent" });
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const otpRecord = await OtpModel.findOne({
      email,
      purpose: "RESET_PASSWORD",
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ message: "no pending reset found" });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired, request a new one" });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(429).json({ message: "too many attempts, request a new OTP" });
    }

    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ message: "invalid OTP" });
    }

    otpRecord.isUsed = true;
    await otpRecord.save();

    const hash_password = await hashPassword({ password: newPassword });
    await UserModel.findOneAndUpdate({ email }, { password: hash_password });

    return res.status(200).json({ message: "password reset successfully" });
  } catch (error) {
    return next(error);
  }
};

// ─── RESEND OTP ──────────────────────────────────────────

export const resendOtp = async (req, res, next) => {
  try {
    const { email, purpose } = req.body;

    const user = await UserModel.findOne({ email, isDeleted: false });
    if (!user) {
      return res.status(200).json({ message: "if that email exists, a code was sent" });
    }

    if (purpose === "VERIFY_EMAIL" && user.confirm) {
      return res.status(400).json({ message: "email is already verified" });
    }

    const recentOtp = await OtpModel.findOne({
      email,
      purpose,
      isUsed: false,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
    });
    if (recentOtp) {
      return res.status(429).json({ message: "please wait 1 minute before requesting a new code" });
    }

    const otp = generateOtp();
    await OtpModel.create({
      email,
      otp,
      purpose,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const eventName = purpose === "VERIFY_EMAIL" ? "sendEmail" : "forgetPassword";
    emitter.emit(eventName, { email, code: otp,  userName: user.name });

    return res.status(200).json({ message: "if that email exists, a code was sent" });
  } catch (error) {
    return next(error);
  }
};

// ─── PROFILE ─────────────────────────────────────────────

export const getMe = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user._id)
      .select("-password")
      .populate("teams", "name image");

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    return res.status(200).json({ message: "profile fetched", user });
  } catch (error) {
    return next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const id = req.user._id;

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    const { name, age, gender, phone } = req.body;
    if (name !== undefined) user.name = name;
    if (age !== undefined) user.age = age;
    if (gender !== undefined) user.gender = gender;
    if (phone) {
      user.phone = crypt_phone({ phone });
    }

    await user.save();

    const updated = user.toObject();
    delete updated.password;

    return res.status(200).json({ message: "user updated", user: updated });
  } catch (error) {
    return next(error);
  }
};

export const updateEmailUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "user not found" });

    const { newEmail } = req.body;

    if (user.email === newEmail) {
      return res.status(400).json({ message: "new email is the same as current" });
    }

    const emailTaken = await UserModel.findOne({ email: newEmail });
    if (emailTaken) {
      return res.status(400).json({ message: "email is already in use" });
    }

    user.email = newEmail;
    user.confirm = false;
    await user.save();

    const otp = generateOtp();
    await OtpModel.create({
      email: newEmail,
      otp,
      purpose: "VERIFY_EMAIL",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    emitter.emit("sendEmail", { email: newEmail, code: otp, userName: user.name });

    return res.status(200).json({ message: "email updated, check new email for verification code" });
  } catch (error) {
    return next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    const { oldPassword, newPassword } = req.body;

    const match = await comparePassword(oldPassword, user.password);
    if (!match) {
      return res.status(400).json({ message: "old password is incorrect" });
    }

    user.password = await hashPassword({ password: newPassword });
    await user.save();

    return res.status(200).json({ message: "password changed" });
  } catch (error) {
    return next(error);
  }
};

export const deleteMe = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    user.isDeleted = true;
    user.deletedBy = req.user._id;
    await user.save();

    await RevokedTokenModel.create({
      tokenId: req.decoded.jti,
      expireAt: new Date(req.decoded.exp * 1000),
    });

    return res.status(200).json({ message: "account deleted" });
  } catch (error) {
    return next(error);
  }
};

// ─── ADMIN ───────────────────────────────────────────────

export const getUsers = async (req, res, next) => {
  try {
    const users = await UserModel.find({ isDeleted: false }).select("-password");
    return res.status(200).json({ message: "users fetched", users });
  } catch (error) {
    return next(error);
  }
};

export const getOneuser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id).select("-password");
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "user not found" });
    }
    return res.status(200).json({ message: "user fetched", user });
  } catch (error) {
    return next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    if (user.role === userRole.admin) {
      return res.status(403).json({ message: "cannot delete an admin user" });
    }

    user.isDeleted = true;
    user.deletedBy = req.user._id;
    await user.save();

    return res.status(200).json({ message: "user deleted" });
  } catch (error) {
    return next(error);
  }
};

// ─── IMAGE ───────────────────────────────────────────────

export const uplode_user_image = async (req, res, next) => {
  try {
    const id = req.user._id;
    const user = await UserModel.findById(id);
    if (!user) {
      removeTempFile(req.file?.path);
      return res.status(404).json({ message: "user not found" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "file not found" });
    }
    if (user.image && user.image.public_id) {
      removeTempFile(req.file.path);
      return res.status(400).json({ message: "image already exists, use PUT to change it" });
    }
    const image = await cloudinary.uploader.upload(req.file.path, {
      folder: `task-management/users/${id}`,
    });
    removeTempFile(req.file.path);

    user.image = {
      secure_url: image.secure_url,
      public_id: image.public_id,
    };
    await user.save();

    return res.status(200).json({ message: "user image uploaded", user });
  } catch (error) {
    removeTempFile(req.file?.path);
    return next(error);
  }
};

export const change_user_image = async (req, res, next) => {
  try {
    const id = req.user._id;
    const user = await UserModel.findById(id);
    if (!user) {
      removeTempFile(req.file?.path);
      return res.status(404).json({ message: "user not found" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "file not found" });
    }
    if (user.image && user.image.public_id) {
      await cloudinary.uploader.destroy(user.image.public_id);
    }
    const image = await cloudinary.uploader.upload(req.file.path, {
      folder: `task-management/users/${id}`,
    });
    removeTempFile(req.file.path);

    user.image = {
      secure_url: image.secure_url,
      public_id: image.public_id,
    };
    await user.save();
    return res.status(200).json({ message: "user image updated", user });
  } catch (error) {
    removeTempFile(req.file?.path);
    return next(error);
  }
};

export const delete_user_image = async (req, res, next) => {
  try {
    const id = req.user._id;
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    if (!user.image || !user.image.public_id) {
      return res.status(400).json({ message: "user image not found" });
    }
    await cloudinary.uploader.destroy(user.image.public_id);
    user.image = undefined;
    await user.save();
    return res.status(200).json({ message: "user image deleted" });
  } catch (error) {
    return next(error);
  }
};

export const get_user_image = async (req, res, next) => {
  try {
    const id = req.user._id;
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    if (!user.image || !user.image.public_id) {
      return res.status(400).json({ message: "user image not found" });
    }
     const image = user.image.secure_url;
     return res.status(200).json({ message: "user image fetched", image });
 
  } catch (error) {
    return next(error);
  }
};
