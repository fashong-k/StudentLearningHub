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
}, {
  sequelize,
  modelName: 'Course',
  tableName: 'courses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
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
}