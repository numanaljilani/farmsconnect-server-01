import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'] },
  slug: { type: String, required: [true, 'Slug is required'], unique: true },
  icon: { type: String },
  subcategories: [{ type: String }],
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);