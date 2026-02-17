# Task Management Frontend

Modern React + Vite frontend for the Serverless Task Management System.

## Features

- ✨ Modern, clean UI with gradient accents
- 🔐 AWS Cognito authentication
- 🎭 Role-based access control (Admin/Member)
- 📱 Fully responsive design
- 🎨 Beautiful animations and transitions
- 🔍 Real-time task search and filtering
- 📊 Interactive statistics dashboard

## Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- Backend API deployed and running

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Copy `.env.example` to `.env` and update with your values:
   ```bash
   cp .env.example .env
   ```

   Update the following in `.env`:
   - `VITE_API_BASE_URL`: Your API Gateway URL
   - `VITE_COGNITO_USER_POOL_ID`: Your Cognito User Pool ID
   - `VITE_COGNITO_CLIENT_ID`: Your Cognito Client ID
   - `VITE_AWS_REGION`: AWS region (default: eu-west-1)

3. **Start development server:**
   ```bash
   npm run dev
   ```

   The app will open at `http://localhost:3000`

## Build for Production

```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── TaskCard.jsx     # Task card component
│   │   ├── CreateTaskModal.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/               # Page components
│   │   ├── auth/            # Authentication pages
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   └── Dashboard.jsx    # Main dashboard
│   ├── context/             # React Context
│   │   └── AuthContext.jsx  # Authentication state
│   ├── services/            # API services
│   │   ├── api.js           # Axios client
│   │   └── taskService.js   # Task operations
│   ├── config/              # Configuration
│   │   ├── aws-config.js    # AWS Amplify config
│   │   └── constants.js     # App constants
│   ├── App.jsx              # Main app component
│   ├── App.css              # App styles
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── .env                     # Environment variables
├── .env.example             # Example env file
├── package.json
├── vite.config.js
└── index.html
```

## User Guide

### Registration

1. Click "Create one now" on login page
2. Fill in your details (use @amalitech.com or @amalitechtraining.org email)
3. Enter the confirmation code sent to your email
4. You'll be automatically logged in

### Login

1. Enter your email and password
2. Click "Sign In"

### Dashboard

**Admin Users:**
- Create new tasks using the "Create Task" button
- View all tasks in the system
- Update task status and details
- Filter tasks by status
- Search tasks by title/description

**Member Users:**
- View tasks assigned to you
- Update status of your assigned tasks
- Search and filter your tasks

### Task Management

**Creating Tasks (Admin only):**
1. Click "Create Task"
2. Fill in title, description, priority, and due date
3. Click "Create Task"

**Updating Tasks:**
1. Click the three dots menu on a task card
2. Choose "Edit Task" to update details
3. Choose "Start Task" to change status to In Progress
4. Choose "Close Task" to mark as completed

**Task Statuses:**
- 🟡 **Open**: Newly created tasks
- 🔵 **In Progress**: Tasks being worked on
- 🟢 **Closed**: Completed tasks

**Priority Levels:**
- Low, Medium, High

## Authentication Flow

1. User registers with email (domain validation enforced)
2. Confirmation code sent to email
3. User confirms email
4. User can login
5. JWT tokens stored securely
6. Role-based access enforced

## API Integration

The frontend communicates with the backend API for:
- User authentication (via Cognito)
- Task CRUD operations
- Task assignment
- Status updates

All API requests include JWT token in Authorization header.

## Role-Based Features

### Admin
- ✅ Create tasks
- ✅ View all tasks
- ✅ Update any task
- ✅ Close tasks
- ✅ Assign tasks (future feature)

### Member
- ✅ View assigned tasks
- ✅ Update task status
- ✅ Search/filter tasks
- ❌ Cannot create tasks
- ❌ Cannot view all tasks

## Technology Stack

- **Framework**: React 18
- **Build Tool**: Vite 5
- **Routing**: React Router 6
- **Authentication**: AWS Amplify Auth
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Styling**: CSS3 with CSS Variables

## Troubleshooting

### "Network Error" on API calls
- Check your `.env` file has correct API URL
- Ensure backend API is running
- Check CORS configuration on API Gateway

### "Unauthorized" errors
- Your session may have expired, try logging out and back in
- Check Cognito User Pool configuration
- Ensure user is in correct Cognito group (Admin/Member)

### Email domain error
- Only @amalitech.com and @amalitechtraining.org emails are allowed
- This is enforced by the pre-signup Lambda trigger

### Tasks not loading
- Check browser console for errors
- Verify API Gateway URL is correct
- Ensure you're logged in with valid credentials

## Design Features

- **Modern Gradient UI**: Purple/blue gradient theme
- **Smooth Animations**: Fade-in, slide-up effects
- **Responsive**: Works on mobile, tablet, and desktop
- **Interactive Stats**: Clickable stat cards for quick filtering
- **Clean Typography**: Optimized for readability
- **Accessible**: WCAG compliant color contrasts

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | API Gateway endpoint | `https://xxxxx.execute-api.eu-west-1.amazonaws.com/dev` |
| `VITE_COGNITO_USER_POOL_ID` | Cognito User Pool ID | `eu-west-1_xxxxxxxxx` |
| `VITE_COGNITO_CLIENT_ID` | Cognito Client ID | `xxxxxxxxxxxxxxxxxxxxxx` |
| `VITE_AWS_REGION` | AWS Region | `eu-west-1` |
| `VITE_APP_NAME` | Application Name | `Task Management System` |

## License

MIT

## Support

For issues or questions, please check:
- Backend API logs in CloudWatch
- Browser console for frontend errors
- Network tab for API request/response details
