# Serverless Task Management System

A serverless task management application built with AWS services and React.

## 🚀 Features

- **User Authentication**: Secure signup/login with AWS Cognito
- **Role-Based Access Control**: Admin and Member roles with different permissions
- **Task Management**: Create, assign, update, and close tasks
- **Real-time Notifications**: Email notifications via AWS SES
- **Serverless Architecture**: Built on AWS Lambda, API Gateway, and DynamoDB

## 🏗️ Architecture

### Backend
- **API Gateway**: RESTful API endpoints
- **Lambda Functions**: Serverless compute for business logic
- **DynamoDB**: NoSQL database for tasks and assignments
- **Cognito**: User authentication and authorization
- **SES**: Email notification service

### Frontend
- **React**: Modern UI framework
- **Vite**: Fast build tool
- **AWS Amplify**: Automated deployment and hosting
- **Axios**: HTTP client for API calls

## 📋 API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user info
- `POST /auth/refresh` - Refresh access token

### Tasks
- `GET /tasks` - Get all tasks (Admin only)
- `GET /tasks/assigned` - Get assigned tasks
- `POST /tasks` - Create new task (Admin only)
- `PUT /tasks/{id}` - Update task
- `POST /tasks/{id}/assign` - Assign task to user (Admin only)
- `POST /tasks/{id}/close` - Close task (Admin only)

## 🛠️ Technology Stack

**Backend:**
- Node.js 18.x
- AWS Lambda
- AWS API Gateway
- AWS DynamoDB
- AWS Cognito
- AWS SES

**Frontend:**
- React 19.2.0
- React Router DOM v6
- Axios
- Vite 7.3.1

**Infrastructure:**
- Terraform (IaC)
- AWS Amplify

## 🚦 Getting Started

### Prerequisites
- AWS Account
- Node.js 18.x or higher
- Terraform 1.0+
- GitHub account

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/KofiAckah/serverless-task-management.git
   cd serverless-task-management
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Update .env with your API Gateway URL and Cognito details
   ```

4. **Run frontend locally**
   ```bash
   npm run dev
   ```

### Deployment

1. **Configure Terraform variables**
   ```bash
   cd infrastructure/terraform
   cp dev.tfvars.example dev.tfvars
   # Update dev.tfvars with your configuration
   ```

2. **Deploy infrastructure**
   ```bash
   terraform init
   terraform plan -var-file="dev.tfvars"
   terraform apply -var-file="dev.tfvars"
   ```

3. **Frontend deployment**
   - Automatically deployed via AWS Amplify on push to main branch

## 👥 User Roles

### Admin
- View all tasks
- Create new tasks
- Assign tasks to members
- Close tasks
- View all user information

### Member
- View assigned tasks
- Update task status
- View own task details

## 📧 Email Configuration

The system uses AWS SES for email notifications. Ensure your sender email is verified in SES:
- Development: SES Sandbox (verified emails only)
- Production: Request SES production access

## 🔒 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Email domain validation
- Secure password requirements (8+ characters)
- Environment-based configuration

## 📂 Project Structure

```
serverless-task-management/
├── backend/                  # Lambda functions and handlers
│   ├── src/
│   │   ├── handlers/        # Lambda function handlers
│   │   ├── utils/           # Utility functions
│   │   └── router.js        # API Gateway routing logic
│   └── package.json
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── context/         # React Context (Auth)
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   ├── utils/           # Helper functions
│   │   └── config/          # Configuration
│   └── package.json
├── infrastructure/           # Terraform IaC
│   └── terraform/
│       ├── modules/         # Terraform modules
│       └── *.tf             # Terraform configuration
└── README.md
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm run test
```

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Joel Ackah - AmaliTech Training Program

## 🙏 Acknowledgments

- AWS for serverless infrastructure
- React community
- Terraform for IaC capabilities
