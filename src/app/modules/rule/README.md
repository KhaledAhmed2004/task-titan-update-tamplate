# Rule Module

## Overview

The Rule module manages platform rules, terms of service, privacy policies, and community guidelines for Task Titans. It provides a centralized system for storing, managing, and displaying various types of legal and policy content that govern platform usage.

## Features

- ✅ **Rule Management**: Create, update, and manage platform rules
- ✅ **Multiple Rule Types**: Support for different types of rules and policies
- ✅ **Version Control**: Track rule changes and maintain version history
- ✅ **Public Access**: Rules are publicly accessible without authentication
- ✅ **Admin Management**: Full CRUD operations for administrators
- ✅ **Content Formatting**: Support for rich text and HTML formatting
- ✅ **Effective Dates**: Manage when rules become effective

## Rule Types

```
TERMS_OF_SERVICE → Platform terms and conditions
PRIVACY_POLICY → Data privacy and protection policies
COMMUNITY_GUIDELINES → User behavior and community standards
SAFETY_RULES → Safety guidelines and best practices
PAYMENT_POLICY → Payment terms and refund policies
DISPUTE_RESOLUTION → Conflict resolution procedures
CONTENT_POLICY → Content creation and sharing guidelines
USER_CONDUCT → Acceptable use policies
```

## API Endpoints

### Public Endpoints (No Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/rules` | Get all active rules |
| `GET` | `/api/rules/type/:type` | Get rules by type |
| `GET` | `/api/rules/:id` | Get specific rule |
| `GET` | `/api/rules/latest/:type` | Get latest version of rule type |
| `GET` | `/api/rules/effective` | Get currently effective rules |

### Admin Endpoints (Requires Admin Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/rules` | Create new rule |
| `PUT` | `/api/admin/rules/:id` | Update rule |
| `DELETE` | `/api/admin/rules/:id` | Delete rule |
| `GET` | `/api/admin/rules/all` | Get all rules (including inactive) |
| `PUT` | `/api/admin/rules/:id/activate` | Activate rule |
| `PUT` | `/api/admin/rules/:id/deactivate` | Deactivate rule |
| `GET` | `/api/admin/rules/history/:type` | Get rule version history |
| `POST` | `/api/admin/rules/:id/publish` | Publish rule with effective date |

## Data Models

### Rule Interface

```typescript
export type IRule = {
  _id?: Types.ObjectId;
  content: string;                 // Rule content (HTML/Markdown supported)
  type: 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'COMMUNITY_GUIDELINES' | 
        'SAFETY_RULES' | 'PAYMENT_POLICY' | 'DISPUTE_RESOLUTION' | 
        'CONTENT_POLICY' | 'USER_CONDUCT';
  title?: string;                  // Rule title
  version?: string;                // Version number (e.g., "1.0", "2.1")
  isActive?: boolean;              // Whether rule is currently active
  effectiveDate?: Date;            // When rule becomes effective
  expirationDate?: Date;           // When rule expires (optional)
  lastModifiedBy?: Types.ObjectId; // Admin who last modified
  approvedBy?: Types.ObjectId;     // Admin who approved the rule
  approvalDate?: Date;             // When rule was approved
  changeLog?: string;              // Summary of changes made
  previousVersion?: Types.ObjectId; // Reference to previous version
  language?: string;               // Language code (default: 'en')
  metadata?: {
    wordCount?: number;
    readingTime?: number;          // Estimated reading time in minutes
    lastReview?: Date;
    reviewDue?: Date;
    tags?: string[];
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export type RuleModel = Model<IRule, Record<string, unknown>>;
```

### Rule Summary

```typescript
interface RuleSummary {
  type: string;
  title: string;
  version: string;
  effectiveDate: Date;
  lastModified: Date;
  wordCount: number;
  readingTime: number;
}
```

### Request/Response Examples

#### Get All Active Rules

**Request:**
```
GET /api/rules?language=en
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Rules retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439060",
      "type": "TERMS_OF_SERVICE",
      "title": "Terms of Service",
      "version": "2.1",
      "isActive": true,
      "effectiveDate": "2024-01-01T00:00:00.000Z",
      "metadata": {
        "wordCount": 2847,
        "readingTime": 12,
        "lastReview": "2024-01-15T10:00:00.000Z",
        "tags": ["legal", "terms", "service"]
      },
      "createdAt": "2023-12-15T14:30:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439061",
      "type": "PRIVACY_POLICY",
      "title": "Privacy Policy",
      "version": "1.3",
      "isActive": true,
      "effectiveDate": "2024-01-10T00:00:00.000Z",
      "metadata": {
        "wordCount": 1923,
        "readingTime": 8,
        "lastReview": "2024-01-10T09:00:00.000Z",
        "tags": ["privacy", "data", "gdpr"]
      },
      "createdAt": "2023-11-20T16:45:00.000Z",
      "updatedAt": "2024-01-10T09:00:00.000Z"
    }
  ],
  "summary": {
    "totalRules": 6,
    "activeRules": 6,
    "lastUpdated": "2024-01-15T10:00:00.000Z",
    "languages": ["en"]
  }
}
```

#### Get Specific Rule

**Request:**
```
GET /api/rules/507f1f77bcf86cd799439060
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Rule retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439060",
    "type": "TERMS_OF_SERVICE",
    "title": "Terms of Service",
    "content": "<h1>Terms of Service</h1><p>Welcome to Task Titans. By using our platform, you agree to the following terms...</p>",
    "version": "2.1",
    "isActive": true,
    "effectiveDate": "2024-01-01T00:00:00.000Z",
    "changeLog": "Updated payment terms and dispute resolution procedures",
    "metadata": {
      "wordCount": 2847,
      "readingTime": 12,
      "lastReview": "2024-01-15T10:00:00.000Z",
      "reviewDue": "2024-07-15T10:00:00.000Z",
      "tags": ["legal", "terms", "service"]
    },
    "createdAt": "2023-12-15T14:30:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

#### Create New Rule (Admin)

**Request:**
```json
{
  "type": "COMMUNITY_GUIDELINES",
  "title": "Community Guidelines",
  "content": "<h1>Community Guidelines</h1><p>Our community guidelines ensure a safe and respectful environment for all users...</p>",
  "version": "1.0",
  "effectiveDate": "2024-02-01T00:00:00.000Z",
  "changeLog": "Initial version of community guidelines",
  "metadata": {
    "tags": ["community", "guidelines", "behavior"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Rule created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439062",
    "type": "COMMUNITY_GUIDELINES",
    "title": "Community Guidelines",
    "content": "<h1>Community Guidelines</h1><p>Our community guidelines...",
    "version": "1.0",
    "isActive": false,
    "effectiveDate": "2024-02-01T00:00:00.000Z",
    "lastModifiedBy": "507f1f77bcf86cd799439010",
    "changeLog": "Initial version of community guidelines",
    "metadata": {
      "wordCount": 1456,
      "readingTime": 6,
      "tags": ["community", "guidelines", "behavior"]
    },
    "createdAt": "2024-01-15T16:30:00.000Z"
  }
}
```

#### Get Rule Version History (Admin)

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Rule history retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439060",
      "version": "2.1",
      "effectiveDate": "2024-01-01T00:00:00.000Z",
      "changeLog": "Updated payment terms and dispute resolution procedures",
      "isActive": true,
      "lastModifiedBy": {
        "name": "Admin User",
        "email": "admin@tasktitans.com"
      },
      "createdAt": "2023-12-15T14:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439059",
      "version": "2.0",
      "effectiveDate": "2023-10-01T00:00:00.000Z",
      "changeLog": "Major revision with updated liability clauses",
      "isActive": false,
      "expirationDate": "2023-12-31T23:59:59.000Z",
      "lastModifiedBy": {
        "name": "Legal Team",
        "email": "legal@tasktitans.com"
      },
      "createdAt": "2023-09-20T11:15:00.000Z"
    }
  ],
  "versionInfo": {
    "totalVersions": 3,
    "currentVersion": "2.1",
    "firstVersion": "1.0",
    "lastModified": "2024-01-15T10:00:00.000Z"
  }
}
```

## Service Methods

### Public Operations

- `getAllActiveRules(language?)` - Get all active rules
- `getRuleById(ruleId)` - Get specific rule by ID
- `getRulesByType(type, includeInactive?)` - Get rules by type
- `getLatestRuleVersion(type)` - Get latest version of rule type
- `getEffectiveRules(date?)` - Get rules effective on specific date
- `searchRules(query, filters?)` - Search rules by content

### Admin Operations

- `createRule(ruleData, adminId)` - Create new rule
- `updateRule(ruleId, updateData, adminId)` - Update existing rule
- `deleteRule(ruleId, adminId)` - Delete rule
- `activateRule(ruleId, adminId)` - Activate rule
- `deactivateRule(ruleId, adminId)` - Deactivate rule
- `publishRule(ruleId, effectiveDate, adminId)` - Publish rule with effective date
- `getAllRules(includeInactive?)` - Get all rules (admin view)

### Version Management

- `getRuleHistory(type)` - Get version history for rule type
- `createNewVersion(ruleId, changes, adminId)` - Create new version
- `compareVersions(version1Id, version2Id)` - Compare rule versions
- `rollbackToVersion(ruleId, targetVersionId, adminId)` - Rollback to previous version

### Utility Methods

- `calculateReadingTime(content)` - Calculate estimated reading time
- `validateRuleContent(content)` - Validate rule content format
- `generateRuleSummary(ruleId)` - Generate rule summary
- `scheduleRuleReview(ruleId, reviewDate)` - Schedule rule review
- `exportRules(format, types?)` - Export rules in various formats

## Database Schema

```javascript
const ruleSchema = new Schema({
  content: {
    type: String,
    required: true,
    maxlength: 50000
  },
  type: {
    type: String,
    enum: [
      'TERMS_OF_SERVICE',
      'PRIVACY_POLICY', 
      'COMMUNITY_GUIDELINES',
      'SAFETY_RULES',
      'PAYMENT_POLICY',
      'DISPUTE_RESOLUTION',
      'CONTENT_POLICY',
      'USER_CONDUCT'
    ],
    required: true,
    index: true
  },
  title: {
    type: String,
    maxlength: 200,
    trim: true
  },
  version: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d+\.\d+(\.\d+)?$/.test(v);
      },
      message: 'Version must be in format X.Y or X.Y.Z'
    }
  },
  isActive: {
    type: Boolean,
    default: false,
    index: true
  },
  effectiveDate: {
    type: Date,
    index: true
  },
  expirationDate: {
    type: Date,
    index: true
  },
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: {
    type: Date
  },
  changeLog: {
    type: String,
    maxlength: 1000
  },
  previousVersion: {
    type: Schema.Types.ObjectId,
    ref: 'Rule'
  },
  language: {
    type: String,
    default: 'en',
    maxlength: 5
  },
  metadata: {
    wordCount: {
      type: Number,
      min: 0
    },
    readingTime: {
      type: Number,
      min: 0
    },
    lastReview: {
      type: Date
    },
    reviewDue: {
      type: Date
    },
    tags: [{
      type: String,
      lowercase: true,
      trim: true
    }]
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
ruleSchema.index({ type: 1, isActive: 1, effectiveDate: -1 });
ruleSchema.index({ type: 1, version: 1 }, { unique: true });
ruleSchema.index({ effectiveDate: 1, expirationDate: 1 });
ruleSchema.index({ 'metadata.reviewDue': 1 });

// Text index for content search
ruleSchema.index({ 
  title: 'text', 
  content: 'text', 
  'metadata.tags': 'text' 
});

// Pre-save middleware to calculate metadata
ruleSchema.pre('save', function() {
  if (this.isModified('content')) {
    // Calculate word count
    const plainText = this.content.replace(/<[^>]*>/g, '');
    this.metadata = this.metadata || {};
    this.metadata.wordCount = plainText.split(/\s+/).length;
    
    // Calculate reading time (average 200 words per minute)
    this.metadata.readingTime = Math.ceil(this.metadata.wordCount / 200);
  }
});

// Ensure only one active rule per type
ruleSchema.pre('save', async function() {
  if (this.isActive && this.isModified('isActive')) {
    await this.constructor.updateMany(
      { type: this.type, _id: { $ne: this._id } },
      { isActive: false }
    );
  }
});
```

## Business Rules

### Rule Creation and Management

1. **Admin Only**: Only administrators can create, update, or delete rules
2. **Version Control**: Each rule type maintains version history
3. **Single Active Rule**: Only one rule per type can be active at a time
4. **Effective Dating**: Rules can have future effective dates
5. **Content Validation**: Rule content must be valid HTML/Markdown

### Rule Activation

1. **Approval Required**: Rules must be approved before activation
2. **Effective Date**: Rules become effective on specified date
3. **Automatic Deactivation**: Previous versions are automatically deactivated
4. **Expiration Support**: Rules can have optional expiration dates
5. **Change Logging**: All changes must be documented

### Public Access

1. **No Authentication**: Rules are publicly accessible
2. **Active Rules Only**: Only active rules are shown to public
3. **Current Versions**: Always show the latest active version
4. **Language Support**: Support for multiple languages
5. **SEO Friendly**: Rules are indexed for search engines

## Error Handling

Common error scenarios:

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Rule not found"
}

{
  "success": false,
  "statusCode": 403,
  "message": "Admin access required"
}

{
  "success": false,
  "statusCode": 400,
  "message": "Invalid version format. Use X.Y or X.Y.Z"
}

{
  "success": false,
  "statusCode": 400,
  "message": "Rule content cannot exceed 50,000 characters"
}

{
  "success": false,
  "statusCode": 409,
  "message": "Rule version already exists for this type"
}

{
  "success": false,
  "statusCode": 400,
  "message": "Effective date cannot be in the past"
}
```

## Usage Examples

### Creating a New Rule (Admin)

```typescript
import { RuleService } from './rule.service';

const createCommunityGuidelines = async (adminId: string) => {
  const ruleData = {
    type: 'COMMUNITY_GUIDELINES' as const,
    title: 'Community Guidelines',
    content: `
      <h1>Community Guidelines</h1>
      <p>Welcome to our community! These guidelines help ensure a positive experience for everyone.</p>
      <h2>Respectful Communication</h2>
      <p>Treat all community members with respect and courtesy...</p>
    `,
    version: '1.0',
    effectiveDate: new Date('2024-02-01'),
    changeLog: 'Initial version of community guidelines',
    metadata: {
      tags: ['community', 'guidelines', 'behavior']
    }
  };

  try {
    const rule = await RuleService.createRule(ruleData, adminId);
    console.log('Rule created:', rule._id);
    return rule;
  } catch (error) {
    console.error('Failed to create rule:', error.message);
    throw error;
  }
};
```

### Getting Active Rules for Display

```typescript
const displayRules = async () => {
  try {
    const rules = await RuleService.getAllActiveRules('en');
    
    for (const rule of rules) {
      console.log(`${rule.title} (v${rule.version})`);
      console.log(`Reading time: ${rule.metadata?.readingTime} minutes`);
      console.log(`Effective: ${rule.effectiveDate}`);
      console.log('---');
    }
  } catch (error) {
    console.error('Failed to get rules:', error.message);
  }
};
```

### Updating Rule Version

```typescript
const updateTermsOfService = async (ruleId: string, adminId: string) => {
  const updateData = {
    content: '<!-- Updated terms content -->',
    version: '2.2',
    changeLog: 'Updated payment processing terms and added new dispute resolution procedures',
    effectiveDate: new Date('2024-03-01'),
    metadata: {
      tags: ['legal', 'terms', 'service', 'payment', 'disputes']
    }
  };

  try {
    const updatedRule = await RuleService.updateRule(ruleId, updateData, adminId);
    console.log('Rule updated to version:', updatedRule.version);
    return updatedRule;
  } catch (error) {
    console.error('Failed to update rule:', error.message);
    throw error;
  }
};
```

### Scheduling Rule Review

```typescript
const scheduleQuarterlyReview = async () => {
  const rules = await RuleService.getAllActiveRules();
  
  for (const rule of rules) {
    const reviewDate = new Date();
    reviewDate.setMonth(reviewDate.getMonth() + 3); // 3 months from now
    
    await RuleService.scheduleRuleReview(rule._id, reviewDate);
    console.log(`Scheduled review for ${rule.title} on ${reviewDate.toDateString()}`);
  }
};
```

## Integration Points

### With User Module
- Track admin users who manage rules
- Log rule management activities
- Handle user permissions for rule access

### With Legal/Compliance
- Ensure legal compliance for all rule content
- Track approval workflows
- Maintain audit trails for legal purposes

### With Notification Module
- Notify users about rule changes
- Send reminders for rule reviews
- Alert admins about pending approvals

### With Content Management
- Support rich text editing for rule content
- Handle media attachments in rules
- Manage rule content versioning

## SEO and Legal Considerations

### SEO Optimization

```typescript
interface RuleSEO {
  title: string;
  metaDescription: string;
  canonicalUrl: string;
  lastModified: Date;
  structuredData: object;
}
```

### Legal Compliance

- GDPR compliance for privacy policies
- Terms of service legal requirements
- Jurisdiction-specific rule variations
- Regular legal review scheduling
- Change notification requirements

## Performance Considerations

1. **Indexing**: 
   - Index on type and active status
   - Text indexes for content search
   - Date indexes for effective dates

2. **Caching**: 
   - Cache active rules for public access
   - Cache rule summaries
   - CDN caching for static rule content

3. **Content Optimization**: 
   - Compress large rule content
   - Lazy load rule content
   - Optimize HTML rendering

4. **Version Management**: 
   - Efficient version comparison
   - Optimized history queries
   - Archive old versions

## Security Measures

1. **Admin Authentication**: Secure admin endpoints with proper authentication
2. **Content Sanitization**: Sanitize HTML content to prevent XSS
3. **Input Validation**: Validate all rule data before saving
4. **Audit Logging**: Log all rule changes and access
5. **Version Control**: Maintain complete change history
6. **Access Control**: Restrict rule management to authorized admins

## Future Enhancements

- [ ] Multi-language rule support
- [ ] Rule approval workflow system
- [ ] Advanced content editor with WYSIWYG
- [ ] Rule comparison and diff visualization
- [ ] Automated rule review reminders
- [ ] Integration with legal document management
- [ ] Rule analytics and user engagement tracking
- [ ] Mobile-optimized rule display
- [ ] Rule search and filtering improvements
- [ ] Bulk rule operations
- [ ] Rule template system
- [ ] Integration with external legal services