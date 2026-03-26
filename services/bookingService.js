import { Booking, Bike, User, Review, Notification } from '../models/index.js';
import { Op } from 'sequelize';

export const createBooking = async (userId, bike_id, start_date, end_date, pickup_location, payment_method, loyalty_points_used = 0, io = null) => {
  const bike = await Bike.findByPk(bike_id);
  if (!bike) {
    throw new Error('Bike not found');
  }
  if (bike.status !== 'available') {
    throw new Error('Bike is not available');
  }

  // Check for overlapping bookings
  const overlap = await Booking.findOne({
    where: {
      bike_id,
      status: { [Op.in]: ['pending', 'approved', 'active'] },
      [Op.or]: [
        { start_date: { [Op.between]: [start_date, end_date] } },
        { end_date: { [Op.between]: [start_date, end_date] } },
      ],
    },
  });
  if (overlap) {
    throw new Error('Bike is already booked for this period');
  }

  const start = new Date(start_date);
  const end = new Date(end_date);
  const total_hours = Math.ceil((end - start) / (1000 * 60 * 60));
  const total_amount = total_hours >= 24
    ? Math.ceil(total_hours / 24) * parseFloat(bike.price_per_day)
    : total_hours * parseFloat(bike.price_per_hour);

  // Loyalty points (1 point = 10 NPR)
  const user = await User.findByPk(userId);
  let discount_amount = 0;
  let pts_used = 0;
  if (loyalty_points_used > 0 && user.loyalty_points >= loyalty_points_used) {
    pts_used = loyalty_points_used;
    discount_amount = pts_used * 10;
  }
  const final_amount = Math.max(0, total_amount - discount_amount);
  const loyalty_points_earned = Math.floor(final_amount / 100);

  const booking = await Booking.create({
    user_id: userId,
    bike_id,
    start_date,
    end_date,
    pickup_location,
    total_hours,
    total_amount,
    discount_amount,
    final_amount,
    payment_method,
    loyalty_points_used: pts_used,
    loyalty_points_earned,
  });

  // Deduct loyalty points if used
  if (pts_used > 0) {
    await user.update({ loyalty_points: user.loyalty_points - pts_used });
  }

  // Create notifications for all admin and superadmin users
  const admins = await User.findAll({
    where: { role: { [Op.in]: ['admin', 'superadmin'] } },
  });

  for (const admin of admins) {
    await Notification.create({
      user_id: admin.id,
      title: 'New Booking Request',
      message: `${user.name} has booked ${bike.name}. Bike: ${bike.brand} ${bike.model}. Start: ${new Date(start_date).toLocaleDateString()}, End: ${new Date(end_date).toLocaleDateString()}`,
      type: 'booking',
      link: `/admin`,
    });

    // Emit real-time notification via socket
    if (io) {
      io.to(`user_${admin.id}`).emit('newNotification', {
        title: 'New Booking Request',
        message: `${user.name} has booked ${bike.name}. Start: ${new Date(start_date).toLocaleDateString()}, End: ${new Date(end_date).toLocaleDateString()}`,
        type: 'booking',
      });
    }
  }

  return booking;
};

export const getMyBookings = async (userId) => {
  const bookings = await Booking.findAll({
    where: { user_id: userId },
    include: [{ model: Bike, as: 'bike' }, { model: Review, as: 'review' }],
    order: [['createdAt', 'DESC']],
  });
  return bookings;
};

export const getAllBookings = async (status, page = 1, limit = 20) => {
  const where = status ? { status } : {};
  const offset = (page - 1) * limit;
  const { rows: bookings, count: total } = await Booking.findAndCountAll({
    where,
    include: [
      { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
      { model: Bike, as: 'bike', attributes: ['id', 'name', 'model', 'brand', 'image'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });
  return {
    bookings,
    total,
    pages: Math.ceil(total / limit),
  };
};

export const updateBookingStatus = async (bookingId, status, io = null) => {
  const booking = await Booking.findByPk(bookingId, {
    include: [{ model: Bike, as: 'bike' }, { model: User, as: 'user' }],
  });
  if (!booking) {
    throw new Error('Booking not found');
  }

  await booking.update({ status });

  // Update bike status when booking goes active or completed
  if (status === 'active') {
    await booking.bike.update({ status: 'rented' });
    
    // Create notification for customer when booking is activated
    await Notification.create({
      user_id: booking.user_id,
      title: 'Bike Pickup Ready',
      message: `Your booking for ${booking.bike.name} (${booking.bike.brand} ${booking.bike.model}) is now active. Please proceed with bike pickup from the designated location.`,
      type: 'booking',
      link: '/my-bookings',
    });

    // Emit real-time notification via socket
    if (io) {
      io.to(`user_${booking.user_id}`).emit('newNotification', {
        title: 'Bike Pickup Ready',
        message: `Your booking for ${booking.bike.name} is now active. Please proceed with pickup.`,
        type: 'booking',
      });
    }
  }
  if (status === 'completed') {
    await booking.bike.update({ status: 'available' });
    // Award loyalty points
    await booking.user.update({
      loyalty_points: booking.user.loyalty_points + booking.loyalty_points_earned,
    });
  }
  if (status === 'rejected' || status === 'cancelled') {
    await booking.bike.update({ status: 'available' });
  }

  // Create notification for customer when booking is approved or rejected
  if (status === 'approved') {
    await Notification.create({
      user_id: booking.user_id,
      title: 'Booking Approved',
      message: `Your booking for ${booking.bike.name} (${booking.bike.brand} ${booking.bike.model}) has been approved. Start date: ${new Date(booking.start_date).toLocaleDateString()}, End date: ${new Date(booking.end_date).toLocaleDateString()}`,
      type: 'booking',
      link: '/my-bookings',
    });

    // Emit real-time notification via socket
    if (io) {
      io.to(`user_${booking.user_id}`).emit('newNotification', {
        title: 'Booking Approved',
        message: `Your booking for ${booking.bike.name} has been approved.`,
        type: 'booking',
      });
    }
  } else if (status === 'rejected') {
    await Notification.create({
      user_id: booking.user_id,
      title: 'Booking Rejected',
      message: `Your booking for ${booking.bike.name} (${booking.bike.brand} ${booking.bike.model}) has been rejected. If you have any questions, please contact support.`,
      type: 'booking',
      link: '/my-bookings',
    });

    // Emit real-time notification via socket
    if (io) {
      io.to(`user_${booking.user_id}`).emit('newNotification', {
        title: 'Booking Rejected',
        message: `Your booking for ${booking.bike.name} has been rejected.`,
        type: 'booking',
      });
    }
  }

  return booking;
};

export const processPayment = async (bookingId, userId, payment_id, payment_method) => {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }
  if (booking.user_id !== userId) {
    throw new Error('Unauthorized');
  }

  await booking.update({ payment_status: 'paid', payment_id, payment_method });
  return booking;
};

export const cancelBooking = async (bookingId, userId) => {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }
  if (booking.user_id !== userId) {
    throw new Error('Unauthorized');
  }
  if (['completed', 'active'].includes(booking.status)) {
    throw new Error('Cannot cancel active or completed booking');
  }
  await booking.update({ status: 'cancelled' });
  return { message: 'Booking cancelled' };
};

export default {
  createBooking,
  getMyBookings,
  getAllBookings,
  updateBookingStatus,
  processPayment,
  cancelBooking,
};
