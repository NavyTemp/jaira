import UserModel from "../models/user.model.js";
import { hashPassword } from "../utlis/encrypt/encrypt.js";
import { userRole } from "../utlis/genral_emun.js";
import CryptoJS from "crypto-js";
import { nanoid } from "nanoid";
import becrypt from "bcrypt";
import jwt from "jsonwebtoken";
import RevokedTokenModel from "../models/revokedtoken.model.js";
import cloudinary from "../service/cloudinary.js";

export const signup = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, gender, status, age } =
      req.body;
    const exist_user = await UserModel.findOne({ email });
    if (exist_user) {
      return res.status(400).json({ message: "user already exist" });
    }

    const hash_password = await hashPassword({ password });
    let encryptedPhone = CryptoJS.AES.encrypt(
      phone,
      process.env.secret_key,
    ).toString();

    const user = await UserModel.create({
      name,
      email,
      password: hash_password,
      confirmpassword: hash_password,
      phone: encryptedPhone,
      role,
      gender,
      status,
      age,
    });
    return res.status(200).json({ message: "signup", user });
  } catch (error) {
    return next(error);
  }
};
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }

    const match = await becrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "password not match" });
    }

    console.log(user.role);

    const access_token = jwt.sign(
      { userId: user._id, email, userrole: user.role },
      user.role == userRole.user
        ? process.env.SIGNATURE_USER
        : process.env.SIGNATURE_ADMIN,

      { expiresIn: "1Y", jwtid: nanoid() },
    );

    const refresh_token = jwt.sign(
      { userId: user._id, email, userrole: user.role },
      user.role == userRole.user
        ? process.env.SIGNATURE_USER
        : process.env.SIGNATURE_ADMIN,
      { expiresIn: "30d", jwtid: nanoid() },
    );

    return res
      .status(200)
      .json({ message: "login success", access_token, refresh_token });
  } catch (error) {
    return next(error);
  }
};
export const getUsers = async (req, res, next) => {
  try {
    const user = req.user;
    if (user.role !== userRole.admin) {
      return res.status(403).json({ message: "unauthorized ", user });
    }
    const users = await UserModel.find();
    return res.status(200).json({ message: "get users", users });
  } catch (error) {
    return next(error);
  }
};
export const getOneuser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.role !== userRole.admin) {
      return res.status(403).json({ message: "unauthorized" });
    }

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    return res.status(200).json({ message: "get user", user });
  } catch (error) {
    return next(error);
  }
};
export const updateUser = async (req, res, next) => {
  try {
    const id = req.user._id;

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }

    const { name, age, gender, phone } = req.body;
    user.name = name;
    user.age = age;
    user.gender = gender;
    if (phone) {
      user.phone = CryptoJS.AES.encrypt(
        phone,
        process.env.secret_key,
      ).toString();
    }

    await user.save();

    return res.status(200).json({ message: "update user", user });
  } catch (error) {
    return next(error);
  }
};
export const updateEmailUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { newEmail } = req.body;
    if (user.email == newEmail) {
      throw new Error("Email is not changed");
    }

    if (user.email !== newEmail) {
      user.email = newEmail;
      user.confirmed = false;
    }
    await user.save();
    return res.status(200).json({ message: "Email updated successfully" });
  } catch (error) {
    return next(error);
  }
};
export const deleteUser = async (req, res, next) => {
  try {
    const id = req.user._id;

    const user = await UserModel.findById(id);

    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }

    if (user.role === userRole.admin) {
      return res.status(400).json({ message: "admin can not delete" });
    }

    await UserModel.findByIdAndDelete(id);

    return res.status(200).json({ message: "user deleted" });
  } catch (error) {
    return next(error);
  }
};
export const logout = async (req, res, next) => {
  const revokedToken = await RevokedTokenModel.create({
    tokenId: req.decoded.jti,
    expireAt: req.decoded.exp,
  });
  return res.status(200).json({ message: "logout success" });
};
export const refreshToken = (req, res, next) => {
  try {
    const user = req.user;
    const access_token = jwt.sign(
      { userId: user._id, email: user.email, userrole: user.role },
      user.role == userRole.user
        ? process.env.SIGNATURE_USER
        : process.env.SIGNATURE_ADMIN,
      { expiresIn: "1Y", jwtid: nanoid() },
    );
    const refresh_token = jwt.sign(
      { userId: user._id, email: user.email, userrole: user.role },
      user.role == userRole.user
        ? process.env.SIGNATURE_USER
        : process.env.SIGNATURE_ADMIN,
      { expiresIn: "30d", jwtid: nanoid() },
    );
    return res
      .status(200)
      .json({ message: "token refreshed", access_token, refresh_token });
  } catch (error) {
    return next(error);
  }
};
export const uplode_user_image = async (req, res, next) => {
  try {
    const id = req.user._id;
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "file not found" });
    }
    const image = await cloudinary.uploader.upload(req.file.path);

    user.image = {
      secure_url: image.secure_url,
      public_id: image.public_id,
    };
    await user.save();

    return res.status(200).json({ message: "user updated" });
  } catch (error) {
    return next(error);
  }
};
export const change_user_image = async (req, res, next) => {
  try {
    const id = req.user._id;
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "file not found" });
    }
    if (user.image && user.image.public_id) {
      await cloudinary.uploader.destroy(user.image.public_id);
    }
    const image = await cloudinary.uploader.upload(req.file.path);
    user.image = {
      secure_url: image.secure_url,
      public_id: image.public_id,
    };
    await user.save();
    return res
      .status(200)
      .json({ message: "user updated image successfully 😍👌", user });
  } catch (error) {
    return next(error);
  }
};
export const delete_user_image = async (req, res, next) => {
  try {
    const id = req.user._id;
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }
    if (!user.image || !user.image.public_id) {
      return res.status(400).json({ message: "user image not found" });
    }
    await cloudinary.uploader.destroy(user.image.public_id);
    user.image = undefined;
    await user.save();
    return res
      .status(200)
      .json({ message: "user image deleted successfully 😍 👌" });
  } catch (error) {
    return next(error);
  }
};
export const get_user_image = async (req, res, next) => {
  try {
    const id = req.user._id;
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }
    if (!user.image || !user.image.public_id) {
      return res.status(400).json({ message: "user image not found" });
    }
    const image = await cloudinary.uploader.download(user.image.public_id);
    return res.status(200).json({ message: "user image", image });
  } catch (error) {
    return next(error);
  }
};
