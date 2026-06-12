const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { checkOwnership } = require('../middleware/ownership');
const { cache } = require('../middleware/cache');
const Album = require('../models/Album');
const {
  getAlbums,
  getAlbumById,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  getAlbumPhotos,
  addPhoto,
  deletePhoto,
} = require('../controllers/albumController');

const TTL = 20_000;

router.get('/', auth, cache(TTL), getAlbums);
router.get('/:id', auth, cache(TTL), getAlbumById);
router.get('/:id/photos', auth, cache(TTL), getAlbumPhotos);
router.post('/', auth, createAlbum);
router.put('/:id', auth, checkOwnership(Album), updateAlbum);
router.delete('/:id', auth, checkOwnership(Album), deleteAlbum);

// addPhoto and deletePhoto use checkOwnership so req.resource = album is guaranteed
router.post('/:id/photos', auth, checkOwnership(Album), addPhoto);
router.delete('/:id/photos/:photoId', auth, checkOwnership(Album), deletePhoto);

module.exports = router;
