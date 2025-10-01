# Chat Module

## Overview

The Chat module manages chat conversations between users in the Task Titans platform. It provides the foundation for communication between task posters and taskers, enabling them to discuss task details, negotiate terms, and coordinate work.

## Features

- ✅ **Chat Creation**: Automatic chat creation between task participants
- ✅ **Participant Management**: Handle two-party conversations
- ✅ **Chat Status**: Active/inactive chat management
- ✅ **User Association**: Link chats to specific user pairs
- ✅ **Message Integration**: Foundation for message exchange

## Chat Lifecycle

```
CHAT CREATION → ACTIVE → INACTIVE
     ↑              ↓
     └── REACTIVATE ←┘
```

## API Endpoints

### Protected Endpoints (Requires Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chats` | Create new chat between users |
| `GET` | `/api/chats` | Get user's chat conversations |
| `GET` | `/api/chats/:id` | Get specific chat details |
| `PUT` | `/api/chats/:id/status` | Update chat status |
| `GET` | `/api/chats/:id/messages` | Get messages in chat |

## Data Models

### Chat Interface

```typescript
export type IChat = {
  _id?: Types.ObjectId;
  participants: [Types.ObjectId];  // Array of exactly 2 user IDs
  status: Boolean;                 // true = active, false = inactive
  createdAt?: Date;
  updatedAt?: Date;
}

export type ChatModel = Model<IChat, Record<string, unknown>>;
```

### Request/Response Examples

#### Create Chat

**Request:**
```json
{
  "participantId": "507f1f77bcf86cd799439015"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Chat created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "participants": [
      "507f1f77bcf86cd799439013",
      "507f1f77bcf86cd799439015"
    ],
    "status": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Get User Chats

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Chats retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "participants": [
        {
          "_id": "507f1f77bcf86cd799439013",
          "name": "John Doe",
          "email": "john@example.com",
          "role": "POSTER"
        },
        {
          "_id": "507f1f77bcf86cd799439015",
          "name": "Jane Smith",
          "email": "jane@example.com",
          "role": "TASKER"
        }
      ],
      "status": true,
      "lastMessage": {
        "text": "When can you start the work?",
        "sender": "507f1f77bcf86cd799439013",
        "createdAt": "2024-01-15T11:00:00.000Z"
      },
      "unreadCount": 2,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### Get Chat Details

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Chat details retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "participants": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "POSTER",
        "avatar": "https://example.com/avatar1.jpg"
      },
      {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "TASKER",
        "avatar": "https://example.com/avatar2.jpg"
      }
    ],
    "status": true,
    "messageCount": 15,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:30:00.000Z"
  }
}
```

## Service Methods

### Core Operations

- `createChat(userId, participantId)` - Create chat between two users
- `getUserChats(userId, query?)` - Get user's chat conversations
- `getChatById(chatId, userId)` - Get specific chat with validation
- `updateChatStatus(chatId, status)` - Activate/deactivate chat
- `findExistingChat(user1Id, user2Id)` - Check if chat already exists
- `addParticipant(chatId, userId)` - Add user to chat (future feature)
- `removeParticipant(chatId, userId)` - Remove user from chat (future feature)

## Database Schema

```javascript
const chatSchema = new Schema({
  participants: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    validate: {
      validator: function(participants) {
        return participants.length === 2;
      },
      message: 'Chat must have exactly 2 participants'
    }
  },
  status: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate chats and optimize queries
chatSchema.index({ participants: 1 });

// Index for user chat queries
chatSchema.index({ 'participants': 1, 'updatedAt': -1 });

// Ensure unique chat between two users
chatSchema.index(
  { participants: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { status: true }
  }
);
```

## Business Rules

### Chat Creation

1. **Two Participants Only**: Chats are limited to exactly 2 users
2. **Unique Conversations**: Only one active chat between any two users
3. **Self-Chat Prevention**: Users cannot create chats with themselves
4. **User Validation**: Both participants must be valid, active users
5. **Automatic Creation**: Chats can be auto-created when users interact

### Chat Access

1. **Participant Only**: Only chat participants can access the chat
2. **Active Status**: Inactive chats may have limited functionality
3. **Privacy**: Users cannot see chats they're not part of

### Chat Management

1. **Status Control**: Participants can activate/deactivate chats
2. **Reactivation**: Inactive chats can be reactivated
3. **Message Dependency**: Chats with messages cannot be permanently deleted

## Error Handling

Common error scenarios:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Cannot create chat with yourself"
}

{
  "success": false,
  "statusCode": 409,
  "message": "Chat already exists between these users"
}

{
  "success": false,
  "statusCode": 404,
  "message": "User not found"
}

{
  "success": false,
  "statusCode": 403,
  "message": "You are not a participant in this chat"
}
```

## Usage Examples

### Creating a Chat

```typescript
import { ChatService } from './chat.service';

try {
  const chat = await ChatService.createChat(currentUserId, otherUserId);
  console.log('Chat created:', chat._id);
} catch (error) {
  if (error.statusCode === 409) {
    console.log('Chat already exists');
  } else {
    console.error('Failed to create chat:', error.message);
  }
}
```

### Getting User Chats

```typescript
const query = {
  status: true,  // Only active chats
  page: 1,
  limit: 20,
  sort: 'updatedAt',
  sortOrder: 'desc'
};

const chats = await ChatService.getUserChats(userId, query);
console.log(`User has ${chats.length} active chats`);
```

### Checking Chat Access

```typescript
const validateChatAccess = async (chatId: string, userId: string) => {
  const chat = await ChatService.getChatById(chatId, userId);
  if (!chat) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Access denied');
  }
  return chat;
};
```

## Integration Points

### With Message Module
- Provides chat context for messages
- Validates message sender is chat participant
- Updates chat timestamp when messages are sent
- Calculates unread message counts

### With User Module
- Validates participant user accounts
- Populates user information in chat responses
- Handles user status changes (active/inactive)

### With Task Module
- Auto-creates chats when bids are accepted
- Links chats to specific tasks for context
- Enables task-related communication

### With Notification Module
- Sends notifications for new chats
- Notifies about chat status changes
- Alerts for new messages in chats

## Real-time Features (Future)

### WebSocket Integration

```typescript
// Example WebSocket events
const chatEvents = {
  JOIN_CHAT: 'join_chat',
  LEAVE_CHAT: 'leave_chat',
  CHAT_CREATED: 'chat_created',
  CHAT_STATUS_CHANGED: 'chat_status_changed',
  USER_TYPING: 'user_typing',
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline'
};
```

### Online Status

```typescript
// Track user online status in chats
interface ChatWithOnlineStatus extends IChat {
  participants: Array<{
    user: IUser;
    isOnline: boolean;
    lastSeen: Date;
  }>;
}
```

## Performance Considerations

1. **Indexing**: 
   - Compound index on participants for fast lookups
   - Index on (participants, updatedAt) for user chat lists
   - Partial index for active chats only

2. **Population**: 
   - Selective field population for user data
   - Efficient aggregation for chat lists with message counts

3. **Caching**: 
   - Cache frequently accessed chats
   - Cache user chat lists
   - Real-time cache updates for active chats

## Security Measures

1. **Authentication**: All endpoints require valid JWT
2. **Authorization**: Participant-only access to chats
3. **Input Validation**: Validate user IDs and chat parameters
4. **Rate Limiting**: Prevent chat creation spam
5. **Privacy**: No cross-chat data leakage

## Future Enhancements

- [ ] Group chats (3+ participants)
- [ ] Chat archiving and search
- [ ] Chat templates for common scenarios
- [ ] Chat analytics and insights
- [ ] Chat moderation tools
- [ ] File sharing in chats
- [ ] Voice and video call integration
- [ ] Chat backup and export
- [ ] Chat encryption for sensitive communications
- [ ] Chat bots for automated responses