# FAQ Module

## Overview

The FAQ (Frequently Asked Questions) module manages the knowledge base for Task Titans. It provides users with quick access to common questions and answers, reducing support tickets and improving user experience. The module supports categorized FAQs, search functionality, and admin management.

## Features

- ✅ **Question & Answer Management**: Create, update, and delete FAQ entries
- ✅ **Search Functionality**: Search FAQs by keywords
- ✅ **Category Organization**: Organize FAQs by topics
- ✅ **Public Access**: No authentication required for viewing FAQs
- ✅ **Admin Management**: Full CRUD operations for administrators
- ✅ **Usage Tracking**: Track FAQ view counts and popular questions
- ✅ **Content Formatting**: Support for rich text in answers

## FAQ Categories

```
GENERAL → Basic platform information
ACCOUNT → User account and profile management
TASKS → Task creation, management, and completion
BIDDING → Bidding process and guidelines
PAYMENTS → Payment methods and transactions
SAFETY → Safety guidelines and dispute resolution
TECHNICAL → Technical issues and troubleshooting
```

## API Endpoints

### Public Endpoints (No Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/faqs` | Get all FAQs |
| `GET` | `/api/faqs/search` | Search FAQs |
| `GET` | `/api/faqs/categories` | Get FAQ categories |
| `GET` | `/api/faqs/:id` | Get specific FAQ |
| `GET` | `/api/faqs/popular` | Get most viewed FAQs |

### Admin Endpoints (Requires Admin Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/faqs` | Create new FAQ |
| `PUT` | `/api/admin/faqs/:id` | Update FAQ |
| `DELETE` | `/api/admin/faqs/:id` | Delete FAQ |
| `GET` | `/api/admin/faqs/stats` | Get FAQ statistics |
| `PUT` | `/api/admin/faqs/:id/publish` | Publish/unpublish FAQ |

## Data Models

### FAQ Interface

```typescript
export type IFaq = {
  _id?: Types.ObjectId;
  question: string;                // FAQ question
  answer: string;                  // FAQ answer (supports HTML/markdown)
  category?: string;               // FAQ category
  tags?: string[];                 // Search tags
  isPublished?: boolean;           // Publication status
  viewCount?: number;              // Number of views
  helpfulCount?: number;           // "Was this helpful?" positive votes
  notHelpfulCount?: number;        // "Was this helpful?" negative votes
  lastUpdatedBy?: Types.ObjectId;  // Admin who last updated
  priority?: number;               // Display priority (higher = shown first)
  relatedFaqs?: Types.ObjectId[];  // Related FAQ IDs
  createdAt?: Date;
  updatedAt?: Date;
}

export type FaqModel = Model<IFaq, Record<string, unknown>>;
```

### FAQ Category

```typescript
interface FaqCategory {
  name: string;
  description?: string;
  icon?: string;
  faqCount: number;
  displayOrder: number;
}
```

### Request/Response Examples

#### Get All FAQs

**Request:**
```
GET /api/faqs?category=TASKS&limit=10&page=1
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "FAQs retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439050",
      "question": "How do I create a new task?",
      "answer": "To create a new task, click the 'Post a Task' button on your dashboard. Fill in the task details including title, description, budget, and deadline. Once submitted, your task will be visible to potential bidders.",
      "category": "TASKS",
      "tags": ["create", "task", "posting", "new"],
      "isPublished": true,
      "viewCount": 1247,
      "helpfulCount": 89,
      "notHelpfulCount": 3,
      "priority": 10,
      "createdAt": "2024-01-10T09:00:00.000Z",
      "updatedAt": "2024-01-14T15:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439051",
      "question": "What happens after I accept a bid?",
      "answer": "After accepting a bid, the task status changes to 'In Progress' and a chat is automatically created between you and the selected bidder. You can communicate directly to discuss project details and timeline.",
      "category": "TASKS",
      "tags": ["accept", "bid", "progress", "chat"],
      "isPublished": true,
      "viewCount": 892,
      "helpfulCount": 76,
      "notHelpfulCount": 2,
      "priority": 9,
      "createdAt": "2024-01-10T09:15:00.000Z",
      "updatedAt": "2024-01-12T11:20:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  },
  "categories": [
    {
      "name": "TASKS",
      "description": "Task creation and management",
      "faqCount": 12
    }
  ]
}
```

#### Search FAQs

**Request:**
```
GET /api/faqs/search?q=payment&category=PAYMENTS
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Search results retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439052",
      "question": "How do I add a payment method?",
      "answer": "Go to your Account Settings > Payment Methods. Click 'Add Payment Method' and choose between credit card, PayPal, or bank transfer. Follow the verification steps to activate your payment method.",
      "category": "PAYMENTS",
      "tags": ["payment", "method", "add", "credit card", "paypal"],
      "relevanceScore": 0.95,
      "matchedTerms": ["payment"],
      "viewCount": 567,
      "helpfulCount": 45,
      "createdAt": "2024-01-10T10:00:00.000Z"
    }
  ],
  "searchInfo": {
    "query": "payment",
    "totalResults": 8,
    "searchTime": "0.023s"
  }
}
```

#### Get Popular FAQs

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Popular FAQs retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439050",
      "question": "How do I create a new task?",
      "answer": "To create a new task, click the 'Post a Task' button...",
      "category": "TASKS",
      "viewCount": 1247,
      "helpfulCount": 89,
      "helpfulnessRatio": 0.97
    }
  ]
}
```

#### Create FAQ (Admin)

**Request:**
```json
{
  "question": "How long does it take to verify my account?",
  "answer": "Account verification typically takes 24-48 hours. You'll receive an email notification once your account is verified. During peak times, it may take up to 72 hours.",
  "category": "ACCOUNT",
  "tags": ["verification", "account", "time", "email"],
  "priority": 8,
  "isPublished": true
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "FAQ created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439053",
    "question": "How long does it take to verify my account?",
    "answer": "Account verification typically takes 24-48 hours...",
    "category": "ACCOUNT",
    "tags": ["verification", "account", "time", "email"],
    "priority": 8,
    "isPublished": true,
    "viewCount": 0,
    "helpfulCount": 0,
    "notHelpfulCount": 0,
    "createdAt": "2024-01-15T16:00:00.000Z"
  }
}
```

## Service Methods

### Public Operations

- `getAllFaqs(query?)` - Get all published FAQs
- `getFaqById(faqId)` - Get specific FAQ and increment view count
- `searchFaqs(searchQuery, filters?)` - Search FAQs by keywords
- `getFaqsByCategory(category, query?)` - Get FAQs by category
- `getPopularFaqs(limit?)` - Get most viewed FAQs
- `getFaqCategories()` - Get all FAQ categories with counts
- `markFaqHelpful(faqId, helpful)` - Mark FAQ as helpful/not helpful

### Admin Operations

- `createFaq(faqData, adminId)` - Create new FAQ
- `updateFaq(faqId, updateData, adminId)` - Update existing FAQ
- `deleteFaq(faqId, adminId)` - Delete FAQ
- `publishFaq(faqId, published, adminId)` - Publish/unpublish FAQ
- `getFaqStats(dateRange?)` - Get FAQ statistics
- `bulkUpdateFaqs(updates, adminId)` - Bulk update FAQs

### Utility Methods

- `getRelatedFaqs(faqId, limit?)` - Get related FAQs
- `generateFaqSitemap()` - Generate sitemap for SEO
- `exportFaqs(format)` - Export FAQs (JSON, CSV)
- `importFaqs(data, adminId)` - Import FAQs from file

## Database Schema

```javascript
const faqSchema = new Schema({
  question: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true,
    index: 'text'
  },
  answer: {
    type: String,
    required: true,
    maxlength: 5000,
    trim: true,
    index: 'text'
  },
  category: {
    type: String,
    enum: ['GENERAL', 'ACCOUNT', 'TASKS', 'BIDDING', 'PAYMENTS', 'SAFETY', 'TECHNICAL'],
    default: 'GENERAL',
    index: true
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  isPublished: {
    type: Boolean,
    default: false,
    index: true
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  helpfulCount: {
    type: Number,
    default: 0,
    min: 0
  },
  notHelpfulCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  priority: {
    type: Number,
    default: 5,
    min: 1,
    max: 10
  },
  relatedFaqs: [{
    type: Schema.Types.ObjectId,
    ref: 'Faq'
  }]
}, {
  timestamps: true
});

// Text index for search functionality
faqSchema.index({ 
  question: 'text', 
  answer: 'text', 
  tags: 'text' 
}, {
  weights: {
    question: 10,
    tags: 5,
    answer: 1
  }
});

// Compound indexes for efficient queries
faqSchema.index({ category: 1, isPublished: 1, priority: -1 });
faqSchema.index({ isPublished: 1, viewCount: -1 });
faqSchema.index({ isPublished: 1, createdAt: -1 });

// Virtual for helpfulness ratio
faqSchema.virtual('helpfulnessRatio').get(function() {
  const total = this.helpfulCount + this.notHelpfulCount;
  return total > 0 ? this.helpfulCount / total : 0;
});
```

## Business Rules

### FAQ Creation and Management

1. **Admin Only**: Only administrators can create, update, or delete FAQs
2. **Publication Control**: FAQs must be explicitly published to be visible
3. **Content Limits**: Questions limited to 500 characters, answers to 5000
4. **Category Assignment**: All FAQs must be assigned to a valid category
5. **Unique Questions**: Prevent duplicate questions within same category

### Search and Discovery

1. **Public Access**: All published FAQs are publicly accessible
2. **Search Ranking**: Results ranked by relevance and popularity
3. **View Tracking**: Increment view count on FAQ access
4. **Related FAQs**: Show related FAQs based on tags and category
5. **Popular FAQs**: Highlight most viewed and helpful FAQs

### Content Quality

1. **Rich Text Support**: Answers can include HTML formatting
2. **Tag Management**: Use relevant tags for better searchability
3. **Priority System**: Higher priority FAQs appear first
4. **Helpfulness Voting**: Users can vote on FAQ helpfulness
5. **Regular Updates**: Keep FAQ content current and accurate

## Error Handling

Common error scenarios:

```json
{
  "success": false,
  "statusCode": 404,
  "message": "FAQ not found"
}

{
  "success": false,
  "statusCode": 403,
  "message": "Admin access required"
}

{
  "success": false,
  "statusCode": 400,
  "message": "Question cannot exceed 500 characters"
}

{
  "success": false,
  "statusCode": 400,
  "message": "Answer cannot exceed 5000 characters"
}

{
  "success": false,
  "statusCode": 400,
  "message": "Invalid FAQ category"
}

{
  "success": false,
  "statusCode": 409,
  "message": "FAQ with similar question already exists in this category"
}
```

## Usage Examples

### Getting FAQs by Category

```typescript
import { FaqService } from './faq.service';

const query = {
  category: 'TASKS',
  page: 1,
  limit: 10,
  sort: 'priority',
  sortOrder: 'desc' as const
};

try {
  const faqs = await FaqService.getAllFaqs(query);
  console.log(`Retrieved ${faqs.length} FAQs`);
} catch (error) {
  console.error('Failed to get FAQs:', error.message);
}
```

### Searching FAQs

```typescript
const searchResults = await FaqService.searchFaqs('payment method', {
  category: 'PAYMENTS',
  limit: 5
});

for (const faq of searchResults) {
  console.log(`${faq.question} (Score: ${faq.relevanceScore})`);
}
```

### Creating a New FAQ (Admin)

```typescript
const faqData = {
  question: 'How do I cancel a task?',
  answer: 'You can cancel a task from your dashboard by clicking the "Cancel Task" button. Note that cancellation policies may apply depending on the task status.',
  category: 'TASKS',
  tags: ['cancel', 'task', 'dashboard'],
  priority: 7,
  isPublished: true
};

const newFaq = await FaqService.createFaq(faqData, adminId);
console.log('FAQ created:', newFaq._id);
```

### Marking FAQ as Helpful

```typescript
// User found the FAQ helpful
await FaqService.markFaqHelpful(faqId, true);

// User found the FAQ not helpful
await FaqService.markFaqHelpful(faqId, false);
```

## Integration Points

### With User Module
- Track admin users who manage FAQs
- Log FAQ management activities
- Handle user permissions for admin operations

### With Search Module
- Provide search functionality across FAQ content
- Index FAQ content for full-text search
- Track search queries and popular terms

### With Analytics Module
- Track FAQ view counts and popularity
- Monitor search queries and success rates
- Generate FAQ usage reports

### With Content Management
- Support rich text formatting in answers
- Handle media attachments in FAQ answers
- Manage FAQ content versioning

## SEO and Discoverability

### Search Engine Optimization

```typescript
interface FaqSEO {
  title: string;           // SEO-friendly title
  metaDescription: string; // Meta description for search results
  slug: string;           // URL-friendly slug
  canonicalUrl: string;   // Canonical URL for duplicate content
  structuredData: object; // JSON-LD structured data
}
```

### URL Structure

```
/help/faqs                          // All FAQs
/help/faqs/tasks                    // FAQs by category
/help/faqs/how-do-i-create-a-task   // Individual FAQ
/help/search?q=payment              // Search results
```

## Performance Considerations

1. **Indexing**: 
   - Text indexes for search functionality
   - Category and publication status indexes
   - Priority-based sorting indexes

2. **Caching**: 
   - Cache popular FAQs and categories
   - Cache search results for common queries
   - CDN caching for static FAQ content

3. **Search Optimization**: 
   - Weighted text search with relevance scoring
   - Search result pagination
   - Search query optimization

4. **Content Delivery**: 
   - Lazy loading for large FAQ lists
   - Pagination for better performance
   - Compressed content delivery

## Security Measures

1. **Admin Authentication**: Secure admin endpoints with proper authentication
2. **Content Sanitization**: Sanitize HTML content in FAQ answers
3. **Input Validation**: Validate all FAQ data before saving
4. **Rate Limiting**: Prevent abuse of search functionality
5. **XSS Prevention**: Escape user-generated content
6. **CSRF Protection**: Protect admin forms from CSRF attacks

## Future Enhancements

- [ ] Multi-language FAQ support
- [ ] FAQ voting and rating system
- [ ] FAQ comment system for clarifications
- [ ] Advanced search filters and facets
- [ ] FAQ analytics dashboard
- [ ] Automated FAQ suggestions based on support tickets
- [ ] FAQ content versioning and history
- [ ] Integration with chatbot for automated responses
- [ ] FAQ content approval workflow
- [ ] FAQ performance metrics and optimization
- [ ] Video and multimedia FAQ answers
- [ ] FAQ personalization based on user behavior