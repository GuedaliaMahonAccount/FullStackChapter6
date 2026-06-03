/**
 * Ownership Middleware Factory
 * 
 * Creates middleware that verifies the authenticated user owns the
 * requested resource. Admins bypass ownership checks.
 * 
 * @param {mongoose.Model} Model - The Mongoose model to look up.
 * @returns {Function} Express middleware function.
 * 
 * Usage: router.put('/:id', auth, checkOwnership(Post), controller)
 */
const checkOwnership = (Model) => {
  return async (req, res, next) => {
    try {
      const resource = await Model.findById(req.params.id);

      if (!resource) {
        return res.status(404).json({
          error: 'Resource not found.',
        });
      }

      if (resource.isDeleted) {
        return res.status(404).json({
          error: 'Resource not found.',
        });
      }

      // Admins bypass ownership checks
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }

      // Check ownership — compare userId field on the resource
      const resourceUserId = resource.userId
        ? resource.userId.toString()
        : null;

      if (resourceUserId !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied. You can only modify your own resources.',
        });
      }

      // Attach the resource to avoid re-fetching in the controller
      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { checkOwnership };
