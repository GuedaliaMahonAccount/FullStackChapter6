const Album = require('../models/Album');
const Photo = require('../models/Photo');
const User = require('../models/User');
const { success, created, updated, deleted, noData, notFound, validationError } = require('../utils/response');
const { invalidate, invalidatePath } = require('../middleware/cache');
const logActivity = require('../utils/activityLogger');

const getAlbums = async (req, res, next) => {
  try {
    const filter = { isDeleted: false };
    if (req.query.mine === 'true') filter.userId = req.user.id;
    if (req.query.title) filter.title = { $regex: req.query.title, $options: 'i' };

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 12));
    const skip  = (page - 1) * limit;

    const [albums, total] = await Promise.all([
      Album.find(filter).populate('userId', 'username name').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Album.countDocuments(filter),
    ]);

    if (total === 0) return noData(res, 'No albums found.');
    return success(res, { albums, total, page, limit, hasMore: skip + albums.length < total }, `${total} album(s) found.`);
  } catch (error) {
    next(error);
  }
};

const getAlbumById = async (req, res, next) => {
  try {
    const album = await Album.findOne({ _id: req.params.id, isDeleted: false }).populate('userId', 'username name');
    if (!album) return notFound(res, 'Album not found.');
    const photoCount = await Photo.countDocuments({ albumId: album._id, isDeleted: false });
    return success(res, { ...album.toJSON(), photoCount }, 'Album retrieved.');
  } catch (error) {
    next(error);
  }
};

const getAlbumPhotos = async (req, res, next) => {
  try {
    const album = await Album.findOne({ _id: req.params.id, isDeleted: false }).select('_id');
    if (!album) return notFound(res, 'Album not found.');

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 12));
    const skip  = (page - 1) * limit;

    const [photos, total] = await Promise.all([
      Photo.find({ albumId: album._id, isDeleted: false }).sort({ createdAt: 1, _id: 1 }).skip(skip).limit(limit),
      Photo.countDocuments({ albumId: album._id, isDeleted: false }),
    ]);

    if (total === 0) return noData(res, 'No photos in this album.');
    return success(res, { photos, total, page, limit, hasMore: skip + photos.length < total }, `${total} photo(s) found.`);
  } catch (error) {
    next(error);
  }
};

const createAlbum = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title) return validationError(res, 'Title is required.');

    const album = await Album.create({ userId: req.user.id, title });
    await album.populate('userId', 'username name');
    invalidatePath('/albums');
    await User.findByIdAndUpdate(req.user.id, { $set: { lastActivityAt: new Date() } });
    logActivity(req.user.id, 'CREATE', 'album', album._id, album.title);
    return created(res, album, 'Album created.');
  } catch (error) {
    next(error);
  }
};

const updateAlbum = async (req, res, next) => {
  try {
    const album = req.resource;
    const { title } = req.body;
    if (title !== undefined) album.title = title;
    await album.save();
    await album.populate('userId', 'username name');
    invalidatePath('/albums');
    await User.findByIdAndUpdate(req.user.id, { $set: { lastActivityAt: new Date() } });
    logActivity(req.user.id, 'UPDATE', 'album', album._id, album.title);
    return updated(res, album, 'Album updated.');
  } catch (error) {
    next(error);
  }
};

const deleteAlbum = async (req, res, next) => {
  try {
    const album = req.resource;
    const { title: albumTitle, _id: albumId } = album;
    await Photo.updateMany({ albumId: album._id, isDeleted: false }, { $set: { isDeleted: true } });
    album.isDeleted = true;
    await album.save();
    invalidatePath('/albums');
    await User.findByIdAndUpdate(req.user.id, { $set: { lastActivityAt: new Date() } });
    logActivity(req.user.id, 'DELETE', 'album', albumId, albumTitle);
    return deleted(res, 'Album and all its photos deleted.');
  } catch (error) {
    next(error);
  }
};

const addPhoto = async (req, res, next) => {
  try {
    const album = req.resource;
    const { title, url, thumbnailUrl } = req.body;
    if (!title || !url) return validationError(res, 'title and url are required.');

    const seedParam = url.includes('/seed/')
      ? url.split('/seed/')[1].split('/')[0]
      : `photo${Date.now()}`;

    const photo = await Photo.create({
      albumId: album._id,
      title,
      url,
      thumbnailUrl: thumbnailUrl || `https://picsum.photos/seed/${seedParam}/150/150`,
    });
    invalidatePath('/albums');
    await User.findByIdAndUpdate(req.user.id, { $set: { lastActivityAt: new Date() } });
    logActivity(req.user.id, 'CREATE', 'photo', photo._id, photo.title);
    return created(res, photo, 'Photo added.');
  } catch (error) {
    next(error);
  }
};

const deletePhoto = async (req, res, next) => {
  try {
    const album = req.resource;
    const photo = await Photo.findOne({ _id: req.params.photoId, albumId: album._id, isDeleted: false });
    if (!photo) return notFound(res, 'Photo not found.');
    const { title: photoTitle, _id: photoId } = photo;
    photo.isDeleted = true;
    await photo.save();
    invalidatePath('/albums');
    await User.findByIdAndUpdate(req.user.id, { $set: { lastActivityAt: new Date() } });
    logActivity(req.user.id, 'DELETE', 'photo', photoId, photoTitle);
    return deleted(res, 'Photo deleted.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAlbums, getAlbumById, createAlbum, updateAlbum, deleteAlbum, getAlbumPhotos, addPhoto, deletePhoto };
