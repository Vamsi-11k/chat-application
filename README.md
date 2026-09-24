# Real-Time Chat Application

A full-stack real-time chat application built with React, Node.js, Express, Socket.io, TailwindCSS, and MongoDB Atlas.

---

## 🌟 Features

- **Real-Time Messaging**: Instant peer-to-peer and room chat updates powered by Socket.io.
- **Secure Authentication**: JWT-based authentication with Access and Refresh tokens stored in HTTP-only cookies.
- **Friend Management**: Send, accept, reject friend requests, and manage friend lists.
- **Online Status Tracking**: Real-time indicators showing online and offline users.
- **Modern UI / UX**: Responsive, dark/light themed interface styled with Tailwind CSS, Lucide icons, and toast notifications.
- **Input Validation & Security**: Form validation using Zod and React Hook Form; Helmet and Mongo Sanitize for API protection.

---

## 🛠️ Tech Stack

### Frontend (`client/`)
- **React 18** (Vite)
- **Tailwind CSS**
- **Socket.io Client**
- **Axios** (with automatic token refresh interceptors)
- **React Hook Form** + **Zod**
- **Lucide Icons** & **React Hot Toast**

### Backend (`server/`)
- **Node.js** & **Express.js** (ES Modules)
- **Socket.io**
- **MongoDB Atlas** with **Mongoose**
- **JSON Web Tokens (JWT)** & **bcryptjs**
- **Helmet**, **CORS**, **express-mongo-sanitize**

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account or a local MongoDB database

### 1. Clone the repository
```bash
git clone https://github.com/Vamsi-11k/chat-application.git
cd chat-application
```

### 2. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory (see `server/.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_ACCESS_SECRET=your_jwt_access_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
CLIENT_URL=http://localhost:5173
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
In a new terminal:
```bash
cd client
npm install
```
Create a `.env` file in the `client` directory (see `client/.env.example`):
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```
Start the frontend development server:
```bash
npm run dev
```

---

## 🌐 Deployment Instructions

### Frontend (e.g. Vercel / Netlify / Render)
1. Set the root directory to `client`.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set Environment Variables:
   - `VITE_API_URL`: `https://<your-backend-domain>/api`
   - `VITE_SOCKET_URL`: `https://<your-backend-domain>`

### Backend (e.g. Render / Railway / Heroku)
1. Set the root directory to `server`.
2. Build command: `npm install`
3. Start command: `node src/server.js` (or `npm start`)
4. Set Environment Variables:
   - `PORT`: `5000` (or provided by host)
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: your MongoDB Atlas URI
   - `JWT_SECRET`: strong random secret
   - `JWT_ACCESS_SECRET`: strong random secret
   - `JWT_REFRESH_SECRET`: strong random secret
   - `CLIENT_URL`: `https://<your-frontend-domain>`

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
