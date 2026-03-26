import { Bike, Review, User } from '../models/index.js';
import { Op } from 'sequelize';

export const getAllBikes = async (location, type, min_price, max_price, status, search, page = 1, limit = 10) => {
  const where = {};
  if (location) where.location = { [Op.like]: `%${location}%` };
  if (type) where.type = type;
  if (status) where.status = status;
  else where.status = 'available';
  if (search) where[Op.or] = [
    { name: { [Op.like]: `%${search}%` } },
    { brand: { [Op.like]: `%${search}%` } },
    { model: { [Op.like]: `%${search}%` } },
  ];
  if (min_price || max_price) {
    where.price_per_day = {};
    if (min_price) where.price_per_day[Op.gte] = min_price;
    if (max_price) where.price_per_day[Op.lte] = max_price;
  }
  const offset = (page - 1) * limit;
  const { rows: bikes, count: total } = await Bike.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
  });
  return {
    bikes,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
  };
};

export const getBikeById = async (bikeId) => {
  const bike = await Bike.findByPk(bikeId, {
    include: [{
      model: Review,
      as: 'reviews',
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'profile_image'] }],
      limit: 10,
      order: [['createdAt', 'DESC']],
    }],
  });
  if (!bike) {
    throw new Error('Bike not found');
  }
  return bike;
};

export const createBike = async (bikeData) => {
  const bike = await Bike.create(bikeData);
  return bike;
};

export const updateBike = async (bikeId, bikeData) => {
  const bike = await Bike.findByPk(bikeId);
  if (!bike) {
    throw new Error('Bike not found');
  }
  await bike.update(bikeData);
  return bike;
};

export const deleteBike = async (bikeId) => {
  const bike = await Bike.findByPk(bikeId);
  if (!bike) {
    throw new Error('Bike not found');
  }
  await bike.destroy();
  return { message: 'Bike deleted' };
};

export const getAllBikesAdmin = async () => {
  const bikes = await Bike.findAll({ order: [['createdAt', 'DESC']] });
  return bikes;
};

export default {
  getAllBikes,
  getBikeById,
  createBike,
  updateBike,
  deleteBike,
  getAllBikesAdmin,
};
