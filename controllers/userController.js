
const bcrypt = require('bcrypt');
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
// Delete user account
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Start a transaction for data consistency
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      
      // Finally, delete the user from users table
      const [result] = await connection.execute(
        'DELETE FROM users WHERE user_id = ?',
        [userId]
      );
      
      if (result.affectedRows === 0) {
        // Rollback the transaction if user not found
        await connection.rollback();
        connection.release();
        
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Commit the transaction if everything succeeded
      await connection.commit();
      connection.release();
      
      return res.status(200).json({
        success: true,
        message: 'Account deleted successfully'
      });
      
    } catch (error) {
      // Rollback the transaction in case of any error
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    console.error('Error deleting user account:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: error.message
    });
  }
};
// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const [rows] = await pool.execute(
      'SELECT user_id, first_name,last_name, email, phone_number, address, city, state, zip_code FROM users WHERE user_id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { first_name,last_name, email, mobile, address, city, state, zip_code } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    await pool.execute(
      'UPDATE users SET first_name = ?,last_name = ?, email = ?, phone_number = ?, address = ?, city = ?, state = ?, zip_code = ? WHERE user_id = ?',
      [first_name,last_name, email, mobile, address || null, city || null, state || null, zip_code || null, userId]
    );

    return res.status(200).json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};