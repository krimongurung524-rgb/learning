import { User, Bike, Booking, Review } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

export const getDashboardStats = async () => {
  const [totalUsers, totalBikes, totalBookings, pendingBookings, activeBookings, completedBookings] = await Promise.all([
    User.count({ where: { role: 'customer' } }),
    Bike.count(),
    Booking.count(),
    Booking.count({ where: { status: 'pending' } }),
    Booking.count({ where: { status: 'active' } }),
    Booking.count({ where: { status: 'completed' } }),
  ]);

  // Revenue
  const revenueResult = await Booking.findOne({
    attributes: [[sequelize.fn('SUM', sequelize.col('final_amount')), 'total']],
    where: { status: 'completed', payment_status: 'paid' },
  });
  const totalRevenue = revenueResult?.dataValues?.total || 0;

  // Monthly revenue (last 6 months)
  const monthlyRevenue = await Booking.findAll({
    attributes: [
      [sequelize.fn('MONTH', sequelize.col('createdAt')), 'month'],
      [sequelize.fn('YEAR', sequelize.col('createdAt')), 'year'],
      [sequelize.fn('SUM', sequelize.col('final_amount')), 'revenue'],
    ],
    where: {
      status: 'completed',
      payment_status: 'paid',
      createdAt: { [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 6)) },
    },
    group: [sequelize.fn('MONTH', sequelize.col('createdAt')), sequelize.fn('YEAR', sequelize.col('createdAt'))],
    order: [[sequelize.fn('YEAR', sequelize.col('createdAt')), 'ASC'], [sequelize.fn('MONTH', sequelize.col('createdAt')), 'ASC']],
  });

  const availableBikes = await Bike.count({ where: { status: 'available' } });
  const rentedBikes = await Bike.count({ where: { status: 'rented' } });

  return {
    totalUsers,
    totalBikes,
    totalBookings,
    pendingBookings,
    activeBookings,
    completedBookings,
    totalRevenue,
    availableBikes,
    rentedBikes,
    monthlyRevenue,
  };
};

export const getUsers = async (role, page = 1, limit = 20) => {
  const where = role ? { role } : {};
  const offset = (page - 1) * limit;
  const { rows: users, count: total } = await User.findAndCountAll({
    where,
    attributes: { exclude: ['password'] },
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
  });
  return {
    users,
    total,
    pages: Math.ceil(total / limit),
  };
};

export const updateUser = async (userId, role, is_active) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }
  await user.update({ role, is_active });
  return user.toJSON();
};

export const deleteUser = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }
  await user.destroy();
  return { message: 'User deleted' };
};

export default {
  getDashboardStats,
  getUsers,
  updateUser,
  deleteUser,
};
