# Bookmark Module

## Overview

The Bookmark module allows users to save and manage their favorite tasks for quick access later. This feature enhances user experience by providing a personal collection of interesting tasks.

## Features

- ✅ **Add Bookmark**: Save tasks to personal bookmark list
- ✅ **Remove Bookmark**: Remove tasks from bookmarks
- ✅ **List Bookmarks**: View all bookmarked tasks
- ✅ **Duplicate Prevention**: Automatic handling of duplicate bookmarks
- ✅ **User Association**: Bookmarks are tied to specific users

## API Endpoints

### Protected Endpoints (Requires Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/bookmarks/:postId` | Add task to bookmarks |
| `DELETE` | `/api/bookmarks/:postId` | Remove task from bookmarks |
| `GET` | `/api/bookmarks` | Get user's bookmarked tasks |

## Data Models

### Bookmark Interface

```typescript
export interface IBookmark {
  user: Types.ObjectId;     // User who bookmarked
  post: Types.ObjectId;     // Task that was bookmarked
  createdAt?: Date;         // When bookmark was created
  updatedAt?: Date;         // When bookmark was last updated
}
```

### Request/Response Examples

#### Add Bookmark

**Request:**
```http
POST /api/bookmarks/507f1f77bcf86cd799439012
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Task bookmarked successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "user": "507f1f77bcf86cd799439013",
    "post": "507f1f77bcf86cd799439012",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Remove Bookmark

**Request:**
```http
DELETE /api/bookmarks/507f1f77bcf86cd799439012
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Bookmark removed successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "user": "507f1f77bcf86cd799439013",
    "post": "507f1f77bcf86cd799439012"
  }
}
```

#### List User Bookmarks

**Request:**
```http
GET /api/bookmarks?page=1&limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Bookmarks retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "user": "507f1f77bcf86cd799439013",
      "post": {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Fix my laptop",
        "description": "Laptop screen flickering issue",
        "status": "pending",
        "taskCategory": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Electronics"
        }
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

## Service Methods

### Core Operations

- `create(userId: string, postId: string)` - Add task to user's bookmarks
- `remove(userId: string, postId: string)` - Remove task from bookmarks
- `listMine(userId: string, query?)` - Get user's bookmarked tasks with pagination

## Database Schema

```javascript
const bookmarkSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  }
}, {
  timestamps: true
});

// Compound unique index to prevent duplicate bookmarks
bookmarkSchema.index({ user: 1, post: 1 }, { unique: true });

// Index for efficient user bookmark queries
bookmarkSchema.index({ user: 1, createdAt: -1 });
```

## Business Rules

### Bookmark Creation

1. **Authentication Required**: Only authenticated users can bookmark tasks
2. **Task Existence**: Task must exist in the system
3. **Duplicate Prevention**: Users cannot bookmark the same task twice
4. **Self-Bookmark**: Users can bookmark their own tasks

### Bookmark Removal

1. **Ownership**: Users can only remove their own bookmarks
2. **Existence Check**: Bookmark must exist to be removed

## Error Handling

Common error scenarios:

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Task not found"
}

{
  "success": false,
  "statusCode": 409,
  "message": "Task already bookmarked"
}

{
  "success": false,
  "statusCode": 404,
  "message": "Bookmark not found"
}
```

## Usage Examples

### Adding a Bookmark

```typescript
import { BookmarkService } from './bookmark.service';

try {
  const bookmark = await BookmarkService.create(userId, taskId);
  console.log('Task bookmarked successfully:', bookmark._id);
} catch (error) {
  console.error('Failed to bookmark task:', error.message);
}
```

### Removing a Bookmark

```typescript
try {
  const removedBookmark = await BookmarkService.remove(userId, taskId);
  if (removedBookmark) {
    console.log('Bookmark removed successfully');
  } else {
    console.log('Bookmark not found');
  }
} catch (error) {
  console.error('Failed to remove bookmark:', error.message);
}
```

### Listing User Bookmarks

```typescript
const query = {
  page: 1,
  limit: 10,
  sort: 'createdAt',
  sortOrder: 'desc'
};

const bookmarks = await BookmarkService.listMine(userId, query);
console.log(`User has ${bookmarks.length} bookmarked tasks`);
```

## Integration Points

### With Task Module
- Validates task existence before bookmarking
- Populates task details in bookmark listings
- Handles task deletion (cascade delete bookmarks)

### With User Module
- Validates user authentication
- Associates bookmarks with user accounts
- Supports user profile bookmark statistics

## Performance Considerations

1. **Indexing**: 
   - Compound unique index on (user, post) for duplicate prevention
   - Index on (user, createdAt) for efficient user queries

2. **Population**: 
   - Efficient population of task and category details
   - Selective field population to reduce data transfer

3. **Pagination**: 
   - All list operations support pagination
   - Default limits to prevent large data loads

## Security Measures

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only access their own bookmarks
3. **Input Validation**: Validate ObjectId formats
4. **Rate Limiting**: Prevent bookmark spam

## Future Enhancements

- [ ] Bookmark categories/tags for organization
- [ ] Bookmark sharing between users
- [ ] Bookmark export functionality
- [ ] Bookmark search and filtering
- [ ] Bookmark statistics and analytics
- [ ] Bulk bookmark operations
- [ ] Bookmark notifications for task updates
- [ ] Public bookmark collections