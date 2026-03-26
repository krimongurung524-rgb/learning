import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export const registerUser = async (name, email, password, phone, license_number) => {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new Error('Email already registered');
  }
  const user = await User.create({ name, email, password, phone, license_number });
  const token = generateToken(user.id);
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      loyalty_points: user.loyalty_points,
    },
  };
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.comparePassword(password))) {
    throw new Error('Invalid email or password');
  }
  if (!user.is_active) {
    throw new Error('Account deactivated');
  }
  const token = generateToken(user.id);
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      loyalty_points: user.loyalty_points,
      profile_image: user.profile_image,
    },
  };
};

export const getUserProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
  });
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

export const updateUserProfile = async (userId, name, phone, license_number) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }
  await user.update({ name, phone, license_number });
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    license_number: user.license_number,
    role: user.role,
    loyalty_points: user.loyalty_points,
  };
};

export const changeUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }
  if (!(await user.comparePassword(currentPassword))) {
    throw new Error('Current password is incorrect');
  }
  await user.update({ password: newPassword });
  return { message: 'Password changed successfully' };
};

export default {
  generateToken,
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
};
