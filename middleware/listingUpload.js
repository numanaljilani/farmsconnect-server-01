// /src/middleware/listingUpload.js

import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { cloudinary } from '../config/cloudinary.js'; // <-- IMPORT CONFIGURED CLOUDINARY

// Storage Configuration for Listings
const listingStorage = new CloudinaryStorage({
  cloudinary,
  // The 'params' function provides context (req, file) for dynamic settings
  params: async (req, file) => {
    const folder = 'farmsconnect_listings'; // Dedicated folder
    
    // Create a unique public ID
    const publicId = `${file.fieldname}-${Date.now()}`; 
    
    return {
      folder: folder,
      // Use req.userId from the authMiddleware to tag the image owner
      tags: req.userId ? [`user_${req.userId}`, 'listing_image'] : ['listing_image'], 
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      public_id: publicId,
    };
  },
});

// Multer Setup using Cloudinary Storage
const listingUpload = multer({ storage: listingStorage });

// Export the fields-based middleware to be used in the router
export const uploadListingImages = listingUpload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'additionalImages', maxCount: 4 },
]);