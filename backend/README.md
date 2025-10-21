# Blogify - Backend
Express + MongoDB + Cloudinary (optional) + JWT auth

.env variables: see .env.example
Routes:
- POST /api/auth/register {name,email,password}
- POST /api/auth/login {email,password}
- GET /api/posts
- POST /api/posts {title,content,imageUrl} (auth)
- GET /api/posts/:id
- POST /api/posts/:id/comments {text} (auth)
- POST /api/upload (multipart form-data with 'image') -> returns {url}

Deploy notes: set MONGODB_URI, JWT_SECRET, CLOUDINARY_* on host (Render/Heroku).
