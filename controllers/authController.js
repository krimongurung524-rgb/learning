import * as authService from '../services/authService.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, phone, license_number } = req.body;
    const result = await authService.registerUser(name, email, password, phone, license_number);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.json({
      success: true,
      message: 'Login successful',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    if (error.message === 'Account deactivated') {
      return res.status(403).json({ success: false, message: error.message });
    }
    res.status(401).json({ success: false, message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await authService.getUserProfile(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, license_number } = req.body;
    const user = await authService.updateUserProfile(req.user.id, name, phone, license_number);
    res.json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changeUserPassword(req.user.id, currentPassword, newPassword);
    res.json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export default { register, login, getMe, updateProfile, changePassword };
