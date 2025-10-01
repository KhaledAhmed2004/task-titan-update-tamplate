# Notification Module

## Overview

The Notification module manages all system notifications for Task Titans users. It handles various notification types including bid notifications, task updates, system alerts, and real-time communication to keep users informed about important activities.

## Features

- ✅ **Multi-Type Notifications**: Support for BID, TASK, SYSTEM, and other notification types
- ✅ **Real-time Delivery**: Instant notification delivery via WebSocket
- ✅ **Read Status Tracking**: Track read/unread notification states
- ✅ **User Targeting**: Send notifications to specific users
- ✅ **Reference Linking**: Link notifications to related entities (tasks, bids, etc.)
- ✅ **Bulk Operations**: Mark multiple notifications as read
- ✅ **Notification History**: Maintain notification history for users

## Notification Types

```typescript
enum NotificationType {
  BID = 'BID',           // Bid-related notifications
  TASK = 'TASK',         // Task-related notifications
  SYSTEM = 'SYSTEM',     // System announcements
  MESSAGE = 'MESSAGE',   // Chat message notifications
  RATING = 'RATING',     // Rating and review notifications
  PAYMENT = 'PAYMENT',   // Payment-related notifications
  REMINDER = 'REMINDER'  // Task reminders and deadlines
}
```

## API Endpoints

### Protected Endpoints (Requires Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications` | Get user notifications |
| `GET` | `/api/notifications/unread-count` | Get unread notification count |
| `PUT` | `/api/notifications/:id/read` | Mark notification as read |
| `PUT` | `/api/notifications/mark-all-read` | Mark all notifications as read |
| `DELETE` | `/api/notifications/:id` | Delete notification |
| `DELETE` | `/api/notifications/clear-all` | Clear all notifications |
| `POST` | `/api/notifications/preferences` | Update notification preferences |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/notifications/broadcast` | Send broadcast notification |
| `GET` | `/api/admin/notifications/stats` | Get notification statistics |

## Data Models

### Notification Interface

```typescript
export type INotification = {
  _id?: Types.ObjectId;
  text: string;                    // Notification message text
  receiver: Types.ObjectId;        // User receiving the notification
  read: boolean;                   // Read status
  type: 'BID' | 'TASK' | 'SYSTEM' | 'MESSAGE' | 'RATING' | 'PAYMENT' | 'REMINDER';
  referenceId?: Types.ObjectId;    // ID of related entity (task, bid, etc.)
  metadata?: {
    taskTitle?: string;
    bidAmount?: number;
    senderName?: string;
    actionUrl?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  };
  expiresAt?: Date;               // Auto-deletion date
  createdAt?: Date;
  updatedAt?: Date;
}

export type NotificationModel = Model<INotification, Record<string, unknown>>;
```

### Request/Response Examples

#### Get User Notifications

**Request:**
```
GET /api/notifications?page=1&limit=20&type=BID&unread=true
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Notifications retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "text": "New bid received on your task 'Laptop Repair'",
      "type": "BID",
      "read": false,
      "referenceId": "507f1f77bcf86cd799439025",
      "metadata": {
        "taskTitle": "Laptop Repair",
        "bidAmount": 150,
        "senderName": "John Smith",
        "actionUrl": "/tasks/507f1f77bcf86cd799439025",
        "priority": "medium"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439031",
      "text": "Your task 'Website Development' has been completed",
      "type": "TASK",
      "read": true,
      "referenceId": "507f1f77bcf86cd799439026",
      "metadata": {
        "taskTitle": "Website Development",
        "actionUrl": "/tasks/507f1f77bcf86cd799439026",
        "priority": "high"
      },
      "createdAt": "2024-01-15T09:15:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "unreadCount": 12
  }
}
```

#### Get Unread Count

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Unread count retrieved successfully",
  "data": {
    "unreadCount": 12,
    "byType": {
      "BID": 5,
      "TASK": 4,
      "MESSAGE": 2,
      "SYSTEM": 1
    }
  }
}
```

#### Mark Notification as Read

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Notification marked as read",
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "read": true,
    "readAt": "2024-01-15T11:00:00.000Z"
  }
}
```

#### Broadcast Notification (Admin)

**Request:**
```json
{
  "text": "System maintenance scheduled for tonight at 2 AM EST",
  "type": "SYSTEM",
  "targetUsers": "all",
  "metadata": {
    "priority": "high",
    "actionUrl": "/maintenance-info"
  },
  "expiresAt": "2024-01-16T06:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Broadcast notification sent successfully",
  "data": {
    "notificationsSent": 1247,
    "broadcastId": "507f1f77bcf86cd799439040"
  }
}
```

## Service Methods

### Core Operations

- `createNotification(notificationData)` - Create new notification
- `getUserNotifications(userId, query?)` - Get user's notifications
- `getUnreadCount(userId)` - Get unread notification count
- `markAsRead(notificationId, userId)` - Mark notification as read
- `markAllAsRead(userId)` - Mark all notifications as read
- `deleteNotification(notificationId, userId)` - Delete notification
- `clearAllNotifications(userId)` - Clear all user notifications

### Specialized Operations

- `sendBidNotification(taskId, bidderId, taskOwnerId)` - Send bid notification
- `sendTaskUpdateNotification(taskId, type, userIds)` - Send task update
- `sendMessageNotification(chatId, senderId, receiverId)` - Send message notification
- `sendReminderNotification(taskId, userId, reminderType)` - Send task reminder
- `broadcastSystemNotification(message, targetUsers)` - Broadcast system message

### Utility Methods

- `cleanupExpiredNotifications()` - Remove expired notifications
- `getNotificationStats(dateRange?)` - Get notification statistics
- `updateUserPreferences(userId, preferences)` - Update notification preferences

## Database Schema

```javascript
const notificationSchema = new Schema({
  text: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  type: {
    type: String,
    enum: ['BID', 'TASK', 'SYSTEM', 'MESSAGE', 'RATING', 'PAYMENT', 'REMINDER'],
    required: true,
    index: true
  },
  referenceId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  metadata: {
    taskTitle: String,
    bidAmount: Number,
    senderName: String,
    actionUrl: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    }
  },
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
notificationSchema.index({ receiver: 1, createdAt: -1 });
notificationSchema.index({ receiver: 1, read: 1, createdAt: -1 });
notificationSchema.index({ receiver: 1, type: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Auto-mark as read when readAt is set
notificationSchema.pre('save', function() {
  if (this.readAt && !this.read) {
    this.read = true;
  }
});
```

## Business Rules

### Notification Creation

1. **User Validation**: Receiver must be a valid, active user
2. **Content Limits**: Notification text limited to 500 characters
3. **Type Validation**: Must use predefined notification types
4. **Reference Validation**: Referenced entities must exist
5. **Duplicate Prevention**: Prevent duplicate notifications for same event

### Notification Delivery

1. **Real-time Delivery**: Active users receive instant notifications
2. **Offline Storage**: Store notifications for offline users
3. **Priority Handling**: High-priority notifications bypass rate limits
4. **User Preferences**: Respect user notification preferences
5. **Expiration**: Auto-delete expired notifications

### Read Status Management

1. **Auto-read**: Mark as read when user views related content
2. **Bulk Operations**: Support marking multiple notifications as read
3. **Read Tracking**: Track when notifications were read
4. **Unread Limits**: Limit unread notifications per user

## Notification Templates

### Bid Notifications

```typescript
const bidTemplates = {
  NEW_BID: (bidderName: string, taskTitle: string, amount: number) => 
    `${bidderName} placed a bid of $${amount} on your task "${taskTitle}"
  `,
  BID_ACCEPTED: (taskTitle: string) => 
    `Your bid on "${taskTitle}" has been accepted!
  `,
  BID_REJECTED: (taskTitle: string) => 
    `Your bid on "${taskTitle}" was not selected
  `
};
```

### Task Notifications

```typescript
const taskTemplates = {
  TASK_COMPLETED: (taskTitle: string) => 
    `Task "${taskTitle}" has been marked as completed
  `,
  TASK_CANCELLED: (taskTitle: string) => 
    `Task "${taskTitle}" has been cancelled
  `,
  DEADLINE_REMINDER: (taskTitle: string, hours: number) => 
    `Reminder: Task "${taskTitle}" deadline is in ${hours} hours
  `
};
```

## Error Handling

Common error scenarios:

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Notification not found"
}

{
  "success": false,
  "statusCode": 403,
  "message": "You can only access your own notifications"
}

{
  "success": false,
  "statusCode": 400,
  "message": "Invalid notification type"
}

{
  "success": false,
  "statusCode": 400,
  "message": "Notification text cannot exceed 500 characters"
}
```

## Usage Examples

### Creating a Bid Notification

```typescript
import { NotificationService } from './notification.service';

const notificationData = {
  text: `${bidder.name} placed a bid of $${bid.amount} on your task "${task.title}"`,
  receiver: task.createdBy,
  type: 'BID' as const,
  referenceId: bid._id,
  metadata: {
    taskTitle: task.title,
    bidAmount: bid.amount,
    senderName: bidder.name,
    actionUrl: `/tasks/${task._id}`,
    priority: 'medium' as const
  }
};

try {
  const notification = await NotificationService.createNotification(notificationData);
  console.log('Notification created:', notification._id);
} catch (error) {
  console.error('Failed to create notification:', error.message);
}
```

### Getting User Notifications

```typescript
const query = {
  page: 1,
  limit: 20,
  type: 'BID',
  unread: true,
  sort: 'createdAt',
  sortOrder: 'desc' as const
};

const notifications = await NotificationService.getUserNotifications(userId, query);
console.log(`Retrieved ${notifications.length} notifications`);
```

### Broadcasting System Notification

```typescript
const broadcastData = {
  text: 'System maintenance scheduled for tonight at 2 AM EST',
  type: 'SYSTEM' as const,
  targetUsers: 'all',
  metadata: {
    priority: 'high' as const,
    actionUrl: '/maintenance-info'
  },
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
};

const result = await NotificationService.broadcastSystemNotification(broadcastData);
console.log(`Broadcast sent to ${result.notificationsSent} users`);
```

## Integration Points

### With Task Module
- Send notifications for task status changes
- Notify about new bids and bid acceptances
- Send deadline reminders
- Alert about task completions

### With Bid Module
- Notify task owners about new bids
- Alert bidders about bid status changes
- Send bid acceptance/rejection notifications

### With Chat/Message Module
- Send message notifications to offline users
- Notify about new chat invitations
- Alert about important messages

### With User Module
- Validate notification receivers
- Respect user notification preferences
- Handle user blocking and privacy settings

### With Rating Module
- Notify about new ratings received
- Send rating reminders after task completion
- Alert about rating disputes

## Real-time Features

### WebSocket Events

```typescript
const notificationEvents = {
  NOTIFICATION_RECEIVED: 'notification_received',
  NOTIFICATION_READ: 'notification_read',
  UNREAD_COUNT_UPDATED: 'unread_count_updated',
  NOTIFICATION_DELETED: 'notification_deleted'
};
```

### Push Notifications

```typescript
interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: number;
  data?: {
    notificationId: string;
    type: string;
    actionUrl?: string;
  };
}
```

## Performance Considerations

1. **Indexing**: 
   - Compound indexes for user-specific queries
   - Type-based indexes for filtering
   - TTL index for automatic cleanup

2. **Pagination**: 
   - Cursor-based pagination for large notification lists
   - Efficient unread count queries
   - Batch operations for bulk updates

3. **Caching**: 
   - Cache unread counts for active users
   - Cache notification preferences
   - Real-time cache updates

4. **Cleanup**: 
   - Automatic cleanup of expired notifications
   - Periodic cleanup of old read notifications
   - Batch deletion operations

## Security Measures

1. **Authentication**: All endpoints require valid JWT
2. **Authorization**: Users can only access their own notifications
3. **Rate Limiting**: Prevent notification spam
4. **Content Validation**: Sanitize notification content
5. **Privacy**: Respect user privacy settings
6. **Admin Controls**: Secure admin broadcast functionality

## Future Enhancements

- [ ] Rich notification content (HTML, markdown)
- [ ] Notification scheduling and delayed delivery
- [ ] Advanced notification preferences (per-type settings)
- [ ] Notification analytics and engagement tracking
- [ ] Email and SMS notification fallbacks
- [ ] Notification templates and customization
- [ ] Notification grouping and threading
- [ ] Interactive notifications with actions
- [ ] Notification sound and vibration customization
- [ ] Multi-language notification support
- [ ] Notification A/B testing
- [ ] Smart notification timing based on user activity