# FarmsConnect Server

A scalable Node.js server for FarmsConnect, supporting user registration with email/password and Google OAuth, with profile images stored in Cloudinary.

## Setup

1. **Install Dependencies**:
   npm install


Configure Environment Variables:Create a .env file in the root directory:
PORT=5000
MONGO_URI=mongodb://localhost:27017/farmsconnect
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000


Run the Server:

Development: npm run dev (uses nodemon)
Production: npm start



API Endpoints

POST /api/auth/signup

Content-Type: multipart/form-data
Fields: name, email, password, profileImage (file)
Response: { token, user: { id, name, email, profileImage } }


GET /api/auth/google

Initiates Google OAuth flow.


GET /api/auth/google/callback

Handles Google OAuth callback, redirects to frontend with JWT.



Scalability

Uses Node.js cluster module to utilize multiple CPU cores.
Modular structure supports microservices (e.g., separate auth service).
Winston logger for centralized logging.
MongoDB for data persistence, Cloudinary for image storage.

Future Improvements

Add rate limiting with express-rate-limit.
Implement Redis for session management.
Containerize with Docker for microservices deployment.
Add more authentication methods (e.g., Facebook, email OTP).


