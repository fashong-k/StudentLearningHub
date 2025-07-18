# Standardized Assignment CRUD Operations

## Overview

This document defines the standardized approach for implementing Assignment CRUD operations across the EduPortal Learning Management System, ensuring data integrity, consistency, and accuracy.

## 1. Data Model Validation & Schema

### Assignment Schema Definition
```typescript
// Enhanced Assignment Schema with comprehensive validation
export const assignmentSchema = z.object({
  id: z.number().optional(),
  courseId: z.number().positive("Course ID must be positive"),
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().optional(),
  dueDate: z.coerce.date().refine(date => date > new Date(), "Due date must be in the future"),
  maxPoints: z.number().positive("Max points must be positive").max(1000, "Max points cannot exceed 1000"),
  assignmentType: z.enum(["homework", "quiz", "exam", "project", "lab"]).default("homework"),
  isActive: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Validation schemas for different operations
export const createAssignmentSchema = assignmentSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const updateAssignmentSchema = assignmentSchema.partial().omit({ id: true, createdAt: true });
```

### Data Integrity Rules
1. **Referential Integrity**: All assignments must reference valid courseId
2. **Temporal Constraints**: Due dates must be in the future when created
3. **Business Logic**: Max points must be positive and reasonable (≤ 1000)
4. **Audit Trail**: All operations must update timestamp fields

## 2. Standardized API Endpoints

### RESTful Endpoint Structure
```
GET    /api/assignments/:courseId          # Get all assignments for a course
GET    /api/assignments/detail/:id         # Get single assignment by ID
POST   /api/assignments                    # Create new assignment
PUT    /api/assignments/:id                # Update assignment
DELETE /api/assignments/:id                # Delete assignment (soft delete)
```

### Request/Response Standards
- All requests must include proper authentication headers
- Response format: `{ success: boolean, data: T, message?: string, errors?: string[] }`
- Error responses include specific field validation errors
- Success responses include complete assignment data with relations

## 3. Storage Layer Implementation

### Interface Contract
```typescript
interface IAssignmentStorage {
  // Read operations
  getAssignments(courseId: number, filters?: AssignmentFilters): Promise<AssignmentAttributes[]>;
  getAssignmentById(id: number, includeRelations?: boolean): Promise<AssignmentAttributes | null>;
  getAssignmentsByTeacher(teacherId: string): Promise<AssignmentAttributes[]>;
  
  // Write operations
  createAssignment(data: CreateAssignmentData): Promise<AssignmentAttributes>;
  updateAssignment(id: number, data: UpdateAssignmentData): Promise<AssignmentAttributes>;
  deleteAssignment(id: number, softDelete?: boolean): Promise<boolean>;
  
  // Validation operations
  validateAssignmentUpdate(id: number, data: UpdateAssignmentData): Promise<ValidationResult>;
  checkAssignmentPermissions(assignmentId: number, userId: string): Promise<PermissionLevel>;
}
```

### Database Transaction Standards
- All write operations must use database transactions
- Rollback on any validation failure
- Atomic operations for related data updates
- Optimistic locking for concurrent updates

## 4. Permission & Authorization Matrix

### Role-Based Access Control
```typescript
const assignmentPermissions = {
  student: {
    read: ['own_enrolled_courses'],
    create: false,
    update: false,
    delete: false
  },
  teacher: {
    read: ['own_courses'],
    create: ['own_courses'],
    update: ['own_courses'],
    delete: ['own_courses']
  },
  admin: {
    read: ['all'],
    create: ['all'],
    update: ['all'],
    delete: ['all']
  }
};
```

### Validation Checks
1. **Course Ownership**: Teachers can only manage assignments in their courses
2. **Student Enrollment**: Students can only view assignments from enrolled courses
3. **Admin Override**: Admins have full access with audit logging
4. **Temporal Restrictions**: Past assignments cannot be deleted if submissions exist

## 5. Business Logic Validation

### Pre-Creation Validation
- Course must exist and be active
- User must have creation permissions for the course
- Due date validation (minimum 1 day from creation)
- Max points validation (positive, reasonable limits)

### Pre-Update Validation
- Assignment must exist and be accessible
- Changes to max points require submission grade recalculation
- Due date changes require student notification
- Status changes (active/inactive) affect visibility

### Pre-Deletion Validation
- Check for existing submissions
- Cascade deletion rules for related data
- Audit trail preservation requirements
- Teacher notification for enrolled students

## 6. Error Handling Standards

### Error Categories
```typescript
enum AssignmentErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

interface AssignmentError {
  type: AssignmentErrorType;
  message: string;
  field?: string;
  code: string;
}
```

### Standardized Error Messages
- Field-specific validation errors with clear instructions
- Permission errors with required role information
- Conflict errors with resolution suggestions
- Internal errors with tracking IDs for debugging

## 7. Caching & Performance

### Caching Strategy
- Course assignments cached for 5 minutes
- Individual assignment details cached for 15 minutes
- Cache invalidation on any write operation
- Teacher-specific assignment lists cached per user

### Query Optimization
- Index on (courseId, isActive, dueDate)
- Eager loading of course and teacher relations
- Pagination for large assignment lists
- Optimized queries for dashboard summaries

## 8. Audit & Logging

### Audit Trail Requirements
```typescript
interface AssignmentAuditLog {
  assignmentId: number;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  userId: string;
  timestamp: Date;
  oldValues?: Partial<AssignmentAttributes>;
  newValues?: Partial<AssignmentAttributes>;
  reason?: string;
}
```

### Logging Standards
- All CRUD operations logged with user context
- Failed operations logged with error details
- Performance metrics for slow queries
- Security events for unauthorized access attempts

## 9. Testing Standards

### Unit Test Requirements
- Schema validation for all input scenarios
- Permission checking for all user roles
- Business logic validation edge cases
- Error handling for all failure modes

### Integration Test Requirements
- End-to-end CRUD operation flows
- Cross-component data consistency
- Concurrent operation handling
- Database transaction rollback scenarios

## 10. Implementation Checklist

### Backend Implementation
- [ ] Enhanced schema with comprehensive validation
- [ ] Standardized API endpoints with proper error handling
- [ ] Transaction-based storage operations
- [ ] Role-based permission middleware
- [ ] Comprehensive audit logging
- [ ] Performance optimization with caching

### Frontend Implementation
- [ ] Standardized form validation with field-level errors
- [ ] Loading states for all operations
- [ ] Optimistic updates with rollback capability
- [ ] Permission-based UI element visibility
- [ ] Comprehensive error message display
- [ ] Cache invalidation on mutations

### Quality Assurance
- [ ] Comprehensive test coverage (>90%)
- [ ] Performance benchmarks for all operations
- [ ] Security penetration testing
- [ ] Cross-browser compatibility testing
- [ ] Accessibility compliance verification
- [ ] Documentation accuracy validation

## 11. Migration Strategy

### Implementation Phases
1. **Phase 1**: Enhanced schema and validation (1 week)
2. **Phase 2**: Standardized API endpoints (1 week)
3. **Phase 3**: Frontend integration and testing (2 weeks)
4. **Phase 4**: Performance optimization and monitoring (1 week)

### Backward Compatibility
- Legacy API endpoints deprecated with 6-month notice
- Gradual migration of existing data to new schema
- Feature flags for new functionality rollout
- Comprehensive rollback procedures for each phase

This standardized approach ensures that Assignment CRUD operations maintain the highest levels of data integrity, consistency, and accuracy while providing a robust foundation for future enhancements.