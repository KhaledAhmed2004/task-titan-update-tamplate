# Category Module

## Overview

The Category module manages task categorization, allowing tasks to be organized into logical groups for better discoverability and filtering. Categories help users find relevant tasks and provide structure to the platform.

## Features

- ✅ **Category Management**: Create, read, update, and delete categories
- ✅ **Task Association**: Link tasks to specific categories
- ✅ **Hierarchical Structure**: Support for category organization
- ✅ **Search & Filter**: Find categories by name and description
- ✅ **Validation**: Ensure category integrity before task creation

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/categories` | Get all categories |
| `GET` | `/api/categories/:id` | Get category by ID |

### Protected Endpoints (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/categories` | Create new category |
| `PUT` | `/api/categories/:id` | Update category |
| `DELETE` | `/api/categories/:id` | Delete category |

## Data Models

### Category Interface

```typescript
export interface ICategory {
  _id?: Types.ObjectId;
  name: string;             // Category name (required)
  description?: string;     // Optional description
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Request/Response Examples

#### Create Category

**Request:**
```json
{
  "name": "Electronics",
  "description": "Tasks related to electronic devices, repairs, and installations"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Category created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Electronics",
    "description": "Tasks related to electronic devices, repairs, and installations",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Get All Categories

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Electronics",
      "description": "Tasks related to electronic devices, repairs, and installations",
      "taskCount": 25,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Home Maintenance",
      "description": "Household repairs, cleaning, and maintenance tasks",
      "taskCount": 18,
      "createdAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

#### Update Category

**Request:**
```json
{
  "name": "Electronics & Technology",
  "description": "Tasks related to electronic devices, technology setup, repairs, and installations"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Category updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Electronics & Technology",
    "description": "Tasks related to electronic devices, technology setup, repairs, and installations",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

## Service Methods

### Core Operations

- `createCategory(categoryData)` - Create new category with validation
- `getAllCategories(query?)` - Get all categories with optional filtering
- `getCategoryById(categoryId)` - Get single category with task count
- `updateCategory(categoryId, updateData)` - Update category details
- `deleteCategory(categoryId)` - Delete category (with dependency check)
- `getCategoryStats()` - Get category usage statistics

## Database Schema

```javascript
const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  }
}, {
  timestamps: true
});

// Index for efficient name searches
categorySchema.index({ name: 1 });

// Text index for search functionality
categorySchema.index({ 
  name: 'text', 
  description: 'text' 
});
```

## Business Rules

### Category Creation

1. **Unique Names**: Category names must be unique (case-insensitive)
2. **Name Requirements**: 
   - Minimum 2 characters
   - Maximum 50 characters
   - No special characters except spaces, hyphens, and ampersands
3. **Description**: Optional, maximum 200 characters
4. **Admin Only**: Only administrators can create categories

### Category Updates

1. **Name Uniqueness**: Updated names must remain unique
2. **Validation**: Same validation rules as creation
3. **Admin Only**: Only administrators can update categories

### Category Deletion

1. **Dependency Check**: Cannot delete categories with associated tasks
2. **Cascade Options**: Provide option to reassign tasks to another category
3. **Admin Only**: Only administrators can delete categories

## Error Handling

Common error scenarios:

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Category name already exists"
}

{
  "success": false,
  "statusCode": 400,
  "message": "Category name must be between 2 and 50 characters"
}

{
  "success": false,
  "statusCode": 409,
  "message": "Cannot delete category with associated tasks"
}

{
  "success": false,
  "statusCode": 404,
  "message": "Category not found"
}
```

## Usage Examples

### Creating a Category

```typescript
import { CategoryService } from './category.service';

const categoryData = {
  name: 'Web Development',
  description: 'Website creation, maintenance, and web application development'
};

try {
  const category = await CategoryService.createCategory(categoryData);
  console.log('Category created:', category.name);
} catch (error) {
  console.error('Failed to create category:', error.message);
}
```

### Getting Categories with Task Count

```typescript
const categories = await CategoryService.getAllCategories();
categories.forEach(category => {
  console.log(`${category.name}: ${category.taskCount} tasks`);
});
```

### Validating Category for Task Creation

```typescript
// In task service
const validateCategory = async (categoryId: string) => {
  const category = await CategoryService.getCategoryById(categoryId);
  if (!category) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid category ID');
  }
  return category;
};
```

## Integration Points

### With Task Module
- Validates category existence during task creation
- Provides category information for task listings
- Supports task filtering by category
- Prevents category deletion when tasks exist

### With Search Module
- Enables category-based task filtering
- Supports category name and description search
- Provides category suggestions for task creation

## Common Categories

Suggested default categories for the platform:

```typescript
const defaultCategories = [
  {
    name: 'Electronics',
    description: 'Electronic device repairs, installations, and troubleshooting'
  },
  {
    name: 'Home Maintenance',
    description: 'Household repairs, cleaning, and maintenance tasks'
  },
  {
    name: 'Web Development',
    description: 'Website creation, maintenance, and web applications'
  },
  {
    name: 'Graphic Design',
    description: 'Logo design, branding, and visual content creation'
  },
  {
    name: 'Writing & Translation',
    description: 'Content writing, copywriting, and translation services'
  },
  {
    name: 'Photography',
    description: 'Photo shoots, editing, and visual documentation'
  },
  {
    name: 'Tutoring',
    description: 'Educational support and skill training'
  },
  {
    name: 'Delivery & Transportation',
    description: 'Package delivery, moving, and transportation services'
  }
];
```

## Performance Considerations

1. **Indexing**: 
   - Unique index on name for fast lookups
   - Text index for search functionality
   - Consider compound indexes for complex queries

2. **Caching**: 
   - Cache frequently accessed categories
   - Cache category statistics
   - Implement cache invalidation on updates

3. **Aggregation**: 
   - Use MongoDB aggregation for task counts
   - Optimize category statistics queries

## Security Measures

1. **Authorization**: Admin-only access for CUD operations
2. **Input Validation**: Sanitize category names and descriptions
3. **Rate Limiting**: Prevent category creation spam
4. **Audit Logging**: Track category changes for compliance

## Future Enhancements

- [ ] Hierarchical categories (parent-child relationships)
- [ ] Category icons and colors for better UX
- [ ] Category popularity tracking
- [ ] Multi-language category support
- [ ] Category suggestions based on task content
- [ ] Category merging and splitting tools
- [ ] Category analytics and insights
- [ ] Custom categories for enterprise users