import Listing from '../models/Listing.js';
import mongoose from 'mongoose';

// --- Helper function for image paths (MOCK) ---
const getImageUrl = (file) => {
    // IMPORTANT: Placeholder for your actual cloud/local storage URL
    return file ? `/uploads/${file.filename}` : 'default-image.jpg';
};

// =========================================================
// CRUD Operations
// =========================================================

/**
 * @desc Create a new listing
 * @route POST /api/listings
 * @access Private
 */
export const createListing = async (req, res) => {
    // 1. Destructure text fields from req.body (now populated by Multer)
    const { title, description, price, quantity, category, subcategory, location, lat, lng } = req.body;
    
    // 2. Destructure uploaded files from req.files (populated by multer.fields)
    // Multer populates req.files with an object keyed by the field name.
    const mainImageFile = req.files.mainImage ? req.files.mainImage[0] : null;
    const additionalImagesFiles = req.files.additionalImages || [];

    const userId = req.userId; // Using req.userId from your auth middleware
    
    const parsedPrice = parseFloat(price);
    const parsedQuantity = parseInt(quantity, 10);
    
    // --- Extract Cloudinary URLs ---
    const mainImagePath = mainImageFile ? mainImageFile.path : 'default-image.jpg';
    // Note: .path contains the secure Cloudinary URL after upload
    const additionalImagePaths = additionalImagesFiles
        .slice(0, 4)
        .map(file => file.path);
    // -----------------------------

    try {
        const newListing = await Listing.create({
            userId: new mongoose.Types.ObjectId(userId),
            title,
            description,
            price: parsedPrice,
            quantity: parsedQuantity,
            category,
            subcategory,
            location,
            mainImage: mainImagePath, // Use the Cloudinary URL
            additionalImages: additionalImagePaths, // Use the Cloudinary URLs
            coordinates: (lat && lng) ? {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)],
            } : undefined,
        });

        res.status(201).json({ success: true, data: newListing });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error.message || 'Listing creation failed' });
    }
};

// 🆕 NEW API FUNCTION: Get Single Listing Details
/**
 * @desc Get single listing details by ID
 * @route GET /api/listings/:id
 * @access Public
 */
export const getListingDetails = async (req, res) => {
    try {
        const listingId = req.params.id;

        // 1. Validate ID (optional but recommended)
        if (!mongoose.Types.ObjectId.isValid(listingId)) {
            return res.status(400).json({ success: false, message: 'Invalid listing ID format' });
        }

        // 2. Find the listing by ID
        // Note: You might want to use .populate('userId', 'name email') 
        //       here to include seller details, but this example keeps it simple.
        const listing = await Listing.findById(listingId).select('-__v').populate("userId"); 

        // 3. Check if listing exists
        if (!listing) {
            return res.status(404).json({ success: false, message: 'Listing not found' });
        }

        // 4. Send success response
        res.status(200).json({ success: true, data: listing });

    } catch (error) {
        console.error('Error fetching listing details:', error);
        res.status(500).json({ success: false, message: 'Server error fetching listing details' });
    }
};
// ----------------------------------------------------


/**
 * @desc Update a listing
 * @route PUT /api/listings/:id
 * @access Private (Ownership Check)
 */
export const updateListing = async (req, res) => {
    try {
        let listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        // Check ownership against req.userId
        if (listing.userId.toString() !== req.userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this listing' });
        }

        const updatedListing = await Listing.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ success: true, data: updatedListing });
    } catch (error) {
        res.status(400).json({ message: 'Listing update failed' });
    }
};

/**
 * @desc Delete a listing
 * @route DELETE /api/listings/:id
 * @access Private (Ownership Check)
 */
export const deleteListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        // Check ownership against req.userId
        if (listing.userId.toString() !== req.userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this listing' });
        }

        await listing.deleteOne();
        res.status(200).json({ success: true, message: 'Listing successfully deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Listing deletion failed' });
    }
};

/**
 * @desc Get all listings by the authenticated user
 * @route GET /api/listings/my
 * @access Private
 */
export const getMyListings = async (req, res) => {
    const userId = req.userId; // Using req.userId from your middleware

    try {
        const listings = await Listing.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: listings.length, data: listings });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching my listings' });
    }
};

// =========================================================
// Search and Filter API
// =========================================================

/**
 * @desc Get all listings with search, filtering, and sorting
 * @route GET /api/listings
 * @access Public
 */
export const getListings = async (req, res) => {
    try {
        const { search, category, subcategory, sortBy, priceOrder, dateOrder, lat, lng, radius } = req.query;
        let query = {};
        let sort = {};

        // 1. Search (Title, Description, Location)
        if (search) {
            query.$text = { $search: search };
        }
        
        // 2. Category/Subcategory Filter
        if (category) {
            query.category = category;
        }
        if (subcategory) {
            query.subcategory = subcategory;
        }

        // 3. Geospatial Search by Location (Optional)
        if (lat && lng && radius) {
            const radiusMeters = parseFloat(radius) * 1000;
            
            query.coordinates = {
                $geoWithin: {
                    $centerSphere: [
                        [parseFloat(lng), parseFloat(lat)],
                        radiusMeters / 6378137,
                    ],
                },
            };
        }

        // 4. Sorting Options
        if (sortBy === 'price') {
            sort.price = priceOrder === 'lowToHigh' ? 1 : -1; // Ascending (1) or Descending (-1)
        } else if (sortBy === 'date') {
            sort.createdAt = dateOrder === 'oldestToLatest' ? 1 : -1; // Ascending (1) or Descending (-1)
        } else {
             sort.createdAt = -1; // Default: Latest to Oldest
        }
        
        // 5. Execute Query
        const listings = await Listing.find(query)
            .sort(sort)
            .select('-__v');

        res.status(200).json({ success: true, count: listings.length, data: listings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during search and filter' });
    }
};