# Integrated Counseling Management System

A unified, production-ready platform for managing counseling appointments, student well-being, and counselor schedules.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v16+)
- MongoDB Atlas account (or local MongoDB)

### 2. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your Environment Variables:
   Create a `.env` file in the `backend` directory with the following:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

### 3. Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### 4. Running the Application
You can run both the frontend and backend concurrently from the root directory:
```bash
npm install
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

### 5. Seeding the Admin Account
To create the initial administrator account, run the following command from the root:
```bash
npm run seed
```

## 🛠️ Features & Roles

### 👤 Admin
- Manage Counselors (Add/Edit/Delete)
- Manage Student Users
- View Comprehensive Analytics & Reports
- Manage Specialties

### 👨‍🏫 Counselor
- Set Availability Schedules
- Approve/Reject Appointment Requests
- Message Students
- View Appointment History

### 🎓 Student
- Search & Book Appointments by Specialty
- Real-time Notifications for Status Changes
- Private Messaging with Counselors
- Join Waitlist for Busy Slots

## 📁 Project Structure
- `/backend`: Express.js API, Mongoose Models, Auth Middleware, Email & Cron Utilities.
- `/frontend`: Vite + React UI, AuthContext, Protected Routes, Responsive Dashboards.
- `package.json`: Multi-module orchestration using `concurrently`.
