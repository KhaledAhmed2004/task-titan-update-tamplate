# Report Module

The Report module manages the reporting system for the Task Titans application, allowing users to submit reports for bugs, feedback, abuse, and other issues, with comprehensive tracking and resolution capabilities.

## 📁 Module Structure

```
report/
├── report.controller.ts    # Request handlers for report endpoints
├── report.interface.ts     # TypeScript interfaces and enums
├── report.model.ts         # MongoDB schema and model
├── report.route.ts         # Route definitions and middleware
├── report.service.ts       # Business logic for report operations
├── report.validation.ts    # Input validation schemas
└── README.md              # This documentation
```

## 🎯 Features

### Core Report Management
- **Create Report**: Submit new reports with detailed information
- **View Reports**: Retrieve all reports with advanced filtering and pagination
- **Report Details**: Get detailed information about specific reports
- **Update Report**: Modify report status, content, and metadata
- **Delete Report**: Remove reports from the system
- **Advanced Search**: Search reports by title and description
- **Status Tracking**: Track report lifecycle from creation to resolution

### Report Categories
- **Bug Reports**: Technical issues and software bugs
- **Feedback**: User suggestions and feature requests
- **Abuse Reports**: Content or behavior violations

### Status Management
- **Pending**: Initial state when report is submitted
- **Reviewed**: Report has been examined by administrators
- **Resolved**: Issue has been addressed and closed

## 🛠 API Endpoints

### POST `/reports`
Create a new report.

**Request Body:**
```json
{
  "title": "Application crashes on login",
  "description": "The app crashes consistently when trying to log in with Google OAuth",
  "type": "bug",
  "reportedBy": "64f123abc456def789012347",
  "relatedTo": "64f123abc456def789012348"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Report created successfully",
  "data": {
    "_id": "64f123abc456def789012345",
    "title": "Application crashes on login",
    "description": "The app crashes consistently when trying to log in with Google OAuth",
    "type": "bug",
    "status": "pending",
    "reportedBy": {
      "_id": "64f123abc456def789012347",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "relatedTo": "64f123abc456def789012348",
    "createdAt": "2025-08-23T10:00:00Z",
    "updatedAt": "2025-08-23T10:00:00Z"
  }
}
```

### GET `/reports`
Retrieve all reports with filtering, searching, sorting, and pagination.

**Query Parameters:**
- `status`: Filter by report status (pending, reviewed, resolved)
- `type`: Filter by report type (bug, feedback, abuse)
- `reportedBy`: Filter by user ID who created the report
- `page`: Page number for pagination (default: 1)
- `limit`: Number of items per page (default: 10)
- `sortBy`: Field to sort by (default: createdAt)
- `sortOrder`: Sort direction (asc, desc)
- `search`: Search in title and description fields

**Example Request:**
```
GET /reports?status=pending&type=bug&page=1&limit=10&sortBy=createdAt&sortOrder=desc&search=login
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Reports retrieved successfully",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  },
  "data": [
    {
      "_id": "64f123abc456def789012345",
      "title": "Application crashes on login",
      "description": "The app crashes consistently when trying to log in",
      "type": "bug",
      "status": "pending",
      "reportedBy": {
        "name": "John Doe",
        "email": "john@example.com",
        "role": "USER"
      },
      "createdAt": "2025-08-23T10:00:00Z"
    }
  ]
}
```

### GET `/reports/:reportId`
Get a specific report by ID.

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Report retrieved successfully",
  "data": {
    "_id": "64f123abc456def789012345",
    "title": "Application crashes on login",
    "description": "The app crashes consistently when trying to log in with Google OAuth",
    "type": "bug",
    "status": "pending",
    "reportedBy": {
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER"
    },
    "relatedTo": "64f123abc456def789012348",
    "createdAt": "2025-08-23T10:00:00Z",
    "updatedAt": "2025-08-23T10:00:00Z"
  }
}
```

### PUT `/reports/:reportId`
Update an existing report.

**Request Body:**
```json
{
  "title": "Updated: Application crashes on login",
  "description": "Updated description with more details",
  "status": "reviewed",
  "type": "bug"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Report updated successfully",
  "data": {
    "_id": "64f123abc456def789012345",
    "title": "Updated: Application crashes on login",
    "description": "Updated description with more details",
    "type": "bug",
    "status": "reviewed",
    "updatedAt": "2025-08-23T12:00:00Z"
  }
}
```

### DELETE `/reports/:reportId`
Delete a report.

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Report deleted successfully",
  "data": null
}
```

## 🔧 Service Methods

### `createReport(payload: ICreateReport)`
- Creates a new report in the database
- Validates report data
- Returns created report object with populated user data

### `getAllReports(query: IQueryReports)`
- Retrieves reports with advanced filtering and pagination
- Supports searching in title and description fields
- Includes sorting and field selection
- Populates user information
- Returns data and pagination metadata

### `getReportById(reportId: string)`
- Retrieves a specific report by ID
- Populates user information
- Returns single report object or null

### `updateReport(reportId: string, payload: IUpdateReport)`
- Updates existing report with new data
- Validates update data
- Returns updated report object

### `deleteReport(reportId: string)`
- Removes report from database
- Returns deleted report object
- Permanent deletion

## 📊 Data Types

### Report Interface
```typescript
interface IReport {
  _id?: Types.ObjectId;
  title: string;                    // Report title
  description: string;              // Detailed description
  type: REPORT_TYPE;               // Report category
  status: REPORT_STATUS;           // Current status
  reportedBy: Types.ObjectId | IUser; // User who created report
  relatedTo?: Types.ObjectId;      // Optional related entity
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Create Report Interface
```typescript
interface ICreateReport {
  title: string;
  description: string;
  type: REPORT_TYPE;
  reportedBy: Types.ObjectId | IUser;
  relatedTo?: Types.ObjectId;
}
```

### Update Report Interface
```typescript
interface IUpdateReport {
  title?: string;
  description?: string;
  status?: REPORT_STATUS;
  type?: REPORT_TYPE;
}
```

### Query Reports Interface
```typescript
interface IQueryReports {
  status?: REPORT_STATUS;
  type?: REPORT_TYPE;
  reportedBy?: Types.ObjectId;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

### Report Types
```typescript
enum REPORT_TYPE {
  BUG = 'bug',           // Technical issues
  FEEDBACK = 'feedback', // User suggestions
  ABUSE = 'abuse',       // Policy violations
}
```

### Report Status
```typescript
enum REPORT_STATUS {
  PENDING = 'pending',   // Awaiting review
  REVIEWED = 'reviewed', // Under investigation
  RESOLVED = 'resolved', // Issue closed
}
```

## 🔄 Report Lifecycle

1. **Creation**: User submits report with details
2. **Pending**: Report awaits administrator review
3. **Review**: Administrator examines the report
4. **Investigation**: Detailed analysis and action planning
5. **Resolution**: Issue is addressed and report is closed
6. **Follow-up**: Optional user notification and feedback

## 🔗 Related Modules

- **User Module**: Reports are created by users
- **Auth Module**: Authentication required for report operations
- **Task Module**: Reports may be related to specific tasks
- **Notification Module**: Status updates trigger notifications
- **Admin Module**: Administrative review and management

## 🛡️ Security & Validation

- **Authentication**: All endpoints require valid JWT token
- **Authorization**: Users can only view/edit their own reports (except admins)
- **Input Validation**: Report content is validated and sanitized
- **Data Sanitization**: Prevents XSS and injection attacks
- **Rate Limiting**: Prevents spam reporting
- **Content Moderation**: Automated filtering for inappropriate content

## 📝 Business Rules

- Users can create multiple reports
- Report titles must be descriptive and unique per user
- Descriptions must provide sufficient detail
- Only administrators can change report status
- Reports cannot be deleted by regular users once submitted
- Related entities must exist in the system
- Resolved reports are archived but remain accessible

## 🚨 Error Handling

- **Invalid Report ID**: Returns 404 for non-existent reports
- **Unauthorized Access**: Returns 401 for unauthenticated requests
- **Validation Errors**: Returns 400 for invalid input data
- **Duplicate Reports**: Prevents identical reports from same user
- **Missing Related Entity**: Validates related entity existence
- **Status Transition**: Validates allowed status changes

## 🔍 Advanced Features

### Search Functionality
- Full-text search in title and description
- Case-insensitive matching
- Partial word matching
- Search result highlighting

### Filtering Options
- Filter by status, type, and reporter
- Date range filtering
- Multiple filter combinations
- Saved filter presets

### Sorting & Pagination
- Sort by any field (date, title, status)
- Ascending/descending order
- Configurable page sizes
- Efficient pagination with metadata

## 📊 Usage Examples

### Creating a Bug Report
```typescript
const reportData = {
  title: 'Login button not responding',
  description: 'The login button becomes unresponsive after multiple clicks',
  type: REPORT_TYPE.BUG,
  reportedBy: userId,
  relatedTo: taskId
};

const result = await ReportService.createReport(reportData);
```

### Getting Reports with Filters
```typescript
const query = {
  status: REPORT_STATUS.PENDING,
  type: REPORT_TYPE.BUG,
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

const { data, pagination } = await ReportService.getAllReports(query);
```

### Updating Report Status
```typescript
const reportId = '64f123abc456def789012345';
const updateData = {
  status: REPORT_STATUS.RESOLVED
};

const result = await ReportService.updateReport(reportId, updateData);
```

This module provides a comprehensive reporting system that helps maintain platform quality and user satisfaction through effective issue tracking and resolution.