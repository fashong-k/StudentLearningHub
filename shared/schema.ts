import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["student", "teacher", "admin"]);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("student").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define course visibility enum
export const courseVisibilityEnum = pgEnum("course_visibility", ["private", "institution"]);

// Define grading scheme enum
export const gradingSchemeEnum = pgEnum("grading_scheme", ["letter", "percentage", "points"]);

// Define assignment status enum
export const assignmentStatusEnum = pgEnum("assignment_status", ["draft", "published", "archived"]);

// Define submission status enum
export const submissionStatusEnum = pgEnum("submission_status", ["draft", "submitted", "graded", "returned"]);

// Define file type enum
export const fileTypeEnum = pgEnum("file_type", ["assignment", "submission", "course_material", "profile_image", "announcement"]);

// Define notification type enum
export const notificationTypeEnum = pgEnum("notification_type", ["assignment_due", "grade_posted", "announcement", "message", "discussion_reply"]);

// Define attendance status enum
export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent", "tardy", "excused"]);

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  courseCode: varchar("course_code", { length: 20 }).notNull().unique(),
  teacherId: varchar("teacher_id").notNull(),
  semester: varchar("semester", { length: 50 }),
  year: integer("year"),
  termType: varchar("term_type", { length: 20 }).default("semester"), // "semester" or "term"
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  visibility: courseVisibilityEnum("visibility").default("private"),
  gradingScheme: gradingSchemeEnum("grading_scheme").default("letter"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course enrollments table
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: varchar("student_id").notNull(),
  courseId: integer("course_id").notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Assignments table
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  maxPoints: decimal("max_points", { precision: 10, scale: 2 }),
  assignmentType: varchar("assignment_type", { length: 50 }).default("homework"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assignment submissions table
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull(),
  studentId: varchar("student_id").notNull(),
  submissionText: text("submission_text"),
  filePath: varchar("file_path"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  grade: decimal("grade", { precision: 10, scale: 2 }),
  feedback: text("feedback"),
  gradedAt: timestamp("graded_at"),
  isLate: boolean("is_late").default(false),
});

// Announcements table
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull(),
  isImportant: boolean("is_important").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").notNull(),
  receiverId: varchar("receiver_id").notNull(),
  courseId: integer("course_id"),
  subject: varchar("subject", { length: 255 }),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  sentAt: timestamp("sent_at").defaultNow(),
});

// Discussion forums table
export const discussions = pgTable("discussions", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull(),
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Discussion replies table
export const discussionReplies = pgTable("discussion_replies", {
  id: serial("id").primaryKey(),
  discussionId: integer("discussion_id").notNull(),
  authorId: varchar("author_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course instructors table (for multiple teachers, TAs)
export const courseInstructors = pgTable("course_instructors", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  instructorId: varchar("instructor_id").notNull(),
  role: varchar("role", { length: 50 }).default("teacher"), // "teacher", "ta", "grader"
  permissions: jsonb("permissions").default({}), // JSON object for specific permissions
  assignedAt: timestamp("assigned_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Course categories table
export const courseCategories = pgTable("course_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3B82F6"), // Hex color code
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Course materials table
export const courseMaterials = pgTable("course_materials", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  filePath: varchar("file_path"),
  fileSize: integer("file_size"), // in bytes
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedBy: varchar("uploaded_by").notNull(),
  isVisible: boolean("is_visible").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Grade book table
export const gradeBook = pgTable("grade_book", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  studentId: varchar("student_id").notNull(),
  assignmentId: integer("assignment_id"),
  points: decimal("points", { precision: 10, scale: 2 }),
  maxPoints: decimal("max_points", { precision: 10, scale: 2 }),
  letterGrade: varchar("letter_grade", { length: 2 }),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  feedback: text("feedback"),
  gradedBy: varchar("graded_by"),
  gradedAt: timestamp("graded_at"),
  isExcused: boolean("is_excused").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course schedules table
export const courseSchedules = pgTable("course_schedules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: varchar("start_time", { length: 8 }).notNull(), // HH:MM:SS
  endTime: varchar("end_time", { length: 8 }).notNull(), // HH:MM:SS
  location: varchar("location", { length: 255 }),
  isActive: boolean("is_active").default(true),
});

// Attendance table
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  studentId: varchar("student_id").notNull(),
  date: timestamp("date").notNull(),
  status: attendanceStatusEnum("status").notNull(),
  notes: text("notes"),
  recordedBy: varchar("recorded_by").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// File uploads table
export const fileUploads = pgTable("file_uploads", {
  id: serial("id").primaryKey(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileType: fileTypeEnum("file_type").notNull(),
  uploadedBy: varchar("uploaded_by").notNull(),
  relatedId: integer("related_id"), // ID of related record (course, assignment, etc.)
  isPublic: boolean("is_public").default(false),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  recipientId: varchar("recipient_id").notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedId: integer("related_id"), // ID of related record
  isRead: boolean("is_read").default(false),
  sentAt: timestamp("sent_at").defaultNow(),
  readAt: timestamp("read_at"),
});

// User preferences table
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  theme: varchar("theme", { length: 20 }).default("light"), // light, dark, system
  language: varchar("language", { length: 10 }).default("en"),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  emailNotifications: boolean("email_notifications").default(true),
  pushNotifications: boolean("push_notifications").default(true),
  preferences: jsonb("preferences").default({}), // Additional JSON preferences
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assignment rubric table
export const assignmentRubrics = pgTable("assignment_rubrics", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull(),
  criteriaName: varchar("criteria_name", { length: 255 }).notNull(),
  description: text("description"),
  maxPoints: decimal("max_points", { precision: 10, scale: 2 }).notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }).default(1.0),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quiz/exam table
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  instructions: text("instructions"),
  timeLimit: integer("time_limit"), // in minutes
  attempts: integer("attempts").default(1),
  showResults: boolean("show_results").default(false),
  shuffleQuestions: boolean("shuffle_questions").default(false),
  isActive: boolean("is_active").default(true),
  availableFrom: timestamp("available_from"),
  availableTo: timestamp("available_to"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quiz questions table
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  questionType: varchar("question_type", { length: 50 }).notNull(), // multiple_choice, true_false, short_answer, essay
  questionText: text("question_text").notNull(),
  options: jsonb("options"), // JSON array for multiple choice options
  correctAnswer: text("correct_answer"),
  points: decimal("points", { precision: 10, scale: 2 }).default(1.0),
  explanation: text("explanation"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quiz attempts table
export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  studentId: varchar("student_id").notNull(),
  attemptNumber: integer("attempt_number").notNull(),
  answers: jsonb("answers"), // JSON object with question_id: answer pairs
  score: decimal("score", { precision: 10, scale: 2 }),
  maxScore: decimal("max_score", { precision: 10, scale: 2 }),
  startedAt: timestamp("started_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
  timeSpent: integer("time_spent"), // in seconds
  isCompleted: boolean("is_completed").default(false),
});

// Calendar events table
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eventType: varchar("event_type", { length: 50 }).notNull(), // assignment, exam, lecture, office_hours, etc.
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  location: varchar("location", { length: 255 }),
  isAllDay: boolean("is_all_day").default(false),
  isRecurring: boolean("is_recurring").default(false),
  recurrenceRule: text("recurrence_rule"), // RRULE format
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System logs table
export const systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id"),
  action: varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resource_type", { length: 50 }).notNull(),
  resourceId: varchar("resource_id"),
  details: jsonb("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many, one }) => ({
  teachingCourses: many(courses),
  enrollments: many(enrollments),
  assignments: many(submissions),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  announcements: many(announcements),
  discussions: many(discussions),
  discussionReplies: many(discussionReplies),
  courseInstructorRoles: many(courseInstructors),
  uploadedMaterials: many(courseMaterials),
  gradeBookEntries: many(gradeBook),
  recordedAttendance: many(attendance),
  uploadedFiles: many(fileUploads),
  notifications: many(notifications),
  preferences: one(userPreferences),
  createdQuizzes: many(quizzes),
  quizAttempts: many(quizAttempts),
  createdEvents: many(calendarEvents),
  systemLogs: many(systemLogs),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  teacher: one(users, {
    fields: [courses.teacherId],
    references: [users.id],
  }),
  enrollments: many(enrollments),
  assignments: many(assignments),
  announcements: many(announcements),
  discussions: many(discussions),
  instructors: many(courseInstructors),
  materials: many(courseMaterials),
  gradeBook: many(gradeBook),
  schedules: many(courseSchedules),
  attendance: many(attendance),
  quizzes: many(quizzes),
  events: many(calendarEvents),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(users, {
    fields: [enrollments.studentId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  course: one(courses, {
    fields: [assignments.courseId],
    references: [courses.id],
  }),
  submissions: many(submissions),
  rubrics: many(assignmentRubrics),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  assignment: one(assignments, {
    fields: [submissions.assignmentId],
    references: [assignments.id],
  }),
  student: one(users, {
    fields: [submissions.studentId],
    references: [users.id],
  }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  course: one(courses, {
    fields: [announcements.courseId],
    references: [courses.id],
  }),
  author: one(users, {
    fields: [announcements.authorId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
  course: one(courses, {
    fields: [messages.courseId],
    references: [courses.id],
  }),
}));

export const discussionsRelations = relations(discussions, ({ one, many }) => ({
  course: one(courses, {
    fields: [discussions.courseId],
    references: [courses.id],
  }),
  author: one(users, {
    fields: [discussions.authorId],
    references: [users.id],
  }),
  replies: many(discussionReplies),
}));

export const discussionRepliesRelations = relations(discussionReplies, ({ one }) => ({
  discussion: one(discussions, {
    fields: [discussionReplies.discussionId],
    references: [discussions.id],
  }),
  author: one(users, {
    fields: [discussionReplies.authorId],
    references: [users.id],
  }),
}));

// Course instructors relations
export const courseInstructorsRelations = relations(courseInstructors, ({ one }) => ({
  course: one(courses, {
    fields: [courseInstructors.courseId],
    references: [courses.id],
  }),
  instructor: one(users, {
    fields: [courseInstructors.instructorId],
    references: [users.id],
  }),
}));

// Course materials relations
export const courseMaterialsRelations = relations(courseMaterials, ({ one }) => ({
  course: one(courses, {
    fields: [courseMaterials.courseId],
    references: [courses.id],
  }),
  uploader: one(users, {
    fields: [courseMaterials.uploadedBy],
    references: [users.id],
  }),
}));

// Grade book relations
export const gradeBookRelations = relations(gradeBook, ({ one }) => ({
  course: one(courses, {
    fields: [gradeBook.courseId],
    references: [courses.id],
  }),
  student: one(users, {
    fields: [gradeBook.studentId],
    references: [users.id],
  }),
  assignment: one(assignments, {
    fields: [gradeBook.assignmentId],
    references: [assignments.id],
  }),
  grader: one(users, {
    fields: [gradeBook.gradedBy],
    references: [users.id],
  }),
}));

// Course schedules relations
export const courseSchedulesRelations = relations(courseSchedules, ({ one }) => ({
  course: one(courses, {
    fields: [courseSchedules.courseId],
    references: [courses.id],
  }),
}));

// Attendance relations
export const attendanceRelations = relations(attendance, ({ one }) => ({
  course: one(courses, {
    fields: [attendance.courseId],
    references: [courses.id],
  }),
  student: one(users, {
    fields: [attendance.studentId],
    references: [users.id],
  }),
  recorder: one(users, {
    fields: [attendance.recordedBy],
    references: [users.id],
  }),
}));

// File uploads relations
export const fileUploadsRelations = relations(fileUploads, ({ one }) => ({
  uploader: one(users, {
    fields: [fileUploads.uploadedBy],
    references: [users.id],
  }),
}));

// Notifications relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
  }),
}));

// User preferences relations
export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

// Assignment rubrics relations
export const assignmentRubricsRelations = relations(assignmentRubrics, ({ one }) => ({
  assignment: one(assignments, {
    fields: [assignmentRubrics.assignmentId],
    references: [assignments.id],
  }),
}));

// Quizzes relations
export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  course: one(courses, {
    fields: [quizzes.courseId],
    references: [courses.id],
  }),
  creator: one(users, {
    fields: [quizzes.createdBy],
    references: [users.id],
  }),
  questions: many(quizQuestions),
  attempts: many(quizAttempts),
}));

// Quiz questions relations
export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizQuestions.quizId],
    references: [quizzes.id],
  }),
}));

// Quiz attempts relations
export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id],
  }),
  student: one(users, {
    fields: [quizAttempts.studentId],
    references: [users.id],
  }),
}));

// Calendar events relations
export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  course: one(courses, {
    fields: [calendarEvents.courseId],
    references: [courses.id],
  }),
  creator: one(users, {
    fields: [calendarEvents.createdBy],
    references: [users.id],
  }),
}));

// System logs relations
export const systemLogsRelations = relations(systemLogs, ({ one }) => ({
  user: one(users, {
    fields: [systemLogs.userId],
    references: [users.id],
  }),
}));

// Export types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertCourse = typeof courses.$inferInsert;
export type Course = typeof courses.$inferSelect;

export type InsertEnrollment = typeof enrollments.$inferInsert;
export type Enrollment = typeof enrollments.$inferSelect;

export type InsertAssignment = typeof assignments.$inferInsert;
export type Assignment = typeof assignments.$inferSelect;

export type InsertSubmission = typeof submissions.$inferInsert;
export type Submission = typeof submissions.$inferSelect;

export type InsertAnnouncement = typeof announcements.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;

export type InsertMessage = typeof messages.$inferInsert;
export type Message = typeof messages.$inferSelect;

export type InsertDiscussion = typeof discussions.$inferInsert;
export type Discussion = typeof discussions.$inferSelect;

export type InsertDiscussionReply = typeof discussionReplies.$inferInsert;
export type DiscussionReply = typeof discussionReplies.$inferSelect;

// Create insert schemas
export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  submittedAt: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true,
});

export const insertDiscussionSchema = createInsertSchema(discussions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDiscussionReplySchema = createInsertSchema(discussionReplies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Additional table types and insert schemas

// Course Instructors
export type InsertCourseInstructor = typeof courseInstructors.$inferInsert;
export type CourseInstructor = typeof courseInstructors.$inferSelect;

// Course Categories
export type InsertCourseCategory = typeof courseCategories.$inferInsert;
export type CourseCategory = typeof courseCategories.$inferSelect;

// Course Materials
export type InsertCourseMaterial = typeof courseMaterials.$inferInsert;
export type CourseMaterial = typeof courseMaterials.$inferSelect;

// Grade Book
export type InsertGradeBook = typeof gradeBook.$inferInsert;
export type GradeBook = typeof gradeBook.$inferSelect;

// Course Schedules
export type InsertCourseSchedule = typeof courseSchedules.$inferInsert;
export type CourseSchedule = typeof courseSchedules.$inferSelect;

// Attendance
export type InsertAttendance = typeof attendance.$inferInsert;
export type Attendance = typeof attendance.$inferSelect;

// File Uploads
export type InsertFileUpload = typeof fileUploads.$inferInsert;
export type FileUpload = typeof fileUploads.$inferSelect;

// Notifications
export type InsertNotification = typeof notifications.$inferInsert;
export type Notification = typeof notifications.$inferSelect;

// User Preferences
export type InsertUserPreferences = typeof userPreferences.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;

// Assignment Rubrics
export type InsertAssignmentRubric = typeof assignmentRubrics.$inferInsert;
export type AssignmentRubric = typeof assignmentRubrics.$inferSelect;

// Quizzes
export type InsertQuiz = typeof quizzes.$inferInsert;
export type Quiz = typeof quizzes.$inferSelect;

// Quiz Questions
export type InsertQuizQuestion = typeof quizQuestions.$inferInsert;
export type QuizQuestion = typeof quizQuestions.$inferSelect;

// Quiz Attempts
export type InsertQuizAttempt = typeof quizAttempts.$inferInsert;
export type QuizAttempt = typeof quizAttempts.$inferSelect;

// Calendar Events
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;
export type CalendarEvent = typeof calendarEvents.$inferSelect;

// System Logs
export type InsertSystemLog = typeof systemLogs.$inferInsert;
export type SystemLog = typeof systemLogs.$inferSelect;

// Insert schemas for forms
export const insertCourseMaterialSchema = createInsertSchema(courseMaterials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  sentAt: true,
  readAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({
  id: true,
  createdAt: true,
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
