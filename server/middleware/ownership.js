const { notFound, forbidden } = require('../utils/response');

const checkOwnership = (Model) => async (req, res, next) => {
  try {
    const resource = await Model.findById(req.params.id);

    if (!resource || resource.isDeleted) {
      return notFound(res, 'Resource not found.');
    }

    if (req.user.role === 'admin') {
      req.resource = resource;
      return next();
    }

    const resourceUserId = resource.userId ? resource.userId.toString() : null;
    if (resourceUserId !== req.user.id) {
      return forbidden(res, 'Access denied. You can only modify your own resources.');
    }

    req.resource = resource;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { checkOwnership };
