import { Review, Bike, Booking } from '../models/index.js';

export const createReview = async (userId, bike_id, booking_id, rating, comment) => {
  // Ensure booking belongs to user and is completed
  const booking = await Booking.findOne({
    where: { id: booking_id, user_id: userId, status: 'completed' },
  });
  if (!booking) {
    throw new Error('You can only review completed bookings');
  }

  // Check if review already exists
  const existing = await Review.findOne({ where: { booking_id } });
  if (existing) {
    throw new Error('You already reviewed this booking');
  }

  const review = await Review.create({ user_id: userId, bike_id, booking_id, rating, comment });

  // Update bike rating
  const allReviews = await Review.findAll({ where: { bike_id } });
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  await Bike.update({ rating: avgRating.toFixed(2), total_reviews: allReviews.length }, { where: { id: bike_id } });

  return review;
};

export default {
  createReview,
};
