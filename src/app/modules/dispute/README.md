# Dispute Module

The Dispute module handles conflict resolution between task posters and freelancers in the Task Titans platform. It provides a structured process for raising, managing, and resolving disputes with admin oversight.

## Features

### Core Functionality
- **Dispute Creation**: Users can create disputes for various issues
- **Evidence Management**: Upload and manage supporting evidence
- **Admin Review**: Structured admin review and resolution process
- **Payment Handling**: Automatic payment resolution based on dispute outcome
- **Notification System**: Keep all parties informed throughout the process

### Dispute Types
- `QUALITY_ISSUE`: Issues with delivery quality
- `SCOPE_CREEP`: Work beyond agreed scope
- `COMMUNICATION_PROBLEM`: Communication breakdowns
- `PAYMENT_ISSUE`: Payment-related disputes
- `DEADLINE_MISSED`: Missed deadline issues
- `OTHER`: Other types of disputes

### Dispute Statuses
- `OPEN`: Newly created dispute
- `UNDER_REVIEW`: Being reviewed by admin
- `RESOLVED`: Dispute resolved by admin
- `CLOSED`: Dispute closed (no action needed)

### Resolution Types
- `FULL_REFUND`: Full refund to task poster
- `RELEASE_TO_FREELANCER`: Release payment to freelancer
- `PARTIAL_REFUND`: Partial refund with percentage split
- `NO_ACTION`: No payment action required

## API Endpoints

### Dispute Management
- `POST /api/disputes` - Create a new dispute
- `GET /api/disputes/:disputeId` - Get dispute by ID
- `GET /api/disputes/user/my-disputes` - Get user's disputes
- `GET /api/disputes/task/:taskId` - Get disputes for a task

### Evidence Management
- `POST /api/disputes/:disputeId/evidence` - Add evidence to dispute

### Admin Operations
- `PATCH /api/disputes/:disputeId/status` - Update dispute status (Admin)
- `POST /api/disputes/:disputeId/resolve` - Resolve dispute (Admin)
- `GET /api/disputes/admin/stats` - Get dispute statistics (Admin)
- `GET /api/disputes/admin/all` - Get all disputes (Admin)

## Data Models

### Dispute Schema
```typescript
interface IDispute {
  _id: string;
  taskId: ObjectId;
  posterId: ObjectId;
  freelancerId: ObjectId;
  type: DisputeType;
  status: DisputeStatus;
  priority: DisputePriority;
  title: string;
  description: string;
  evidence: IDisputeEvidence[];
  resolution?: IDisputeResolutionDetails;
  createdAt: Date;
  updatedAt: Date;
  reviewStartedAt?: Date;
  reviewedBy?: ObjectId;
}
```

### Evidence Schema
```typescript
interface IDisputeEvidence {
  _id: string;
  type: 'screenshot' | 'document' | 'communication' | 'other';
  description: string;
  attachments: string[];
  submittedBy: ObjectId;
  submittedAt: Date;
}
```

### Resolution Schema
```typescript
interface IDisputeResolutionDetails {
  decision: DisputeResolution;
  resolvedBy: ObjectId;
  resolvedAt: Date;
  adminNotes: string;
  refundPercentage: number;
}
```

## Usage Examples

### Create a Dispute
```javascript
POST /api/disputes
{
  "taskId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "type": "QUALITY_ISSUE",
  "title": "Delivered work does not match requirements",
  "description": "The freelancer delivered a basic website template instead of the custom design specified in the task requirements. The work lacks the requested features and design elements.",
  "evidence": [
    {
      "type": "screenshot",
      "description": "Screenshot of delivered work vs requirements",
      "attachments": ["https://storage.example.com/evidence/screenshot1.png"]
    }
  ]
}
```

### Add Evidence
```javascript
POST /api/disputes/:disputeId/evidence
{
  "type": "document",
  "description": "Original task requirements document showing specific design elements",
  "attachments": [
    "https://storage.example.com/evidence/requirements.pdf"
  ]
}
```

### Resolve Dispute (Admin)
```javascript
POST /api/disputes/:disputeId/resolve
{
  "resolution": "PARTIAL_REFUND",
  "adminNotes": "After reviewing the evidence, the delivered work partially meets requirements but lacks some specified features. A 60% refund is appropriate.",
  "refundPercentage": 60
}
```

## Workflow Process

### 1. Dispute Creation
- User identifies an issue with a task
- Creates dispute with type, description, and initial evidence
- System notifies all parties and updates task status to 'disputed'

### 2. Evidence Gathering
- Both parties can add supporting evidence
- Evidence includes screenshots, documents, communication logs
- System tracks all evidence with timestamps and submitters

### 3. Admin Review
- Admin reviews all evidence and communications
- May request additional information from parties
- Updates dispute status to 'under_review'

### 4. Resolution
- Admin makes resolution decision based on evidence
- System automatically handles payment based on resolution
- All parties are notified of the outcome
- Task status is updated accordingly

## Integration

The Dispute module integrates with:
- **Task Module**: Updates task status during disputes
- **Payment Module**: Handles refunds and payment releases
- **Notification Module**: Sends dispute-related notifications
- **User Module**: Associates disputes with users
- **Delivery Module**: Links to delivery-related disputes

## Priority System

### Priority Levels
- `LOW`: Minor issues, non-urgent
- `MEDIUM`: Standard disputes requiring attention
- `HIGH`: Urgent issues affecting platform reputation
- `CRITICAL`: Severe issues requiring immediate attention

### Auto-Escalation
- Disputes auto-escalate priority based on age
- High-value tasks get higher initial priority
- Repeat offenders trigger priority increases

## Admin Dashboard Features

### Statistics
- Total disputes by status and type
- Average resolution time
- Resolution rate and outcomes
- User dispute history

### Management Tools
- Bulk status updates
- Evidence review interface
- Communication timeline
- Payment action controls

## Security & Validation

### Access Control
- Users can only view disputes they're involved in
- Admin-only operations properly protected
- Evidence submission restricted to dispute parties

### Data Validation
- Comprehensive input validation
- File upload security for evidence
- Dispute workflow state validation
- Payment action authorization

### Audit Trail
- Complete history of dispute actions
- Evidence submission tracking
- Admin decision logging
- Payment transaction records

## Error Handling

Robust error handling for:
- Invalid dispute creation attempts
- Unauthorized access to disputes
- Payment processing failures
- Evidence upload issues
- Workflow state violations