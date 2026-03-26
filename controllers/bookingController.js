import * as bookingService from '../services/bookingService.js';

export const createBooking = async (req, res) => {
  try {
    const { bike_id, start_date, end_date, pickup_location, payment_method, loyalty_points_used = 0 } = req.body;
    const io = req.app.get('io');
    const booking = await bookingService.createBooking(
      req.user.id,
      bike_id,
      start_date,
      end_date,
      pickup_location,
      payment_method,
      loyalty_points_used,
      io
    );
    res.status(201).json({ success: true, message: 'Booking created successfully', booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await bookingService.getMyBookings(req.user.id);
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const result = await bookingService.getAllBookings(status, page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const io = req.app.get('io');
    const booking = await bookingService.updateBookingStatus(req.params.id, status, io);
    res.json({ success: true, message: `Booking ${status}`, booking });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const processPayment = async (req, res) => {
  try {
    const { payment_id, payment_method } = req.body;
    const booking = await bookingService.processPayment(req.params.id, req.user.id, payment_id, payment_method);
    res.json({ success: true, message: 'Payment processed', booking });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const result = await bookingService.cancelBooking(req.params.id, req.user.id);
    res.json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export default { createBooking, getMyBookings, getAllBookings, updateBookingStatus, processPayment, cancelBooking };
