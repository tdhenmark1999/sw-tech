# SwissSpine Tech - Data Management System

A comprehensive data management system built with Angular 19 and Node.js, featuring external system configurations, planning tools, and data management capabilities.

## Features

- **External System Management**: Configure and manage external API connections with authentication
- **Planner Tool**: Create and manage data processing plans with funds, sources, runs, and reports
- **Data Management**: Manage dropdown data for sources, runs, reports, funds, and fund aliases
- **Responsive Design**: Collapsible sidebar with smooth animations
- **Pagination**: Full pagination support for all data views
- **Search & Filtering**: Real-time search and filtering capabilities
- **Validation**: Comprehensive form validation with custom validators

## Tech Stack

**Frontend:**
- Angular 19.2.8
- Angular Material
- TypeScript
- SCSS
- Standalone Components

**Backend:**
- Node.js
- Express.js
- SQLite Database
- Custom validation utilities

## Quick Start with Docker

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sw-tech
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:1337
   - Health Check: http://localhost:1337/health

### Individual Docker Containers

**Frontend:**
```bash
docker build -t swisspine-frontend .
docker run -p 3000:80 swisspine-frontend
```

**Backend:**
```bash
cd server
docker build -t swisspine-backend .
docker run -p 1337:1337 swisspine-backend
```

## Development Setup

### Prerequisites
- Node.js 22+
- npm or pnpm

### Installation

1. **Install frontend dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

### Development Servers

**Frontend (Angular):**
```bash
npm start
# or
ng serve
```
Access: http://localhost:4200

**Backend (Node.js):**
```bash
cd server
npm run dev
```
Access: http://localhost:1337

### Available Scripts

**Frontend:**
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run unit tests
- `npm run lint` - Lint code

**Backend:**
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## 🗄️ Database

The application uses SQLite database with the following structure:
- **Systems**: External API configurations with authentication details
- **Planners**: Planning configurations with funds, triggers, sources, runs, and reports
- **Dropdown Tables**: 
  - `dropdown_sources` - Data sources (Bloomberg, Reuters, etc.)
  - `dropdown_runs` - Run types (Daily, Weekly, Monthly)
  - `dropdown_reports` - Report types with categories (Financial, Risk, Performance)  
  - `dropdown_funds` - Available funds
  - `dropdown_fund_aliases` - Fund aliases linked to funds

Database file: `server/database.sqlite` (created automatically with sample data when server starts)

## 🔌 API Endpoints

### Systems
- `GET /api/systems` - Get all systems
- `POST /api/systems` - Create new system
- `PUT /api/systems/:id` - Update system
- `DELETE /api/systems/:id` - Delete system

### Planners
- `GET /api/planners` - Get all planners with pagination
- `POST /api/planners` - Create new planner
- `PUT /api/planners/:id` - Update planner
- `DELETE /api/planners/:id` - Delete planner

### Dropdown Data
- `GET /api/dropdown/:category` - Get dropdown data (sources, runs, reports, funds, fundAliases)
- `POST /api/dropdown/:category` - Save dropdown data

## 🎨 Features Overview

### External System Management
- Create and configure external API connections
- Support for multiple authentication methods (Basic, Bearer, API Key)
- Authentication placement (Header, Query Parameters)
- URL validation with flexible input acceptance
- Comprehensive form validation

### Planner Tool
- Create planning configurations with multiple components
- Fund selection with aliases
- Source, Run, and Report management
- Trigger configurations
- Copy and delete operations
- Pagination support

### Data Management
- Manage all dropdown data used throughout the application
- Add, edit, and delete data items
- Search and filter capabilities
- Organized by categories (Sources, Runs, Reports, Funds, Fund Aliases)
- Form validation and error handling

## 🔧 Configuration

### Environment Variables
Create `.env` files in the root and server directories:

**Root `.env`:**
```env
NODE_ENV=development
```

**Server `.env`:**
```env
NODE_ENV=development
PORT=1337
DB_PATH=./database.sqlite
```

### Angular Configuration
The application uses standalone components and Material Design. Configuration can be found in:
- `angular.json` - Angular CLI configuration
- `tsconfig.json` - TypeScript configuration
- `src/styles.scss` - Global styles

## Responsive Design

The application features a responsive design with:
- Collapsible sidebar (280px expanded, 64px collapsed)
- Mobile-friendly navigation
- Adaptive content layout
- Touch-friendly interface

## Search & Pagination

All major views include:
- Real-time search functionality
- Server-side pagination
- Configurable page sizes (5, 10, 20, 50)
- Fixed bottom pagination for easy navigation

## Validation

Comprehensive validation including:
- URL validation with protocol flexibility
- API key format validation
- Alphanumeric with spaces validation
- Minimum length validation
- Required field validation
- Custom error messages
