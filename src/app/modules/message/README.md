# Message Module

## Overview

The Message module handles individual messages within chat conversations. It supports text messages, image sharing, and mixed content, providing a comprehensive communication system for Task Titans users.

## Features

- ✅ **Text Messages**: Send and receive text-based messages
- ✅ **Image Messages**: Share images in conversations
- ✅ **Mixed Content**: Combine text and images in single messages
- ✅ **Message Types**: Support for different message formats
- ✅ **Chat Integration**: Seamless integration with chat system
- ✅ **User Association**: Track message senders and recipients

## Message Types

```
TEXT → Pure text messages
IMAGE → Image-only messages  
BOTH → Text + Image combination
```

## API Endpoints

### Protected Endpoints (Requires Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chats/:chatId/messages` | Send message in chat |
| `GET` | `/api/chats/:chatId/messages` | Get messages in chat |
| `GET` | `/api/messages/:id` | Get specific message |
| `PUT` | `/api/messages/:id` | Update message (edit) |
| `DELETE` | `/api/messages/:id` | Delete message |
| `POST` | `/api/messages/:id/read` | Mark message as read |

## Data Models

### Message Interface

```typescript
export type IMessage = {
  _id?: Types.ObjectId;
  chatId: Types.ObjectId;       // Chat this message belongs to
  sender: Types.ObjectId;       // User who sent the message
  text?: string;                // Message text content (optional)
  type: "text" | "image" | "both"; // Message type
  images?: string[];            // Array of image URLs (optional)
  readBy?: Types.ObjectId[];    // Users who have read this message
  editedAt?: Date;              // When message was last edited
  createdAt?: Date;
  updatedAt?: Date;
}

export type MessageModel = Model<IMessage, Record<string, unknown>>;
```

### Request/Response Examples

#### Send Text Message

**Request:**
```json
{
  "text": "Hello! I'm interested in your laptop repair task. When would be a good time to discuss the details?",
  "type": "text"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Message sent successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439025",
    "chatId": "507f1f77bcf86cd799439020",
    "sender": "507f1f77bcf86cd799439015",
    "text": "Hello! I'm interested in your laptop repair task...",
    "type": "text",
    "readBy": ["507f1f77bcf86cd799439015"],
    "createdAt": "2024-01-15T11:00:00.000Z"
  }
}
```

#### Send Image Message

**Request:**
```json
{
  "type": "image",
  "images": [
    "https://example.com/uploads/repair-tools.jpg",
    "https://example.com/uploads/workspace.jpg"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Message sent successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439026",
    "chatId": "507f1f77bcf86cd799439020",
    "sender": "507f1f77bcf86cd799439015",
    "type": "image",
    "images": [
      "https://example.com/uploads/repair-tools.jpg",
      "https://example.com/uploads/workspace.jpg"
    ],
    "readBy": ["507f1f77bcf86cd799439015"],
    "createdAt": "2024-01-15T11:05:00.000Z"
  }
}
```

#### Send Mixed Content Message

**Request:**
```json
{
  "text": "Here are my tools and workspace. I can start tomorrow if you're available.",
  "type": "both",
  "images": ["https://example.com/uploads/setup.jpg"]
}
```

#### Get Chat Messages

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Messages retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439025",
      "sender": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Jane Smith",
        "avatar": "https://example.com/avatar2.jpg"
      },
      "text": "Hello! I'm interested in your laptop repair task...",
      "type": "text",
      "isRead": true,
      "createdAt": "2024-01-15T11:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439026",
      "sender": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Jane Smith",
        "avatar": "https://example.com/avatar2.jpg"
      },
      "type": "image",
      "images": [
        "https://example.com/uploads/repair-tools.jpg",
        "https://example.com/uploads/workspace.jpg"
      ],
      "isRead": false,
      "createdAt": "2024-01-15T11:05:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

## Service Methods

### Core Operations

- `sendMessage(chatId, senderId, messageData)` - Send new message
- `getChatMessages(chatId, userId, query?)` - Get messages in chat
- `getMessageById(messageId, userId)` - Get specific message
- `updateMessage(messageId, userId, updateData)` - Edit message
- `deleteMessage(messageId, userId)` - Delete message
- `markAsRead(messageId, userId)` - Mark message as read
- `getUnreadCount(chatId, userId)` - Get unread message count
- `searchMessages(chatId, searchTerm)` - Search messages in chat

## Database Schema

```javascript
const messageSchema = new Schema({
  chatId: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
    index: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'both'],
    required: true
  },
  images: [{
    type: String,
    validate: {
      validator: function(url) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
      },
      message: 'Invalid image URL format'
    }
  }],
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  editedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index for efficient chat message queries
messageSchema.index({ chatId: 1, createdAt: -1 });

// Index for sender queries
messageSchema.index({ sender: 1, createdAt: -1 });

// Text index for message search
messageSchema.index({ text: 'text' });

// Validation for message content
messageSchema.pre('save', function() {
  if (this.type === 'text' && !this.text) {
    throw new Error('Text messages must have text content');
  }
  if (this.type === 'image' && (!this.images || this.images.length === 0)) {
    throw new Error('Image messages must have at least one image');
  }
  if (this.type === 'both' && (!this.text || !this.images || this.images.length === 0)) {
    throw new Error('Mixed messages must have both text and images');
  }
});
```

## Business Rules

### Message Creation

1. **Chat Participation**: Only chat participants can send messages
2. **Content Validation**: Messages must have appropriate content for their type
3. **Image Limits**: Maximum 5 images per message
4. **Text Limits**: Maximum 1000 characters per message
5. **Active Chat**: Messages can only be sent in active chats

### Message Types

1. **Text Messages**: Must have non-empty text content
2. **Image Messages**: Must have at least one valid image URL
3. **Mixed Messages**: Must have both text and images
4. **Content Validation**: Images must be valid URLs with supported formats

### Message Management

1. **Edit Permission**: Only sender can edit their messages
2. **Edit Time Limit**: Messages can be edited within 15 minutes of sending
3. **Delete Permission**: Only sender can delete their messages
4. **Read Tracking**: Automatic read tracking for message recipients

## Error Handling

Common error scenarios:

```json
{
  "success": false,
  "statusCode": 403,
  "message": "You are not a participant in this chat"
}

{
  "success": false,
  "statusCode": 400,
  "message": "Text messages must have text content"
}

{
  "success": false,
  "statusCode": 400,
  "message": "Maximum 5 images allowed per message"
}

{
  "success": false,
  "statusCode": 400,
  "message": "Message text cannot exceed 1000 characters"
}

{
  "success": false,
  "statusCode": 403,
  "message": "Cannot edit message after 15 minutes"
}
```

## Usage Examples

### Sending a Text Message

```typescript
import { MessageService } from './message.service';

const messageData = {
  text: 'Hello! When can we discuss the project details?',
  type: 'text' as const
};

try {
  const message = await MessageService.sendMessage(chatId, senderId, messageData);
  console.log('Message sent:', message._id);
} catch (error) {
  console.error('Failed to send message:', error.message);
}
```

### Sending an Image Message

```typescript
const imageMessage = {
  type: 'image' as const,
  images: [
    'https://example.com/uploads/photo1.jpg',
    'https://example.com/uploads/photo2.jpg'
  ]
};

const message = await MessageService.sendMessage(chatId, senderId, imageMessage);
```

### Getting Chat Messages with Pagination

```typescript
const query = {
  page: 1,
  limit: 20,
  sort: 'createdAt',
  sortOrder: 'desc' as const
};

const messages = await MessageService.getChatMessages(chatId, userId, query);
console.log(`Retrieved ${messages.length} messages`);
```

### Marking Messages as Read

```typescript
// Mark single message as read
await MessageService.markAsRead(messageId, userId);

// Mark all messages in chat as read
const unreadMessages = await MessageService.getUnreadMessages(chatId, userId);
for (const message of unreadMessages) {
  await MessageService.markAsRead(message._id, userId);
}
```

## Integration Points

### With Chat Module
- Validates chat existence and user participation
- Updates chat's last activity timestamp
- Provides message counts for chat listings

### With User Module
- Validates sender existence and status
- Populates sender information in responses
- Handles user blocking and privacy settings

### With File Upload Module
- Handles image upload and storage
- Validates image formats and sizes
- Manages image cleanup on message deletion

### With Notification Module
- Sends push notifications for new messages
- Creates in-app notifications for offline users
- Handles notification preferences

## Real-time Features

### WebSocket Events

```typescript
const messageEvents = {
  MESSAGE_SENT: 'message_sent',
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_READ: 'message_read',
  MESSAGE_EDITED: 'message_edited',
  MESSAGE_DELETED: 'message_deleted',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop'
};
```

### Typing Indicators

```typescript
interface TypingStatus {
  chatId: string;
  userId: string;
  isTyping: boolean;
  timestamp: Date;
}
```

## Performance Considerations

1. **Indexing**: 
   - Compound index on (chatId, createdAt) for message queries
   - Index on sender for user message history
   - Text index for message search functionality

2. **Pagination**: 
   - All message lists use cursor-based pagination
   - Efficient reverse chronological ordering
   - Limit message batch sizes

3. **Caching**: 
   - Cache recent messages for active chats
   - Cache unread message counts
   - Real-time cache updates via WebSocket

4. **File Handling**: 
   - Optimize image compression and storage
   - Use CDN for image delivery
   - Implement lazy loading for message images

## Security Measures

1. **Authentication**: All endpoints require valid JWT
2. **Authorization**: Participant-only access to chat messages
3. **Content Filtering**: Scan messages for inappropriate content
4. **Rate Limiting**: Prevent message spam
5. **Image Validation**: Validate uploaded images for security
6. **XSS Prevention**: Sanitize message content

## Future Enhancements

- [ ] Message reactions and emojis
- [ ] Message threading and replies
- [ ] Voice message support
- [ ] File attachment support (documents, etc.)
- [ ] Message encryption for privacy
- [ ] Message translation
- [ ] Advanced search with filters
- [ ] Message scheduling
- [ ] Message templates
- [ ] Bulk message operations
- [ ] Message analytics and insights
- [ ] Message backup and export