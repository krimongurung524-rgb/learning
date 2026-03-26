import * as adminService from '../services/adminService.js';

export const getDashboard = async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const result = await adminService.getUsers(role, page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { role, is_active } = req.body;
    const user = await adminService.updateUser(req.params.id, role, is_active);
    res.json({ success: true, message: 'User updated', user });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const result = await adminService.deleteUser(req.params.id);
    res.json({ success: true, message: result.message });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export default { getDashboard, getUsers, updateUser, deleteUser };
