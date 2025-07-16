import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';

// User model
export interface UserAttributes {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role?: 'student' | 'teacher' | 'admin';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'createdAt' | 'updatedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare email?: string;
  declare firstName?: string;
  declare lastName?: string;
  declare profileImageUrl?: string;
  declare role?: 'student' | 'teacher' | 'admin';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
  },
  firstName: {
    type: DataTypes.STRING,
  },
  lastName: {
    type: DataTypes.STRING,
  },
  profileImageUrl: {
    type: DataTypes.STRING,
  },
  role: {
    type: DataTypes.ENUM('student', 'teacher', 'admin'),
    defaultValue: 'student',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  schema: process.env.DB_SCHEMA || 'student_learning_hub'
});

// Course model
export interface CourseAttributes {
  id: number;
  title: string;
  description?: string;
  courseCode: string;
  semester?: string;
  year?: number;
  teacherId: string;
  termType?: 'semester' | 'term';
  startDate?: Date;
  endDate?: Date;
  visibility?: 'private' | 'institution';
  gradingScheme?: 'letter' | 'percentage' | 'points';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CourseCreationAttributes extends Optional<CourseAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Course extends Model<CourseAttributes, CourseCreationAttributes> implements CourseAttributes {
  declare id: number;
  declare title: string;
  declare description?: string;
  declare courseCode: string;
  declare semester?: string;
  declare year?: number;
  declare teacherId: string;
  declare termType?: 'semester' | 'term';
  declare startDate?: Date;
  declare endDate?: Date;
  declare visibility?: 'private' | 'institution';
  declare gradingScheme?: 'letter' | 'percentage' | 'points';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Course.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  courseCode: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'course_code',
  },
  semester: {
    type: DataTypes.STRING,
  },
  year: {
    type: DataTypes.INTEGER,
  },
  teacherId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'teacher_id',
  },
  termType: {
    type: DataTypes.ENUM('semester', 'term'),
    field: 'term_type',
  },
  startDate: {
    type: DataTypes.DATE,
    field: 'start_date',
  },
  endDate: {
    type: DataTypes.DATE,
    field: 'end_date',
  },
  visibility: {
    type: DataTypes.ENUM('private', 'institution'),
    defaultValue: 'private',
  },
  gradingScheme: {
    type: DataTypes.ENUM('letter', 'percentage', 'points'),
    defaultValue: 'letter',
    field: 'grading_scheme',
  },
}, {
  sequelize,
  modelName: 'Course',
  tableName: 'courses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  schema: process.env.DB_SCHEMA || 'student_learning_hub'
});

// Enrollment model
export interface EnrollmentAttributes {
  id: number;
  studentId: string;
  courseId: number;
  enrolledAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EnrollmentCreationAttributes extends Optional<EnrollmentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Enrollment extends Model<EnrollmentAttributes, EnrollmentCreationAttributes> implements EnrollmentAttributes {
  declare id: number;
  declare studentId: string;
  declare courseId: number;
  declare enrolledAt?: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Enrollment.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'student_id',
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'course_id',
  },
  enrolledAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'enrolled_at',
  },
}, {
  sequelize,
  modelName: 'Enrollment',
  tableName: 'enrollments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Assignment model
export interface AssignmentAttributes {
  id: number;
  title: string;
  description?: string;
  courseId: number;
  dueDate?: Date;
  totalPoints?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AssignmentCreationAttributes extends Optional<AssignmentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Assignment extends Model<AssignmentAttributes, AssignmentCreationAttributes> implements AssignmentAttributes {
  declare id: number;
  declare title: string;
  declare description?: string;
  declare courseId: number;
  declare dueDate?: Date;
  declare totalPoints?: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Assignment.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'course_id',
  },
  dueDate: {
    type: DataTypes.DATE,
    field: 'due_date',
  },
  totalPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    field: 'total_points',
  },
}, {
  sequelize,
  modelName: 'Assignment',
  tableName: 'assignments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Submission model
export interface SubmissionAttributes {
  id: number;
  assignmentId: number;
  studentId: string;
  submittedAt?: Date;
  grade?: number;
  feedback?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubmissionCreationAttributes extends Optional<SubmissionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Submission extends Model<SubmissionAttributes, SubmissionCreationAttributes> implements SubmissionAttributes {
  declare id: number;
  declare assignmentId: number;
  declare studentId: string;
  declare submittedAt?: Date;
  declare grade?: number;
  declare feedback?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Submission.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  assignmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'assignment_id',
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'student_id',
  },
  submittedAt: {
    type: DataTypes.DATE,
    field: 'submitted_at',
  },
  grade: {
    type: DataTypes.DECIMAL(5, 2),
  },
  feedback: {
    type: DataTypes.TEXT,
  },
}, {
  sequelize,
  modelName: 'Submission',
  tableName: 'submissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Announcement model
export interface AnnouncementAttributes {
  id: number;
  title: string;
  content: string;
  courseId: number;
  authorId: string;
  isImportant?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AnnouncementCreationAttributes extends Optional<AnnouncementAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Announcement extends Model<AnnouncementAttributes, AnnouncementCreationAttributes> implements AnnouncementAttributes {
  declare id: number;
  declare title: string;
  declare content: string;
  declare courseId: number;
  declare authorId: string;
  declare isImportant?: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Announcement.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'course_id',
  },
  authorId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'author_id',
  },
  isImportant: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_important',
  },
}, {
  sequelize,
  modelName: 'Announcement',
  tableName: 'announcements',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Message model
export interface MessageAttributes {
  id: number;
  senderId: string;
  receiverId: string;
  content: string;
  isRead?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  declare id: number;
  declare senderId: string;
  declare receiverId: string;
  declare content: string;
  declare isRead?: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Message.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  senderId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'sender_id',
  },
  receiverId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'receiver_id',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read',
  },
}, {
  sequelize,
  modelName: 'Message',
  tableName: 'messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Session model for authentication
export interface SessionAttributes {
  sid: string;
  sess: any;
  expire: Date;
}

export class Session extends Model<SessionAttributes> implements SessionAttributes {
  public sid!: string;
  public sess!: any;
  public expire!: Date;
}

Session.init({
  sid: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  sess: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  expire: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'Session',
  tableName: 'sessions',
  timestamps: false,
  indexes: [
    {
      fields: ['expire']
    }
  ]
});

// Course Instructors model (multiple teachers/TAs per course)
export interface CourseInstructorAttributes {
  id: number;
  courseId: number;
  instructorId: string;
  role: 'teacher' | 'ta' | 'grader';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CourseInstructorCreationAttributes extends Optional<CourseInstructorAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class CourseInstructor extends Model<CourseInstructorAttributes, CourseInstructorCreationAttributes> implements CourseInstructorAttributes {
  declare id: number;
  declare courseId: number;
  declare instructorId: string;
  declare role: 'teacher' | 'ta' | 'grader';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CourseInstructor.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'course_id',
  },
  instructorId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'instructor_id',
  },
  role: {
    type: DataTypes.ENUM('teacher', 'ta', 'grader'),
    defaultValue: 'teacher',
  },
}, {
  sequelize,
  modelName: 'CourseInstructor',
  tableName: 'course_instructors',
  schema: process.env.DB_SCHEMA || 'student_learning_hub'
});

// Course Categories model
export interface CourseCategoryAttributes {
  id: number;
  name: string;
  description?: string;
  color?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CourseCategoryCreationAttributes extends Optional<CourseCategoryAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class CourseCategory extends Model<CourseCategoryAttributes, CourseCategoryCreationAttributes> implements CourseCategoryAttributes {
  declare id: number;
  declare name: string;
  declare description?: string;
  declare color?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CourseCategory.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
  },
  color: {
    type: DataTypes.STRING,
  },
}, {
  sequelize,
  modelName: 'CourseCategory',
  tableName: 'course_categories',
  schema: process.env.DB_SCHEMA || 'student_learning_hub'
});

// Course Materials model
export interface CourseMaterialAttributes {
  id: number;
  courseId: number;
  title: string;
  description?: string;
  fileUrl?: string;
  fileType: 'pdf' | 'doc' | 'ppt' | 'video' | 'link' | 'other';
  uploadedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CourseMaterialCreationAttributes extends Optional<CourseMaterialAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class CourseMaterial extends Model<CourseMaterialAttributes, CourseMaterialCreationAttributes> implements CourseMaterialAttributes {
  declare id: number;
  declare courseId: number;
  declare title: string;
  declare description?: string;
  declare fileUrl?: string;
  declare fileType: 'pdf' | 'doc' | 'ppt' | 'video' | 'link' | 'other';
  declare uploadedBy: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CourseMaterial.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'course_id',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  fileUrl: {
    type: DataTypes.STRING,
    field: 'file_url',
  },
  fileType: {
    type: DataTypes.ENUM('pdf', 'doc', 'ppt', 'video', 'link', 'other'),
    allowNull: false,
    field: 'file_type',
  },
  uploadedBy: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'uploaded_by',
  },
}, {
  sequelize,
  modelName: 'CourseMaterial',
  tableName: 'course_materials',
  schema: process.env.DB_SCHEMA || 'student_learning_hub'
});

// Course Schedules model
export interface CourseScheduleAttributes {
  id: number;
  courseId: number;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string;
  endTime: string;
  location?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CourseScheduleCreationAttributes extends Optional<CourseScheduleAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class CourseSchedule extends Model<CourseScheduleAttributes, CourseScheduleCreationAttributes> implements CourseScheduleAttributes {
  declare id: number;
  declare courseId: number;
  declare dayOfWeek: number;
  declare startTime: string;
  declare endTime: string;
  declare location?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CourseSchedule.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'course_id',
  },
  dayOfWeek: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'day_of_week',
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'start_time',
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'end_time',
  },
  location: {
    type: DataTypes.STRING,
  },
}, {
  sequelize,
  modelName: 'CourseSchedule',
  tableName: 'course_schedules',
  schema: process.env.DB_SCHEMA || 'student_learning_hub'
});

// Grade Book model
export interface GradeBookAttributes {
  id: number;
  courseId: number;
  studentId: string;
  assignmentId: number;
  grade: number;
  maxPoints: number;
  gradePercentage: number;
  letterGrade?: string;
  gradedBy: string;
  gradedAt?: Date;
  feedback?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GradeBookCreationAttributes extends Optional<GradeBookAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class GradeBook extends Model<GradeBookAttributes, GradeBookCreationAttributes> implements GradeBookAttributes {
  declare id: number;
  declare courseId: number;
  declare studentId: string;
  declare assignmentId: number;
  declare grade: number;
  declare maxPoints: number;
  declare gradePercentage: number;
  declare letterGrade?: string;
  declare gradedBy: string;
  declare gradedAt?: Date;
  declare feedback?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

GradeBook.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'course_id',
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'student_id',
  },
  assignmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'assignment_id',
  },
  grade: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  maxPoints: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'max_points',
  },
  gradePercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'grade_percentage',
  },
  letterGrade: {
    type: DataTypes.STRING,
    field: 'letter_grade',
  },
  gradedBy: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'graded_by',
  },
  gradedAt: {
    type: DataTypes.DATE,
    field: 'graded_at',
  },
  feedback: {
    type: DataTypes.TEXT,
  },
}, {
  sequelize,
  modelName: 'GradeBook',
  tableName: 'grade_book',
  schema: process.env.DB_SCHEMA || 'student_learning_hub'
});

// Assignment Rubrics model
export interface AssignmentRubricAttributes {
  id: number;
  assignmentId: number;
  criteria: string;
  description?: string;
  maxPoints: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AssignmentRubricCreationAttributes extends Optional<AssignmentRubricAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class AssignmentRubric extends Model<AssignmentRubricAttributes, AssignmentRubricCreationAttributes> implements AssignmentRubricAttributes {
  declare id: number;
  declare assignmentId: number;
  declare criteria: string;
  declare description?: string;
  declare maxPoints: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AssignmentRubric.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  assignmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'assignment_id',
  },
  criteria: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  maxPoints: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'max_points',
  },
}, {
  sequelize,
  modelName: 'AssignmentRubric',
  tableName: 'assignment_rubrics',
  schema: process.env.DB_SCHEMA || 'student_learning_hub'
});

// Attendance model
export interface AttendanceAttributes {
  id: number;
  courseId: number;
  studentId: string;
  date: Date;
  status: 'present' | 'absent' | 'tardy' | 'excused';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AttendanceCreationAttributes extends Optional<AttendanceAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes> implements AttendanceAttributes {
  declare id: number;
  declare courseId: number;
  declare studentId: string;
  declare date: Date;
  declare status: 'present' | 'absent' | 'tardy' | 'excused';
  declare notes?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Attendance.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'course_id',
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'student_id',
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'tardy', 'excused'),
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
  },
}, {
  sequelize,
  modelName: 'Attendance',
  tableName: 'attendance',
  schema: process.env.DB_SCHEMA || 'student_learning_hub'
});

// File Uploads model
export interface FileUploadAttributes {
  id: number;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  uploadedBy: string;
  entityType: 'assignment' | 'submission' | 'course_material' | 'profile_image' | 'announcement';
  entityId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FileUploadCreationAttributes extends Optional<FileUploadAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class FileUpload extends Model<FileUploadAttributes, FileUploadCreationAttributes> implements FileUploadAttributes {
  declare id: number;
  declare fileName: string;
  declare originalName: string;
  declare fileSize: number;
  declare mimeType: string;
  declare filePath: string;
  declare uploadedBy: string;
  declare entityType: 'assignment' | 'submission' | 'course_material' | 'profile_image' | 'announcement';
  declare entityId: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

FileUpload.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'file_name',
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'original_name',
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'file_size',
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'mime_type',
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'file_path',
  },
  uploadedBy: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'uploaded_by',
  },
  entityType: {
    type: DataTypes.ENUM('assignment', 'submission', 'course_material', 'profile_image', 'announcement'),
    allowNull: false,
    field: 'entity_type',
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'entity_id',
  },
}, {
  sequelize,
  modelName: 'FileUpload',
  tableName: 'file_uploads',
  schema: process.env.DB_SCHEMA || 'student_learning_hub'
});

// Notifications model
export interface NotificationAttributes {
  id: number;
  userId: string;
  type: 'assignment_due' | 'grade_posted' | 'announcement' | 'message' | 'discussion_reply';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  declare id: number;
  declare userId: string;
  declare type: 'assignment_due' | 'grade_posted' | 'announcement' | 'message' | 'discussion_reply';
  declare title: string;
  declare message: string;
  declare isRead: boolean;
  declare actionUrl?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Notification.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'user_id',
  },
  type: {
    type: DataTypes.ENUM('assignment_due', 'grade_posted', 'announcement', 'message', 'discussion_reply'),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read',
  },
  actionUrl: {
    type: DataTypes.STRING,
    field: 'action_url',
  },
}, {
  sequelize,
  modelName: 'Notification',
  tableName: 'notifications',
  schema: process.env.DB_SCHEMA || 'student_learning_hub'
});

// User Preferences model
export interface UserPreferenceAttributes {
  id: number;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  preferences: any; // JSON object for additional preferences
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserPreferenceCreationAttributes extends Optional<UserPreferenceAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class UserPreference extends Model<UserPreferenceAttributes, UserPreferenceCreationAttributes> implements UserPreferenceAttributes {
  declare id: number;
  declare userId: string;
  declare theme: 'light' | 'dark' | 'system';
  declare language: string;
  declare timezone: string;
  declare emailNotifications: boolean;
  declare pushNotifications: boolean;
  declare preferences: any;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

UserPreference.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'user_id',
  },
  theme: {
    type: DataTypes.ENUM('light', 'dark', 'system'),
    defaultValue: 'system',
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'en',
  },
  timezone: {
    type: DataTypes.STRING,
    defaultValue: 'UTC',
  },
  emailNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'email_notifications',
  },
  pushNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'push_notifications',
  },
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
}, {
  sequelize,
  modelName: 'UserPreference',
  tableName: 'user_preferences',
  schema: process.env.DB_SCHEMA || 'student_learning_hub'
});

// Quizzes model
export interface QuizAttributes {
  id: number;
  courseId: number;
  title: string;
  description?: string;
  timeLimit?: number; // in minutes
  attemptsAllowed: number;
  isPublished: boolean;
  availableFrom?: Date;
  availableUntil?: Date;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuizCreationAttributes extends Optional<QuizAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Quiz extends Model<QuizAttributes, QuizCreationAttributes> implements QuizAttributes {
  declare id: number;
  declare courseId: number;
  declare title: string;
  declare description?: string;
  declare timeLimit?: number;
  declare attemptsAllowed: number;
  declare isPublished: boolean;
  declare availableFrom?: Date;
  declare availableUntil?: Date;
  declare createdBy: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Quiz.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'course_id',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  timeLimit: {
    type: DataTypes.INTEGER,
    field: 'time_limit',
  },
  attemptsAllowed: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'attempts_allowed',
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_published',
  },
  availableFrom: {
    type: DataTypes.DATE,
    field: 'available_from',
  },
  availableUntil: {
    type: DataTypes.DATE,
    field: 'available_until',
  },
  createdBy: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'created_by',
  },
}, {
  sequelize,
  modelName: 'Quiz',
  tableName: 'quizzes',
  schema: process.env.DB_SCHEMA || 'student_learning_hub'
});

// Quiz Questions model
export interface QuizQuestionAttributes {
  id: number;
  quizId: number;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: string[]; // JSON array for multiple choice options
  correctAnswer?: string;
  points: number;
  orderIndex: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuizQuestionCreationAttributes extends Optional<QuizQuestionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class QuizQuestion extends Model<QuizQuestionAttributes, QuizQuestionCreationAttributes> implements QuizQuestionAttributes {
  declare id: number;
  declare quizId: number;
  declare questionText: string;
  declare questionType: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  declare options?: string[];
  declare correctAnswer?: string;
  declare points: number;
  declare orderIndex: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

QuizQuestion.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  quizId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'quiz_id',
  },
  questionText: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'question_text',
  },
  questionType: {
    type: DataTypes.ENUM('multiple_choice', 'true_false', 'short_answer', 'essay'),
    allowNull: false,
    field: 'question_type',
  },
  options: {
    type: DataTypes.JSON,
  },
  correctAnswer: {
    type: DataTypes.TEXT,
    field: 'correct_answer',
  },
  points: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 1,
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'order_index',
  },
}, {
  sequelize,
  modelName: 'QuizQuestion',
  tableName: 'quiz_questions',
  schema: process.env.DB_SCHEMA || 'student_learning_hub'
});

// Quiz Attempts model
export interface QuizAttemptAttributes {
  id: number;
  quizId: number;
  studentId: string;
  attemptNumber: number;
  startedAt: Date;
  submittedAt?: Date;
  score?: number;
  maxScore: number;
  answers: any; // JSON object with question_id -> answer mappings
  timeSpent?: number; // in seconds
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuizAttemptCreationAttributes extends Optional<QuizAttemptAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class QuizAttempt extends Model<QuizAttemptAttributes, QuizAttemptCreationAttributes> implements QuizAttemptAttributes {
  declare id: number;
  declare quizId: number;
  declare studentId: string;
  declare attemptNumber: number;
  declare startedAt: Date;
  declare submittedAt?: Date;
  declare score?: number;
  declare maxScore: number;
  declare answers: any;
  declare timeSpent?: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

QuizAttempt.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  quizId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'quiz_id',
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'student_id',
  },
  attemptNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'attempt_number',
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'started_at',
  },
  submittedAt: {
    type: DataTypes.DATE,
    field: 'submitted_at',
  },
  score: {
    type: DataTypes.DECIMAL(5, 2),
  },
  maxScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'max_score',
  },
  answers: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  timeSpent: {
    type: DataTypes.INTEGER,
    field: 'time_spent',
  },
}, {
  sequelize,
  modelName: 'QuizAttempt',
  tableName: 'quiz_attempts',
  schema: process.env.DB_SCHEMA || 'student_learning_hub'
});

// Calendar Events model
export interface CalendarEventAttributes {
  id: number;
  courseId?: number;
  title: string;
  description?: string;
  eventType: 'assignment' | 'quiz' | 'exam' | 'lecture' | 'office_hours' | 'deadline' | 'other';
  startDate: Date;
  endDate?: Date;
  allDay: boolean;
  location?: string;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CalendarEventCreationAttributes extends Optional<CalendarEventAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class CalendarEvent extends Model<CalendarEventAttributes, CalendarEventCreationAttributes> implements CalendarEventAttributes {
  declare id: number;
  declare courseId?: number;
  declare title: string;
  declare description?: string;
  declare eventType: 'assignment' | 'quiz' | 'exam' | 'lecture' | 'office_hours' | 'deadline' | 'other';
  declare startDate: Date;
  declare endDate?: Date;
  declare allDay: boolean;
  declare location?: string;
  declare createdBy: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CalendarEvent.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  courseId: {
    type: DataTypes.INTEGER,
    field: 'course_id',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  eventType: {
    type: DataTypes.ENUM('assignment', 'quiz', 'exam', 'lecture', 'office_hours', 'deadline', 'other'),
    allowNull: false,
    field: 'event_type',
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'start_date',
  },
  endDate: {
    type: DataTypes.DATE,
    field: 'end_date',
  },
  allDay: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'all_day',
  },
  location: {
    type: DataTypes.STRING,
  },
  createdBy: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'created_by',
  },
}, {
  sequelize,
  modelName: 'CalendarEvent',
  tableName: 'calendar_events',
  schema: process.env.DB_SCHEMA || 'student_learning_hub'
});

// System Logs model
export interface SystemLogAttributes {
  id: number;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: number;
  details?: any; // JSON object for additional log details
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

export interface SystemLogCreationAttributes extends Optional<SystemLogAttributes, 'id' | 'createdAt'> {}

export class SystemLog extends Model<SystemLogAttributes, SystemLogCreationAttributes> implements SystemLogAttributes {
  declare id: number;
  declare userId?: string;
  declare action: string;
  declare entityType?: string;
  declare entityId?: number;
  declare details?: any;
  declare ipAddress?: string;
  declare userAgent?: string;
  declare readonly createdAt: Date;
}

SystemLog.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.STRING,
    field: 'user_id',
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entityType: {
    type: DataTypes.STRING,
    field: 'entity_type',
  },
  entityId: {
    type: DataTypes.INTEGER,
    field: 'entity_id',
  },
  details: {
    type: DataTypes.JSON,
  },
  ipAddress: {
    type: DataTypes.STRING,
    field: 'ip_address',
  },
  userAgent: {
    type: DataTypes.STRING,
    field: 'user_agent',
  },
}, {
  sequelize,
  modelName: 'SystemLog',
  tableName: 'system_logs',
  timestamps: false,
  schema: process.env.DB_SCHEMA || 'student_learning_hub'
});

// Define associations
export function setupAssociations() {
  User.hasMany(Course, { foreignKey: 'teacherId', as: 'taughtCourses' });
  Course.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });

  User.hasMany(Enrollment, { foreignKey: 'studentId', as: 'enrollments' });
  Enrollment.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

  Course.hasMany(Enrollment, { foreignKey: 'courseId', as: 'enrollments' });
  Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

  Course.hasMany(Assignment, { foreignKey: 'courseId', as: 'assignments' });
  Assignment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

  Assignment.hasMany(Submission, { foreignKey: 'assignmentId', as: 'submissions' });
  Submission.belongsTo(Assignment, { foreignKey: 'assignmentId', as: 'assignment' });

  User.hasMany(Submission, { foreignKey: 'studentId', as: 'submissions' });
  Submission.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

  Course.hasMany(Announcement, { foreignKey: 'courseId', as: 'announcements' });
  Announcement.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

  User.hasMany(Announcement, { foreignKey: 'authorId', as: 'announcements' });
  Announcement.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

  User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
  User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });
  Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
  Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

  // Course instructor associations
  Course.hasMany(CourseInstructor, { foreignKey: 'courseId', as: 'instructors' });
  CourseInstructor.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
  User.hasMany(CourseInstructor, { foreignKey: 'instructorId', as: 'courseInstructions' });
  CourseInstructor.belongsTo(User, { foreignKey: 'instructorId', as: 'instructor' });

  // Course material associations
  Course.hasMany(CourseMaterial, { foreignKey: 'courseId', as: 'materials' });
  CourseMaterial.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
  User.hasMany(CourseMaterial, { foreignKey: 'uploadedBy', as: 'uploadedMaterials' });
  CourseMaterial.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

  // Course schedule associations
  Course.hasMany(CourseSchedule, { foreignKey: 'courseId', as: 'schedules' });
  CourseSchedule.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

  // Grade book associations
  Course.hasMany(GradeBook, { foreignKey: 'courseId', as: 'grades' });
  GradeBook.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
  User.hasMany(GradeBook, { foreignKey: 'studentId', as: 'grades' });
  GradeBook.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
  Assignment.hasMany(GradeBook, { foreignKey: 'assignmentId', as: 'grades' });
  GradeBook.belongsTo(Assignment, { foreignKey: 'assignmentId', as: 'assignment' });
  User.hasMany(GradeBook, { foreignKey: 'gradedBy', as: 'gradedAssignments' });
  GradeBook.belongsTo(User, { foreignKey: 'gradedBy', as: 'grader' });

  // Assignment rubric associations
  Assignment.hasMany(AssignmentRubric, { foreignKey: 'assignmentId', as: 'rubrics' });
  AssignmentRubric.belongsTo(Assignment, { foreignKey: 'assignmentId', as: 'assignment' });

  // Attendance associations
  Course.hasMany(Attendance, { foreignKey: 'courseId', as: 'attendanceRecords' });
  Attendance.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
  User.hasMany(Attendance, { foreignKey: 'studentId', as: 'attendanceRecords' });
  Attendance.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

  // File upload associations
  User.hasMany(FileUpload, { foreignKey: 'uploadedBy', as: 'uploadedFiles' });
  FileUpload.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

  // Notification associations
  User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
  Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // User preference associations
  User.hasOne(UserPreference, { foreignKey: 'userId', as: 'preferences' });
  UserPreference.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // Quiz associations
  Course.hasMany(Quiz, { foreignKey: 'courseId', as: 'quizzes' });
  Quiz.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
  User.hasMany(Quiz, { foreignKey: 'createdBy', as: 'createdQuizzes' });
  Quiz.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

  // Quiz question associations
  Quiz.hasMany(QuizQuestion, { foreignKey: 'quizId', as: 'questions' });
  QuizQuestion.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });

  // Quiz attempt associations
  Quiz.hasMany(QuizAttempt, { foreignKey: 'quizId', as: 'attempts' });
  QuizAttempt.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });
  User.hasMany(QuizAttempt, { foreignKey: 'studentId', as: 'quizAttempts' });
  QuizAttempt.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

  // Calendar event associations
  Course.hasMany(CalendarEvent, { foreignKey: 'courseId', as: 'calendarEvents' });
  CalendarEvent.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
  User.hasMany(CalendarEvent, { foreignKey: 'createdBy', as: 'createdEvents' });
  CalendarEvent.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

  // System log associations
  User.hasMany(SystemLog, { foreignKey: 'userId', as: 'systemLogs' });
  SystemLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
}