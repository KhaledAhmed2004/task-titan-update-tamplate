# Task Module

The Task module is the core component of the Task Titans application, managing the creation, tracking, and lifecycle of tasks that users can post and bid on.

## 📁 Module Structure

```
task/
├── task.controller.ts    # Request handlers for task endpoints
├── task.interface.ts     # TypeScript interfaces and types
├── task.model.ts         # MongoDB schema and model
├── task.route.ts         # Route definitions and middleware
├── task.service.ts       # Business logic for task operations
├── task.validation.ts    # Input validation schemas
└── README.md            # This documentation
```

## 🎯 Features

### Core Task Management
- **Create Task**: Post new tasks with detailed requirements
- **View Tasks**: Browse all available tasks with filtering
- **Task Details**: Get comprehensive information about specific tasks
- **Update Task**: Modify task details, status, and requirements
- **Delete Task**: Remove tasks from the platform
- **Status Tracking**: Monitor task progress through lifecycle stages
- **Category Management**: Organize tasks by categories
- **Location-Based Tasks**: Filter and search tasks by location

### Task Status Management
- **Pending**: Initial state when task is created
- **In Progress**: Task has been assigned and work has begun
- **Completed**: Task has been finished and delivered

## 🛠 API Endpoints

### POST `/tasks`
Create a new task.

**Request Body:**
```json
{
  "title": "Fix the car engine",
  "taskCategory": "Maintenance",
  "description": "Engine requires a full service and oil change",
  "taskImage": "https://example.com/car-engine.jpg",
  "taskBudget": 150,
  "taskLocation": "Dhaka",
  "dueDate": "2025-09-01",
  "status": "pending",
  "userId": "64f123abc456def789012346"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Task created successfully",
  "data": {
    "_id": "64f123abc456def789012345",
    "title": "Fix the car engine",
    "taskCategory": "Maintenance",
    "description": "Engine requires a full service and oil change",
    "taskImage": "https://example.com/car-engine.jpg",
    "taskBudget": 150,
    "taskLocation": "Dhaka",
    "status": "pending",
    "userId": "64f123abc456def789012346",
    "createdAt": "2025-08-23T10:00:00Z",
    "updatedAt": "2025-08-23T10:00:00Z"
  }
}
```

### GET `/tasks`
Retrieve all tasks with optional filtering.

**Query Parameters:**
- `userId`: Filter tasks by creator ID
- `status`: Filter by task status (pending, in-progress, completed)
- `taskCategory`: Filter by task category
- `taskLocation`: Filter by task location

**Example Request:**
```
GET /tasks?status=pending&taskCategory=Maintenance&taskLocation=Dhaka
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Tasks retrieved successfully",
  "data": [
    {
      "_id": "64f123abc456def789012345",
      "title": "Fix the car engine",
      "taskCategory": "Maintenance",
      "description": "Engine requires a full service",
      "taskBudget": 150,
      "taskLocation": "Dhaka",
      "status": "pending",
      "userId": "64f123abc456def789012346",
      "createdAt": "2025-08-23T10:00:00Z"
    }
  ]
}
```

### GET `/tasks/:taskId`
Get a specific task by ID.

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Task retrieved successfully",
  "data": {
    "_id": "64f123abc456def789012345",
    "title": "Fix the car engine",
    "taskCategory": "Maintenance",
    "description": "Engine requires a full service and oil change",
    "taskImage": "https://example.com/car-engine.jpg",
    "taskBudget": 150,
    "taskLocation": "Dhaka",
    "status": "pending",
    "userId": "64f123abc456def789012346",
    "createdAt": "2025-08-23T10:00:00Z",
    "updatedAt": "2025-08-23T10:00:00Z"
  }
}
```

### PUT `/tasks/:taskId`
Update an existing task.

**Request Body:**
```json
{
  "title": "Fix and tune the car engine",
  "description": "Engine requires a full service, oil change, and performance tuning",
  "taskBudget": 200,
  "status": "in-progress"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Task updated successfully",
  "data": {
    "_id": "64f123abc456def789012345",
    "title": "Fix and tune the car engine",
    "taskCategory": "Maintenance",
    "description": "Engine requires a full service, oil change, and performance tuning",
    "taskBudget": 200,
    "status": "in-progress",
    "updatedAt": "2025-08-23T12:00:00Z"
  }
}
```

### DELETE `/tasks/:taskId`
Delete a task.

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Task deleted successfully",
  "data": null
}
```

## 🔧 Service Methods

### `createTask(task: Task)`
- Creates a new task in the database
- Validates task data against schema
- Returns created task object with generated ID

### `getAllTasks(query?: TaskQuery)`
- Retrieves all tasks with optional filtering
- Supports filtering by userId, status, category, and location
- Returns array of task objects

### `getTaskById(taskId: string)`
- Retrieves a specific task by ID
- Returns single task object
- Returns null if task not found

### `updateTask(taskId: string, task: TaskUpdate)`
- Updates existing task with new data
- Validates update data against schema
- Returns updated task object
- Uses `new: true` to return updated document

### `deleteTask(taskId: string)`
- Removes task from database
- Returns deleted task object
- Permanent deletion

## 📊 Data Types

### Task Interface
```typescript
type Task = {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;           // Task title/summary
  taskCategory: string;    // Category classification
  description: string;     // Detailed task description
  taskImage?: string;      // Optional task image URL
  taskBudget: number;      // Budget allocated for task
  taskLocation: string;    // Geographic location
  status: TaskStatusType;  // Current task status
  userId: string;          // Task creator ID
};
```

### TaskUpdate Interface
```typescript
type TaskUpdate = {
  title?: string;
  taskCategory?: string;
  description?: string;
  taskImage?: string;
  taskBudget?: number;
  taskLocation?: string;
  dueDate?: string;        // Optional due date
  status?: TaskStatusType;
};
```

### TaskQuery Interface
```typescript
type TaskQuery = {
  userId?: string;         // Filter by creator
  status?: TaskStatusType; // Filter by status
  taskCategory?: string;   // Filter by category
  taskLocation?: string;   // Filter by location
};
```

### Task Status Types
```typescript
const TaskStatus = {
  PENDING: 'pending',      // Awaiting bids/assignment
  IN_PROGRESS: 'in-progress', // Work in progress
  COMPLETED: 'completed',  // Task finished
} as const;
```

## 🔄 Task Lifecycle

1. **Creation**: User posts a new task with requirements
2. **Pending**: Task is available for bidding
3. **Bidding**: Service providers submit bids
4. **Assignment**: Task owner selects a bid
5. **In Progress**: Work begins on the task
6. **Review**: Task owner reviews completed work
7. **Completion**: Task is marked as completed
8. **Rating**: Participants rate each other

## 🏷️ Task Categories

Common task categories include:
- **Maintenance**: Repair and upkeep services
- **Cleaning**: Cleaning and organizing tasks
- **Delivery**: Transportation and delivery services
- **Technology**: IT and technical support
- **Creative**: Design and creative services
- **Education**: Teaching and tutoring
- **Health**: Healthcare and wellness services
- **Events**: Event planning and management

## 🔗 Related Modules

- **User Module**: Tasks are created by users
- **Bid Module**: Users bid on tasks
- **Rating Module**: Task completion leads to ratings
- **Auth Module**: Authentication required for task operations
- **Notification Module**: Task updates trigger notifications
- **Payment Module**: Task completion involves payments

## 🛡️ Security & Validation

- **Authentication**: All endpoints require valid JWT token
- **Authorization**: Users can only modify their own tasks
- **Input Validation**: Task data is validated against schema
- **Data Sanitization**: User inputs are sanitized
- **Budget Validation**: Ensures positive budget values
- **Image Validation**: Validates image URLs and formats

## 📝 Business Rules

- Task titles must be descriptive and unique per user
- Task budgets must be positive numbers
- Task locations should be valid geographic locations
- Only task creators can update their tasks
- Tasks cannot be deleted if they have active bids
- Completed tasks cannot be modified
- Task images are optional but recommended

## 🚨 Error Handling

- **Invalid Task ID**: Returns 404 for non-existent tasks
- **Unauthorized Access**: Returns 401 for unauthenticated requests
- **Validation Errors**: Returns 400 for invalid input data
- **Duplicate Tasks**: Prevents identical tasks from same user
- **Budget Constraints**: Validates minimum budget requirements
- **Status Transitions**: Validates allowed status changes

## 🔍 Search & Filter Features

### Location-Based Filtering
- Filter tasks by city, region, or country
- Proximity-based search (future enhancement)
- Location validation and standardization

### Category-Based Organization
- Predefined category system
- Custom category support
- Category-specific validation rules

### Status-Based Views
- View tasks by current status
- Track task progress
- Status history tracking

### Budget-Based Filtering
- Filter by budget ranges
- Sort by budget (ascending/descending)
- Budget analytics and insights

## 📊 Usage Examples

### Creating a Task
```typescript
const taskData = {
  title: 'Website Development',
  taskCategory: 'Technology',
  description: 'Need a responsive website for my business',
  taskBudget: 500,
  taskLocation: 'Remote',
  status: 'pending',
  userId: '64f123abc456def789012346'
};

const result = await TaskService.createTask(taskData);
```

### Getting Tasks with Filters
```typescript
const query = {
  status: 'pending',
  taskCategory: 'Technology',
  taskLocation: 'Remote'
};

const tasks = await TaskService.getAllTasks(query);
```

### Updating Task Status
```typescript
const taskId = '64f123abc456def789012345';
const updateData = {
  status: 'in-progress'
};

const result = await TaskService.updateTask(taskId, updateData);
```

### Getting User's Tasks
```typescript
const userId = '64f123abc456def789012346';
const userTasks = await TaskService.getAllTasks({ userId });
```

This module serves as the foundation of the Task Titans marketplace, enabling users to post, manage, and track tasks efficiently while maintaining data integrity and security.