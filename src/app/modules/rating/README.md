# Rating Module

A comprehensive rating system for the Task Titans application that allows users to rate each other based on task completion, communication, quality, and timeliness.

## Features

- ⭐ **Multi-dimensional Rating System**: Rate users on different aspects (task completion, communication, quality, timeliness)
- 🔒 **Secure Rating**: Users can only rate others they've interacted with through tasks
- 📊 **Rating Statistics**: Comprehensive statistics including average ratings and breakdowns
- 🚫 **Prevent Self-Rating**: Users cannot rate themselves
- 🔄 **CRUD Operations**: Full create, read, update, delete functionality
- 📱 **Pagination Support**: Efficient data retrieval with pagination
- 🔍 **Advanced Filtering**: Filter ratings by task, user, type, and status

## API Endpoints

### Create Rating
```http
POST /api/ratings
Authorization: Bearer <token>
Content-Type: application/json

{
  "taskId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "ratedUserId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "rating": 5,
  "comment": "Excellent work and communication!",
  "ratingType": "task_completion"
}
```

### Get All Ratings
```http
GET /api/ratings?page=1&limit=10&ratingType=task_completion&sortBy=createdAt&sortOrder=desc
```

### Get Single Rating
```http
GET /api/ratings/:id
```

### Update Rating
```http
PATCH /api/ratings/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 4,
  "comment": "Updated comment"
}
```

### Delete Rating
```http
DELETE /api/ratings/:id
Authorization: Bearer <token>
```

### Get User Ratings
```http
GET /api/ratings/user/:userId
```

### Get User Rating Statistics
```http
GET /api/ratings/user/:userId/stats
```

### Get Task Ratings
```http
GET /api/ratings/task/:taskId
```

### Get My Ratings (Given by current user)
```http
GET /api/ratings/my-ratings
Authorization: Bearer <token>
```

### Get My Rating Statistics
```http
GET /api/ratings/my-stats
Authorization: Bearer <token>
```

## Data Models

### Rating Schema
```typescript
interface IRating {
  _id?: string;
  taskId: string;           // Reference to Task
  raterId: string;          // User who gives the rating
  ratedUserId: string;      // User who receives the rating
  rating: number;           // 1-5 stars
  comment?: string;         // Optional comment (max 500 chars)
  ratingType: 'task_completion' | 'communication' | 'quality' | 'timeliness';
  status: 'active' | 'deleted';
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Rating Statistics
```typescript
interface IRatingStats {
  averageRating: number;
  totalRatings: number;
  ratingBreakdown: {
    1: number; 2: number; 3: number; 4: number; 5: number;
  };
  ratingsByType: {
    task_completion: number;
    communication: number;
    quality: number;
    timeliness: number;
  };
}
```

## Rating Types

1. **task_completion**: How well the user completed the assigned task
2. **communication**: How effectively the user communicated throughout the process
3. **quality**: The quality of work delivered by the user
4. **timeliness**: How punctual the user was with deadlines and responses

## Business Rules

1. **Authorization**: Only users involved in a task can rate each other
2. **Self-Rating Prevention**: Users cannot rate themselves
3. **Unique Ratings**: One rating per user per task per rating type
4. **Rating Range**: Ratings must be between 1-5 stars
5. **Comment Limit**: Comments are limited to 500 characters
6. **Soft Delete**: Ratings are soft-deleted (status: 'deleted') rather than permanently removed

## Usage Examples

### Creating a Rating
```typescript
import { RatingService } from './rating.service';

const user = { id: 'user123' };
const ratingData = {
  taskId: 'task456',
  ratedUserId: 'user789',
  rating: 5,
  comment: 'Outstanding work!',
  ratingType: 'task_completion'
};

const newRating = await RatingService.createRatingToDB(user, ratingData);
```

### Getting User Statistics
```typescript
const stats = await RatingService.getUserRatingStatsFromDB('user123');
console.log(`Average Rating: ${stats.averageRating}`);
console.log(`Total Ratings: ${stats.totalRatings}`);
```

### Filtering Ratings
```typescript
const filters = {
  ratingType: 'communication',
  status: 'active'
};
const paginationOptions = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

const result = await RatingService.getAllRatingsFromDB(filters, paginationOptions);
```

## Database Indexes

The following indexes are created for optimal performance:

1. **Unique Index**: `{ taskId: 1, raterId: 1, ratingType: 1 }` - Prevents duplicate ratings
2. **Query Index**: `{ ratedUserId: 1, status: 1 }` - Fast user rating queries
3. **Task Index**: `{ taskId: 1, status: 1 }` - Fast task rating queries
4. **Time Index**: `{ createdAt: -1 }` - Chronological sorting

## Error Handling

The module includes comprehensive error handling for:

- Invalid rating values (outside 1-5 range)
- Duplicate ratings
- Self-rating attempts
- Unauthorized rating attempts
- Non-existent users or tasks
- Invalid rating types

## Security Features

- **JWT Authentication**: All write operations require valid authentication
- **Authorization Checks**: Users can only rate others they've interacted with
- **Input Validation**: All inputs are validated using Zod schemas
- **SQL Injection Prevention**: Using Mongoose ODM with proper validation
- **Rate Limiting**: Can be implemented at the route level

## Performance Considerations

- **Database Indexes**: Optimized indexes for common query patterns
- **Pagination**: Large datasets are paginated to prevent memory issues
- **Population**: Related data is populated efficiently
- **Aggregation**: Rating statistics are calculated using efficient aggregation

## Testing

To test the rating module:

1. **Unit Tests**: Test individual service methods
2. **Integration Tests**: Test API endpoints
3. **Performance Tests**: Test with large datasets
4. **Security Tests**: Test authorization and validation

```bash
# Run tests (when test suite is available)
npm test rating
```

## Contributing

When contributing to the rating module:

1. Follow the established code patterns
2. Add proper TypeScript types
3. Include comprehensive error handling
4. Write tests for new features
5. Update documentation

## Future Enhancements

- **Rating Analytics**: Advanced analytics and reporting
- **Rating Notifications**: Email/push notifications for new ratings
- **Rating Disputes**: System for handling rating disputes
- **Bulk Operations**: Bulk rating operations
- **Rating Templates**: Predefined rating templates
- **Rating Reminders**: Automated reminders to rate completed tasks