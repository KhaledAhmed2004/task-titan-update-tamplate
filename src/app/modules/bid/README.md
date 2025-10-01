# Bid Module

The Bid module manages the bidding system for tasks in the Task Titans application, allowing users to submit, manage, and track bids on available tasks.

## 📁 Module Structure

```
bid/
├── bid.controller.ts    # Request handlers for bid endpoints
├── bid.interface.ts     # TypeScript interfaces and types
├── bid.model.ts         # MongoDB schema and model
├── bid.route.ts         # Route definitions and middleware
├── bid.service.ts       # Business logic for bid operations
├── bid.validation.ts    # Input validation schemas
└── README.md           # This documentation
```

## 🎯 Features

### Core Bid Management
- **Create Bid**: Submit bids on available tasks
- **View Bids**: Retrieve all bids or filter by specific criteria
- **Bid Details**: Get detailed information about specific bids
- **Update Bid**: Modify bid amount, message, or status
- **Delete Bid**: Remove bids from the system
- **Task-Specific Bids**: Get all bids for a particular task

### Bid Status Management
- **Pending**: Initial state when bid is submitted
- **Accepted**: When task owner accepts the bid
- **Rejected**: When task owner rejects the bid

## 🛠 API Endpoints

### POST `/bids`
Create a new bid for a task.

**Request Body:**
```json
{
  "taskId": "64f123abc456def789012346",
  "userId": "64f123abc456def789012347",
  "amount": 120,
  "message": "I can complete this task efficiently with high quality",
  "status": "pending"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Bid created successfully",
  "data": {
    "_id": "64f123abc456def789012345",
    "taskId": "64f123abc456def789012346",
    "userId": "64f123abc456def789012347",
    "amount": 120,
    "message": "I can complete this task efficiently with high quality",
    "status": "pending",
    "createdAt": "2025-08-23T10:00:00Z",
    "updatedAt": "2025-08-23T10:00:00Z"
  }
}
```

### GET `/bids`
Retrieve all bids with optional filtering.

**Query Parameters:**
- `taskId`: Filter bids by task ID
- `userId`: Filter bids by user ID
- `status`: Filter bids by status (pending, accepted, rejected)

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Bids retrieved successfully",
  "data": [
    {
      "_id": "64f123abc456def789012345",
      "taskId": "64f123abc456def789012346",
      "userId": "64f123abc456def789012347",
      "amount": 120,
      "message": "I can complete this task efficiently",
      "status": "pending"
    }
  ]
}
```

### GET `/bids/task/:taskId`
Get all bids for a specific task.

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Bids retrieved successfully",
  "data": [
    {
      "_id": "64f123abc456def789012345",
      "taskId": "64f123abc456def789012346",
      "userId": "64f123abc456def789012347",
      "amount": 120,
      "message": "I can complete this task efficiently",
      "status": "pending"
    }
  ]
}
```

### GET `/bids/:bidId`
Get a specific bid by ID.

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Bid retrieved successfully",
  "data": {
    "_id": "64f123abc456def789012345",
    "taskId": "64f123abc456def789012346",
    "userId": "64f123abc456def789012347",
    "amount": 120,
    "message": "I can complete this task efficiently",
    "status": "pending"
  }
}
```

### PUT `/bids/:bidId`
Update an existing bid.

**Request Body:**
```json
{
  "amount": 130,
  "message": "Updated proposal with better terms",
  "status": "accepted"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Bid updated successfully",
  "data": {
    "_id": "64f123abc456def789012345",
    "taskId": "64f123abc456def789012346",
    "userId": "64f123abc456def789012347",
    "amount": 130,
    "message": "Updated proposal with better terms",
    "status": "accepted"
  }
}
```

### DELETE `/bids/:bidId`
Delete a bid.

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Bid deleted successfully",
  "data": null
}
```

## 🔧 Service Methods

### `createBid(bid: Bid)`
- Creates a new bid in the database
- Validates bid data
- Returns created bid object

### `getAllBids(query?: BidQuery)`
- Retrieves all bids with optional filtering
- Supports filtering by taskId, userId, and status
- Returns array of bid objects

### `getAllBidsByTaskId(taskId: string)`
- Gets all bids for a specific task
- Useful for task owners to review bids
- Returns array of bid objects

### `getBidById(bidId: string)`
- Retrieves a specific bid by ID
- Returns single bid object
- Returns null if bid not found

### `updateBid(bidId: string, bid: BidUpdate)`
- Updates existing bid with new data
- Validates update data
- Returns updated bid object

### `deleteBid(bidId: string)`
- Removes bid from database
- Returns deleted bid object
- Permanent deletion

## 📊 Data Types

### Bid Interface
```typescript
type Bid = {
  _id: string;
  taskId: string;        // Reference to task
  userId: string;        // Reference to bidding user
  amount: number;        // Bid amount
  message?: string;      // Optional proposal message
  status: BidStatusType; // Current bid status
};
```

### BidUpdate Interface
```typescript
type BidUpdate = {
  amount?: number;       // Updated bid amount
  message?: string;      // Updated proposal message
  status?: BidStatusType; // Updated status
};
```

### BidQuery Interface
```typescript
type BidQuery = {
  taskId?: string;       // Filter by task
  userId?: string;       // Filter by user
  status?: BidStatusType; // Filter by status
};
```

### Bid Status Types
```typescript
const BidStatus = {
  PENDING: 'pending',    // Initial state
  ACCEPTED: 'accepted',  // Bid accepted by task owner
  REJECTED: 'rejected',  // Bid rejected by task owner
} as const;
```

## 🔄 Bid Lifecycle

1. **Creation**: User submits bid with amount and proposal
2. **Pending**: Bid awaits task owner's decision
3. **Review**: Task owner evaluates all bids
4. **Decision**: Bid is either accepted or rejected
5. **Completion**: Accepted bid leads to task assignment

## 🔗 Related Modules

- **Task Module**: Bids are associated with tasks
- **User Module**: Bids are created by users
- **Auth Module**: Authentication required for bid operations
- **Notification Module**: Bid status updates trigger notifications

## 🛡️ Security & Validation

- **Authentication**: All endpoints require valid JWT token
- **Authorization**: Users can only modify their own bids
- **Input Validation**: Bid amounts and messages are validated
- **Data Sanitization**: User inputs are sanitized
- **Rate Limiting**: Prevents spam bidding

## 📝 Business Rules

- Users cannot bid on their own tasks
- Bid amounts must be positive numbers
- Only one bid per user per task (configurable)
- Bids can be updated until task owner makes decision
- Accepted bids cannot be modified
- Task owners can accept only one bid per task

## 🚨 Error Handling

- **Invalid Bid ID**: Returns 404 for non-existent bids
- **Unauthorized Access**: Returns 401 for unauthenticated requests
- **Validation Errors**: Returns 400 for invalid input data
- **Duplicate Bids**: Prevents multiple bids from same user
- **Closed Tasks**: Prevents bidding on completed tasks

## 📊 Usage Examples

### Creating a Bid
```typescript
const bidData = {
  taskId: '64f123abc456def789012346',
  userId: '64f123abc456def789012347',
  amount: 120,
  message: 'I have 5 years of experience in this field',
  status: 'pending'
};

const result = await BidService.createBid(bidData);
```

### Getting Bids for a Task
```typescript
const taskId = '64f123abc456def789012346';
const bids = await BidService.getAllBidsByTaskId(taskId);
```

### Updating Bid Status
```typescript
const bidId = '64f123abc456def789012345';
const updateData = {
  status: 'accepted'
};

const result = await BidService.updateBid(bidId, updateData);
```

This module provides a comprehensive bidding system that facilitates fair and transparent task assignment in the Task Titans marketplace.