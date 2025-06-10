## Authorization

Authorization is implemented using middleware that checks:

1. User authentication status (valid JWT token)
2. Role-based access (admin vs regular user)
3. Resource ownership (creator/assignee of tasks, leaves, etc.)
4. Geolocation validity (for attendance check-ins)

Example middleware:
```typescript
// Authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction)# Employee Management & Attendance System API

A comprehensive backend API for managing employees, attendance tracking, leave management, geolocation-based check-ins, task assignment, and more in a modern workplace environment.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [Users](#users)
  - [Attendance](#attendance)
  - [Leave Management](#leave-management)
  - [Manual Attendance Requests](#manual-attendance-requests)
  - [Holidays](#holidays)
  - [Geofences](#geofences)
  - [Projects](#projects)
  - [Tasks](#tasks)
  - [Notifications](#notifications)
- [Contributing](#contributing)
- [License](#license)

## Overview

This Employee Management & Attendance System API provides a complete backend solution for workforce management, attendance tracking with geolocation verification, leave management, task assignment, and more. The system supports role-based access control, QR code-based attendance, and comprehensive reporting features.

## Features

### 🔐 Authentication & Security
- Secure login and registration system
- User role-based access control (Admin and Employee)
- Registration verification using email
- Employee ID cards with QR codes for attendance

### 📱 Dashboard
- Employee-specific dashboard with profile information
- Live working hours counter for current shift
- Quick access to attendance history and leave requests
- Admin dashboard with organizational overview and statistics

### ⏱️ Attendance Management
- QR code-based attendance tracking
- Geolocation verification to ensure on-site check-ins
- Real-time working hours calculation
- Smart checkout with reasons for extended hours
- Auto-checkout feature for missed checkouts at midnight
- Manual attendance request system for forgotten check-ins/outs
- Admin configurable late attendance threshold
- Attendance history with filtering options
- Export attendance data to PDF/Excel

### 📅 Leave Management
- Multiple leave types (Sick, Casual, Paid, Unpaid, Vacation, Personal)
- Remaining leave balance tracking
- Leave request approval workflow
- Leave history with status indicators
- Multi-day leave selection

### 🗓️ Calendar Integration
- Team-wide calendar showing all events
- Employee birthdays displayed on calendar
- Company holidays and events management
- Holiday definition and management by admins
- Leave requests visualization
- Admin can add, edit, and delete events
- Support for swappable holidays management
- Multiple events per date

### 📊 Analytics & Reporting
- Attendance analytics with visual charts
- Department-wise attendance statistics
- Leave utilization reports
- Exportable data for further analysis

### 📍 Location Management
- Integration with OpenLayers for maps
- Geofencing to restrict check-ins to office locations
- Location accuracy validation
- Multiple office locations support
- Configurable geofence settings by admin

### ⚙️ System Administration
- Employee management (add, edit, view)
- User account management (roles, passwords, profiles)
- Attendance settings configuration
  - Configurable attendance thresholds (late time, grace period)
  - Auto-checkout settings
- Manual attendance request approval
- Leave request approval
- Holiday management (add, edit, delete)
- Organizational settings management

### 📝 Project & Task Management
- Create and manage projects
- Assign tasks to employees
- Track task progress and status
- Task prioritization and deadline management
- Task completion tracking

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Sequelize
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Maps Integration**: OpenLayers
- **QR Code Generation**: QRCode.js
- **File Export**: ExcelJS, PDFKit

## Getting Started

### Prerequisites

- Node.js (v14.x or higher)
- npm (v6.x or higher)
- PostgreSQL (v12.x or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/task-management-api.git
   cd task-management-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npm run db:create
   npm run db:migrate
   npm run db:seed  # Optional - adds sample data
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=employee_management
DB_USER=postgres
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Geolocation Settings
GEO_ACCURACY_THRESHOLD=100 # in meters
DEFAULT_GEOFENCE_RADIUS=200 # in meters

# Attendance Settings
WORKING_HOURS_PER_DAY=8
LATE_THRESHOLD=30 # in minutes
AUTO_CHECKOUT_TIME=23:59
ATTENDANCE_GRACE_PERIOD=15 # in minutes

```

## API Endpoints

### Authentication

| Method | Endpoint           | Description             | Request Body                        | Response                        |
|--------|-------------------|-------------------------|------------------------------------|---------------------------------|
| POST   | `/api/auth/register` | Register a new user   | `{name, email, password}`          | `{user, token}`                 |
| POST   | `/api/auth/login`    | Login existing user   | `{email, password}`                | `{user, token}`                 |
| GET    | `/api/auth/profile`  | Get current user profile | -                               | `{user}`                        |

### Users

| Method | Endpoint                    | Description                | Access      | Request Body              | Response                 |
|--------|----------------------------|----------------------------|-------------|--------------------------|--------------------------|
| GET    | `/api/users`                | Get all users              | Admin       | -                        | `{users: [...]}`         |
| GET    | `/api/users/:id`            | Get user by ID             | Admin/Self  | -                        | `{user}`                 |
| PUT    | `/api/users/:id`            | Update user                | Admin/Self  | `{name, email, ...}`     | `{user}`                 |
| PUT    | `/api/users/update-role/:id`| Update user role           | Admin       | `{role}`                 | `{user}`                 |
| PUT    | `/api/users/change-password/:id` | Change password       | Admin/Self  | `{currentPassword, newPassword}` | `{message}`     |
| DELETE | `/api/users/:id`            | Delete user                | Admin       | -                        | `{message}`              |

### Attendance

| Method | Endpoint                           | Description                     | Access           | Request Body                         | Response                      |
|--------|-----------------------------------|----------------------------------|------------------|-------------------------------------|-------------------------------|
| POST   | `/api/attendance/check-in`         | Employee clock in               | Authenticated    | `{location, qrCode}`                | `{attendance}`                |
| POST   | `/api/attendance/check-out`        | Employee clock out              | Authenticated    | `{location, reason?}`               | `{attendance}`                |
| GET    | `/api/attendance/my-records`       | Get personal attendance history | Authenticated    | -                                   | `{records: [...]}`            |
| GET    | `/api/attendance/today`            | Get today's attendance          | Authenticated    | -                                   | `{attendance}`                |
| GET    | `/api/attendance/`                 | Get all employee attendance     | Admin            | -                                   | `{records: [...]}`            |
| GET    | `/api/attendance/employee/:employeeId` | Get attendance by employee  | Admin            | -                                   | `{records: [...]}`            |
| GET    | `/api/attendance/date/:date`       | Get attendance by date          | Admin            | -                                   | `{records: [...]}`            |
| POST   | `/api/attendance/manually-update`  | Manually edit attendance        | Admin            | `{employeeId, date, checkIn, checkOut}` | `{attendance}`            |
| DELETE | `/api/attendance/delete/:id`       | Delete attendance record        | Admin            | -                                   | `{message}`                   |

### Leave Management

| Method | Endpoint                       | Description                    | Access           | Request Body                                       | Response                    |
|--------|-------------------------------|--------------------------------|------------------|---------------------------------------------------|------------------------------|
| POST   | `/api/leaves/`                 | Apply for leave                | Authenticated    | `{startDate, endDate, type, reason}`              | `{leave}`                    |
| GET    | `/api/leaves/my-leaves`        | Get personal leave history     | Authenticated    | -                                                 | `{leaves: [...]}`            |
| DELETE | `/api/leaves/:id`              | Cancel leave request           | Authenticated    | -                                                 | `{message}`                  |
| GET    | `/api/leaves/`                 | Get all leaves                 | Admin            | -                                                 | `{leaves: [...]}`            |
| GET    | `/api/leaves/pending`          | Get pending leave requests     | Admin            | -                                                 | `{leaves: [...]}`            |
| PUT    | `/api/leaves/:id/status`       | Update leave status            | Admin            | `{status, comment?}`                              | `{leave}`                    |

### Manual Attendance Requests

| Method | Endpoint                         | Description                        | Access           | Request Body                                  | Response                    |
|--------|---------------------------------|-------------------------------------|------------------|----------------------------------------------|------------------------------|
| POST   | `/api/manual-requests/`          | Submit manual attendance request    | Authenticated    | `{date, checkIn, checkOut, reason}`          | `{request}`                  |
| GET    | `/api/manual-requests/my-requests`| Get personal manual requests       | Authenticated    | -                                            | `{requests: [...]}`          |
| DELETE | `/api/manual-requests/:id`       | Cancel manual request               | Authenticated    | -                                            | `{message}`                  |
| GET    | `/api/manual-requests/`          | Get all manual requests             | Admin            | -                                            | `{requests: [...]}`          |
| GET    | `/api/manual-requests/pending`   | Get pending manual requests         | Admin            | -                                            | `{requests: [...]}`          |
| PUT    | `/api/manual-requests/:id/process`| Process manual request             | Admin            | `{status, comment?}`                         | `{request}`                  |

### Holidays

| Method | Endpoint                      | Description                   | Access           | Request Body                                | Response                    |
|--------|-----------------------------|-------------------------------|------------------|------------------------------------------|------------------------------|
| GET    | `/api/holidays/`              | Get all holidays              | Authenticated    | -                                          | `{holidays: [...]}`          |
| GET    | `/api/holidays/:id`           | Get holiday by ID             | Admin            | -                                          | `{holiday}`                  |
| POST   | `/api/holidays/`              | Create holiday                | Admin            | `{name, date, isOptional, description}`    | `{holiday}`                  |
| PUT    | `/api/holidays/:id`           | Update holiday                | Admin            | `{name, date, isOptional, description}`    | `{holiday}`                  |
| DELETE | `/api/holidays/:id`           | Delete holiday                | Admin            | -                                          | `{message}`                  |

### Geofences

| Method | Endpoint                     | Description                    | Access           | Request Body                                | Response                    |
|--------|----------------------------|--------------------------------|------------------|------------------------------------------|------------------------------|
| GET    | `/api/geofences/`            | Get all geofences              | Authenticated    | -                                          | `{geofences: [...]}`         |
| POST   | `/api/geofences/check-location` | Check if location in geofence | Authenticated | `{latitude, longitude}`                    | `{isWithin, nearestGeofence}`|
| GET    | `/api/geofences/:id`         | Get geofence by ID             | Admin            | -                                          | `{geofence}`                 |
| POST   | `/api/geofences/`            | Create geofence                | Admin            | `{name, coordinates, radius, address}`     | `{geofence}`                 |
| PUT    | `/api/geofences/:id`         | Update geofence                | Admin            | `{name, coordinates, radius, address}`     | `{geofence}`                 |
| DELETE | `/api/geofences/:id`         | Delete geofence                | Admin            | -                                          | `{message}`                  |

### Projects

| Method | Endpoint                       | Description                   | Access           | Request Body                                | Response                    |
|--------|-------------------------------|-------------------------------|------------------|------------------------------------------|------------------------------|
| GET    | `/api/projects`                | Get all projects              | Authenticated    | -                                          | `{projects: [...]}`          |
| GET    | `/api/projects/:id`            | Get project by ID             | Authenticated    | -                                          | `{project}`                  |
| POST   | `/api/projects`                | Create new project            | Admin            | `{name, description, dueDate, ...}`        | `{project}`                  |
| PUT    | `/api/projects/:id`            | Update project                | Admin            | `{name, description, dueDate, ...}`        | `{project}`                  |
| DELETE | `/api/projects/:id`            | Delete project                | Admin            | -                                          | `{message}`                  |

### Tasks

| Method | Endpoint                       | Description                   | Access              | Request Body                                | Response                    |
|--------|-------------------------------|-------------------------------|---------------------|------------------------------------------|------------------------------|
| GET    | `/api/tasks`                   | Get all tasks                 | Authenticated       | -                                          | `{tasks: [...]}`             |
| GET    | `/api/tasks/my-tasks`          | Get tasks assigned to me      | Authenticated       | -                                          | `{tasks: [...]}`             |
| GET    | `/api/tasks/:id`               | Get task by ID                | Authenticated       | -                                          | `{task}`                     |
| POST   | `/api/tasks`                   | Create new task               | Admin               | `{title, description, assignedTo, projectId, ...}` | `{task}`              |
| PATCH  | `/api/tasks/:id/status`        | Update task status            | Admin/Assignee      | `{status}`                                 | `{task}`                     |
| PUT    | `/api/tasks/:id`               | Update task                   | Admin               | `{title, description, assignedTo, ...}`    | `{task}`                     |
| DELETE | `/api/tasks/:id`               | Delete task                   | Admin               | -                                          | `{message}`                  |

### Notifications

| Method | Endpoint                      | Description                      | Access           | Request Body                                | Response                    |
|--------|------------------------------|----------------------------------|------------------|------------------------------------------|------------------------------|
| GET    | `/api/notifications`          | Get user notifications            | Authenticated    | -                                          | `{notifications: [...]}`     |
| GET    | `/api/notifications/unread-count` | Get unread notification count | Authenticated    | -                                          | `{count}`                    |
| PATCH  | `/api/notifications/mark-all-read` | Mark all notifications read  | Authenticated    | -                                          | `{message}`                  |
| DELETE | `/api/notifications/delete-all-read` | Delete all read notifications | Authenticated | -                                        | `{message}`                  |
| PATCH  | `/api/notifications/:id/read` | Mark notification as read        | Authenticated    | -                                          | `{notification}`             |
| DELETE | `/api/notifications/:id`      | Delete notification              | Authenticated    | -                                          | `{message}`                  |
| POST   | `/api/notifications`          | Create single notification       | Admin            | `{userId, title, message, type}`           | `{notification}`             |
| POST   | `/api/notifications/all`      | Create notification for all users | Admin           | `{title, message, type}`                   | `{count, message}`           |
| POST   | `/api/notifications/bulk`     | Create notifications for multiple users | Admin     | `{userIds: [], title, message, type}`      | `{count, message}`           |


## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.