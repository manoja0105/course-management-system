
const jwt = require("jsonwebtoken");

// Verify JWT token
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access token required. Please login.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token. Please login again.",
    });
  }
};

// Check user role (case-insensitive)
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Please login first.",
      });
    }

    const userRole = String(req.user.role || "").toUpperCase();
    const allowedRoles = roles.map((role) =>
      String(role).toUpperCase()
    );

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: "You do not have permission to access this resource.",
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authMiddleware: authenticate,
  authorizeRoles,
};
