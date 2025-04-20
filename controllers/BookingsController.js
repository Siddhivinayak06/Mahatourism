// bookingsController.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Create a connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Omshri#20',
  database: 'mahatourism1',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    // Get the current timestamp for booking_date
    const bookingDate = new Date().toISOString().split('T')[0];
    
    // Extract and sanitize all fields from request body with default values
    const {
      booking_id,
      user_id,
      package_id,
      package_name,
      package_destination = '',  // Provide defaults for optional fields
      package_duration = '',
      customer_name,
      customer_email,
      customer_phone,
      travel_date,
      adults = 1,
      children = 0,
      special_requests = 'None',
      total_price,
      status = 'confirmed',
      payment_status = 'unpaid'
    } = req.body;

    // Validate required fields
    if (!booking_id || !user_id || !package_id || !package_name || !customer_name || 
        !customer_email || !customer_phone || !travel_date || !total_price) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required booking information' 
      });
    }

    // Format travel date if it's an ISO string
    let formattedTravelDate;
    try {
      formattedTravelDate = new Date(travel_date).toISOString().split('T')[0];
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid travel date format'
      });
    }

    const query = `
      INSERT INTO bookings (
        booking_id, user_id, package_id, package_name, package_destination, 
        package_duration, customer_name, customer_email, customer_phone,
        travel_date, adults, children, special_requests, total_price,
        booking_date, status, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Ensure all parameters are defined before the query
    const params = [
      booking_id,
      user_id,
      package_id,
      package_name,
      package_destination,
      package_duration,
      customer_name,
      customer_email,
      customer_phone,
      formattedTravelDate,
      adults,
      children,
      special_requests,
      total_price,
      bookingDate,       // Added booking_date parameter
      status,
      payment_status
    ];

    // Log the parameters for debugging
    console.log('Query parameters:', params);
    
    // Check for any undefined values
    const undefinedParams = params.map((p, i) => p === undefined ? i : null).filter(i => i !== null);
    if (undefinedParams.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Parameters at positions ${undefinedParams.join(', ')} are undefined`
      });
    }

    const [result] = await pool.execute(query, params);

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        id: result.insertId,
        booking_id
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
};

// Get all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

// Get bookings by user ID
exports.getBookingsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const [rows] = await pool.execute(
      'SELECT * FROM bookings WHERE user_id = ?',
      [userId]
    );

    // Return just the data array as expected by the frontend
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};


// Get bookings by  ID
exports.getBookingsById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'booking ID is required'
      });
    }
    
    const [rows] = await pool.execute(
      'SELECT * FROM bookings WHERE booking_id = ?',
      [bookingId]
    );

    // Return just the data array as expected by the frontend
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};
// Get bookings by customer email
exports.getBookingsByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    const [rows] = await pool.execute(
      'SELECT * FROM bookings WHERE customer_email = ? ORDER BY created_at DESC',
      [email]
    );

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching bookings by email:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_status } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }
    
    let query = 'UPDATE bookings SET ';
    const queryParams = [];
    
    if (status) {
      query += 'status = ?';
      queryParams.push(status);
      
      if (payment_status) {
        query += ', payment_status = ?';
        queryParams.push(payment_status);
      }
    } else if (payment_status) {
      query += 'payment_status = ?';
      queryParams.push(payment_status);
    } else {
      return res.status(400).json({
        success: false,
        message: 'No update parameters provided'
      });
    }
    
    query += ' WHERE id = ? OR booking_id = ?';
    queryParams.push(id, id);
    
    const [result] = await pool.execute(query, queryParams);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Booking updated successfully'
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update booking',
      error: error.message
    });
  }
};

// Delete a booking
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }
    
    const [result] = await pool.execute(
      'DELETE FROM bookings WHERE booking_id = ?',
      [bookingId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete booking',
      error: error.message
    });
  }
};

exports.getHotelBookingsByUserId = async (req, res) => {
  const userId = req.params.userId;
  
  try {
    // Join with hotels table to get hotel name
    const query = `
      SELECT 
        hb.id,
        hb.booking_id,
        hb.hotel_id,
        h.name as hotel_name,
        hb.room_type_id,
        rt.name as room_type,
        hb.user_id,
        hb.guest_name,
        hb.guest_email,
        hb.guest_phone,
        hb.check_in_date,
        hb.check_out_date,
        hb.guests_count,
        hb.total_price,
        hb.special_requests,
        hb.payment_method,
        hb.payment_status,
        hb.booking_status as status,
        hb.created_at,
        hb.updated_at
      FROM 
        hotel_bookings hb
      LEFT JOIN 
        hotels h ON hb.hotel_id = h.hotel_id
      LEFT JOIN
        room_types rt ON hb.room_type_id = rt.id
      WHERE 
        hb.user_id = ?
      ORDER BY 
        hb.created_at DESC
    `;
    
    const [bookings] = await pool.query(query, [userId]);
    
    if (bookings.length === 0) {
      return res.status(200).json([]);
    }
    
    // Format dates for consistent output
    const formattedBookings = bookings.map(booking => {
      return {
        ...booking,
        check_in_date: booking.check_in_date ? new Date(booking.check_in_date).toISOString() : null,
        check_out_date: booking.check_out_date ? new Date(booking.check_out_date).toISOString() : null,
        created_at: booking.created_at ? new Date(booking.created_at).toISOString() : null,
        updated_at: booking.updated_at ? new Date(booking.updated_at).toISOString() : null,
        rooms: booking.guests_count > 1 ? Math.ceil(booking.guests_count / 2) : 1, // Calculate rooms based on guests
      };
    });
    
    return res.status(200).json(formattedBookings);
    
  } catch (error) {
    console.error('Error fetching hotel bookings:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Failed to fetch hotel bookings',
      error: error.message 
    });
  }
};

exports.getUserFlightBookings = async (req, res) => {
  const userId = req.params.userId;
  
  try {
    // Query flight bookings with detailed information
    const query = `
      SELECT 
        fb.id,
        fb.user_id,
        fb.flight_number,
        fb.airline,
        fb.departure_airport,
        fb.departure_code,
        fb.arrival_airport,
        fb.arrival_code,
        fb.departure_time,
        fb.arrival_time,
        fb.passengers,
        fb.amount,
        fb.booking_date,
        fb.email,
        fb.transaction_id,
        fb.payment_status,
        fb.created_at,
        fb.updated_at
      FROM 
        flight_bookings fb
      WHERE 
        fb.user_id = ?
      ORDER BY 
        fb.booking_date DESC
    `;
    
    const [bookings] = await pool.query(query, [userId]);
    
    if (bookings.length === 0) {
      return res.status(200).json([]);
    }
    
    // Format dates and parse JSON data for consistent output
    const formattedBookings = bookings.map(booking => {
      // Parse passengers JSON data
      let parsedPassengers = [];
      try {
        if (booking.passengers && typeof booking.passengers === 'string') {
          parsedPassengers = JSON.parse(booking.passengers);
        }
      } catch (err) {
        console.error('Error parsing passengers data:', err);
      }
      
      // Calculate passenger count
      const passengerCount = Array.isArray(parsedPassengers) ? parsedPassengers.length : 1;
      
      return {
        ...booking,
        passengers: parsedPassengers,
        departure_time: booking.departure_time ? new Date(booking.departure_time).toISOString() : null,
        arrival_time: booking.arrival_time ? new Date(booking.arrival_time).toISOString() : null,
        booking_date: booking.booking_date ? new Date(booking.booking_date).toISOString() : null,
        created_at: booking.created_at ? new Date(booking.created_at).toISOString() : null,
        updated_at: booking.updated_at ? new Date(booking.updated_at).toISOString() : null,
        // Additional fields for frontend compatibility
        status: booking.payment_status ? booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1) : 'Pending',
        departure_city: booking.departure_airport || 'Unknown',
        arrival_city: booking.arrival_airport || 'Unknown',
        departure_date: booking.departure_time ? new Date(booking.departure_time).toISOString() : null,
        price: booking.amount,
        booking_id: booking.id,
        passenger_count: passengerCount
      };
    });
    
    return res.status(200).json(formattedBookings);
    
  } catch (error) {
    console.error('Error fetching flight bookings:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Failed to fetch flight bookings',
      error: error.message 
    });
  }
};