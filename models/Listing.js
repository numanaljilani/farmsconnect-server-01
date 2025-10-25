// /src/models/Listing.js

import mongoose from 'mongoose';

const ListingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  category: {
    type: String,
    required: true,
    index: true,
  },
  subcategory: {
    type: String,
    required: true,
    index: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  mainImage: {
    type: String,
    required: true,
  },
  additionalImages: {
    type: [String],
    default: [],
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere',
      required: false,
    },
  },
}, { timestamps: true });

ListingSchema.index({ title: 'text', description: 'text', location: 'text' });

const Listing = mongoose.model('Listing', ListingSchema);

export default Listing;