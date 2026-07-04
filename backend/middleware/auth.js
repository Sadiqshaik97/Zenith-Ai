export default function authMiddleware(req, res, next) {
  // Authentication bypass: all clients operate as a single default user
  req.userId = 'default_user';
  req.userEmail = 'user@zenith.ai';
  next();
}
