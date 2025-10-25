// /src/routes/listingRoutes.js

import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { uploadListingImages } from '../middleware/listingUpload.js'; // <-- NEW IMPORT
import {
  createListing,
  updateListing,
  deleteListing,
  getListings,
  getMyListings,
  getListingDetails,
} from '../controllers/listingController.js';

const router = express.Router();

// --- Public Routes ---
router.get('/', getListings);
router.get('/:id', getListingDetails); 

// --- Protected Routes (Applying authMiddleware to all below) ---
router.use(authMiddleware);

// POST /api/listings
// Use the configured Multer middleware here. It processes the files and populates req.body.
router.post(
    '/',
    uploadListingImages, // <-- MULTER MIDDLEWARE GOES HERE
    createListing
); 

// GET /api/listings/my
router.get('/my', getMyListings);

// PUT /api/listings/:id
router.put('/:id', updateListing);

// DELETE /api/listings/:id
router.delete('/:id', deleteListing);

export default router;