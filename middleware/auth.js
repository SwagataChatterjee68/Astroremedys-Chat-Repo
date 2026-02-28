const jwt = require('jsonwebtoken');

/**
 * Middleware for normal API routes
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }
  
  const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';
  
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

/**
 * Middleware for Socket.IO authentication
 */
function authenticateSocketToken(socket, next) {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error: Token required'));
  }
  
  const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';
  
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
    
    socket.user = decoded;
    next();
  });
}

module.exports = {
  authenticateToken,
  authenticateSocketToken
};