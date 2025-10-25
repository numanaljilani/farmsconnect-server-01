import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
  },
  profileImage: {
    type: String,
    default: '',
  },
  googleId: {
    type: String,
  },
}, {
  timestamps: true,
});

export default mongoose.model('User', userSchema);