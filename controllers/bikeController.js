import * as bikeService from '../services/bikeService.js';

export const getBikes = async (req, res) => {
  try {
    const { location, type, min_price, max_price, status, search, page = 1, limit = 10 } = req.query;
    const result = await bikeService.getAllBikes(location, type, min_price, max_price, status, search, page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBike = async (req, res) => {
  try {
    const bike = await bikeService.getBikeById(req.params.id);
    res.json({ success: true, bike });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const createBike = async (req, res) => {
  try {
    const bike = await bikeService.createBike(req.body);
    res.status(201).json({ success: true, message: 'Bike created successfully', bike });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBike = async (req, res) => {
  try {
    const bike = await bikeService.updateBike(req.params.id, req.body);
    res.json({ success: true, message: 'Bike updated', bike });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const deleteBike = async (req, res) => {
  try {
    const result = await bikeService.deleteBike(req.params.id);
    res.json({ success: true, message: result.message });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const getAllBikesAdmin = async (req, res) => {
  try {
    const bikes = await bikeService.getAllBikesAdmin();
    res.json({ success: true, bikes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { getBikes, getBike, createBike, updateBike, deleteBike, getAllBikesAdmin };
