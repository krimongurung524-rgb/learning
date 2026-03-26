import * as reviewService from '../services/reviewService.js';

export const createReview = async (req, res) => {
  try {
    const { bike_id, booking_id, rating, comment } = req.body;
    const review = await reviewService.createReview(req.user.id, bike_id, booking_id, rating, comment);
    res.status(201).json({ success: true, message: 'Review submitted', review });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export default { createReview };
