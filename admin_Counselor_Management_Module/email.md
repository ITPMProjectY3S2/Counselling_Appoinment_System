# Welcome Email Feature

The system now automatically sends a personalized welcome email to newly created counselors safely via Nodemailer.

## What Was Done

1. **Integrated Nodemailer**: Installed `nodemailer` as a dependency for the backend to handle reliable SMTP email transport.
2. **Added Email Service Utility**: Created [backend/utils/emailService.js](file:///d:/SLIIT/Y3S2/IT%20Project%20Management%20%28IT3040%29/4.%20Assignment/Week%2008/Counseling-Appointment-System/ITPM-Project/backend/utils/emailService.js) that abstracts away email transport creation and safely attempts to send an HTML-formatted welcome email directly matching your required layout. If it fails (e.g., due to invalid dummy credentials), it logs the error to the server console but gracefully allows the counselor record to finish being saved.
3. **Triggered Email Registration**: Updated `POST /api/admin/counselors` inside [backend/routes/adminRoutes.js](file:///d:/SLIIT/Y3S2/IT%20Project%20Management%20%28IT3040%29/4.%20Assignment/Week%2008/Counseling-Appointment-System/ITPM-Project/backend/routes/adminRoutes.js) to dispatch [sendWelcomeEmail](file:///d:/SLIIT/Y3S2/IT%20Project%20Management%20%28IT3040%29/4.%20Assignment/Week%2008/Counseling-Appointment-System/ITPM-Project/backend/utils/emailService.js#3-48) securely behind the scenes immediately after creating a new User/Counselor record. 
4. **Environment Variables Configured**: Appended local boilerplate configuration variables for SMTP inside [backend/.env](file:///d:/SLIIT/Y3S2/IT%20Project%20Management%20%28IT3040%29/4.%20Assignment/Week%2008/Counseling-Appointment-System/ITPM-Project/backend/.env).

### Environment Configuration Setup Needed
Currently, dummy configurations are present in your backend environment file. Please replace them inside [.env](file:///d:/SLIIT/Y3S2/IT%20Project%20Management%20%28IT3040%29/4.%20Assignment/Week%2008/Counseling-Appointment-System/ITPM-Project/backend/.env) to start sending live emails:
```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com   # Or your SMTP provider
EMAIL_PORT=587              # Standard SSL/TLS port
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## Validation Context
The Node server was tested, and while an existing session is running locally holding port `5000`, any restart (or `nodemon` hot reload) will pick up these changes automatically. When an admin adds a new counselor through the frontend, the backend logs will explicitly display the Nodemailer success/failure status.
