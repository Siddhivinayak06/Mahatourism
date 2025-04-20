// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookingsController');

// Create a new booking
router.post('/bookings', bookingsController.createBooking);

// Get all bookings
router.get('/bookings', bookingsController.getAllBookings);

// Get booking by ID or booking_id
router.get('/bookings/:bookingId', bookingsController.getBookingsById);

router.get('/bookings/user/:userId', bookingsController.getBookingsByUserId);

router.get('/hotel-bookings/user/:userId', bookingsController.getHotelBookingsByUserId);

router.get('/flight-bookings/user/:userId', bookingsController.getUserFlightBookings);
// Get bookings by customer email
router.get('/bookings/email/:email', bookingsController.getBookingsByEmail);

// Update booking status
router.patch('/bookings/:id', bookingsController.updateBookingStatus);

// Cancel a booking
router.post('/bookings/cancel/:bookingId', bookingsController.cancelBooking);

module.exports = router;