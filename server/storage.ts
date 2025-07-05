import {
  users,
  courses,
  enrollments,
  assignments,
  submissions,
  announcements,
  messages,
  discussions,
  discussionReplies,
  type User,
  type UpsertUser,
  type Course,
  type InsertCourse,
  type Enrollment,
  type InsertEnrollment,
  type Assignment,
  type InsertAssignment,
  type Submission,
  type InsertSubmission,
  type Announcement,
  type InsertAnnouncement,
  type Message,
  type InsertMessage,
  type Discussion,
  type InsertDiscussion,
  type DiscussionReply,
  type InsertDiscussionReply,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, count, avg } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Course operations
  getCourses(): Promise<Course[]>;
  getCourseById(id: number): Promise<Course | undefined>;
  getTeacherCourses(teacherId: string): Promise<Course[]>;
  getStudentCourses(studentId: string): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course>;
  deleteCourse(id: number): Promise<boolean>;
  
  // Enrollment operations
  enrollStudent(studentId: string, courseId: number): Promise<Enrollment>;
  unenrollStudent(studentId: string, courseId: number): Promise<boolean>;
  getCourseEnrollments(courseId: number): Promise<Enrollment[]>;
  getStudentEnrollments(studentId: string): Promise<Enrollment[]>;
  
  // Assignment operations
  getAssignments(courseId: number): Promise<Assignment[]>;
  getAssignmentById(id: number): Promise<Assignment | undefined>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: number, assignment: Partial<InsertAssignment>): Promise<Assignment>;
  deleteAssignment(id: number): Promise<boolean>;
  
  // Submission operations
  getSubmissions(assignmentId: number): Promise<Submission[]>;
  getSubmissionById(id: number): Promise<Submission | undefined>;
  getStudentSubmissions(studentId: string): Promise<Submission[]>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  updateSubmission(id: number, submission: Partial<InsertSubmission>): Promise<Submission>;
  gradeSubmission(id: number, grade: number, feedback?: string): Promise<Submission>;
  
  // Announcement operations
  getCourseAnnouncements(courseId: number): Promise<Announcement[]>;
  getAnnouncementById(id: number): Promise<Announcement | undefined>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: number, announcement: Partial<InsertAnnouncement>): Promise<Announcement>;
  deleteAnnouncement(id: number): Promise<boolean>;
  
  // Message operations
  getMessages(userId: string): Promise<Message[]>;
  getConversation(senderId: string, receiverId: string): Promise<Message[]>;
  sendMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<boolean>;
  
  // Discussion operations
  getCourseDiscussions(courseId: number): Promise<Discussion[]>;
  getDiscussionById(id: number): Promise<Discussion | undefined>;
  createDiscussion(discussion: InsertDiscussion): Promise<Discussion>;
  updateDiscussion(id: number, discussion: Partial<InsertDiscussion>): Promise<Discussion>;
  deleteDiscussion(id: number): Promise<boolean>;
  
  // Discussion reply operations
  getDiscussionReplies(discussionId: number): Promise<DiscussionReply[]>;
  createDiscussionReply(reply: InsertDiscussionReply): Promise<DiscussionReply>;
  updateDiscussionReply(id: number, reply: Partial<InsertDiscussionReply>): Promise<DiscussionReply>;
  deleteDiscussionReply(id: number): Promise<boolean>;
  
  // Analytics operations
  getStudentGrades(studentId: string): Promise<any[]>;
  getCourseStats(courseId: number): Promise<any>;
  getStudentStats(studentId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.isActive, true));
  }

  async getCourseById(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getTeacherCourses(teacherId: string): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .where(and(eq(courses.teacherId, teacherId), eq(courses.isActive, true)));
  }

  async getStudentCourses(studentId: string): Promise<Course[]> {
    return await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        courseCode: courses.courseCode,
        teacherId: courses.teacherId,
        semester: courses.semester,
        year: courses.year,
        isActive: courses.isActive,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
      })
      .from(courses)
      .innerJoin(enrollments, eq(enrollments.courseId, courses.id))
      .where(
        and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.isActive, true),
          eq(courses.isActive, true)
        )
      );
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course> {
    const [updatedCourse] = await db
      .update(courses)
      .set({ ...course, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    const result = await db
      .update(courses)
      .set({ isActive: false })
      .where(eq(courses.id, id));
    return result.rowCount > 0;
  }

  // Enrollment operations
  async enrollStudent(studentId: string, courseId: number): Promise<Enrollment> {
    const [enrollment] = await db
      .insert(enrollments)
      .values({ studentId, courseId })
      .returning();
    return enrollment;
  }

  async unenrollStudent(studentId: string, courseId: number): Promise<boolean> {
    const result = await db
      .update(enrollments)
      .set({ isActive: false })
      .where(
        and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.courseId, courseId)
        )
      );
    return result.rowCount > 0;
  }

  async getCourseEnrollments(courseId: number): Promise<Enrollment[]> {
    return await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.courseId, courseId), eq(enrollments.isActive, true)));
  }

  async getStudentEnrollments(studentId: string): Promise<Enrollment[]> {
    return await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.studentId, studentId), eq(enrollments.isActive, true)));
  }

  // Assignment operations
  async getAssignments(courseId: number): Promise<Assignment[]> {
    return await db
      .select()
      .from(assignments)
      .where(and(eq(assignments.courseId, courseId), eq(assignments.isActive, true)))
      .orderBy(asc(assignments.dueDate));
  }

  async getAssignmentById(id: number): Promise<Assignment | undefined> {
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, id));
    return assignment;
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [newAssignment] = await db
      .insert(assignments)
      .values(assignment)
      .returning();
    return newAssignment;
  }

  async updateAssignment(id: number, assignment: Partial<InsertAssignment>): Promise<Assignment> {
    const [updatedAssignment] = await db
      .update(assignments)
      .set({ ...assignment, updatedAt: new Date() })
      .where(eq(assignments.id, id))
      .returning();
    return updatedAssignment;
  }

  async deleteAssignment(id: number): Promise<boolean> {
    const result = await db
      .update(assignments)
      .set({ isActive: false })
      .where(eq(assignments.id, id));
    return result.rowCount > 0;
  }

  // Submission operations
  async getSubmissions(assignmentId: number): Promise<Submission[]> {
    return await db
      .select()
      .from(submissions)
      .where(eq(submissions.assignmentId, assignmentId))
      .orderBy(desc(submissions.submittedAt));
  }

  async getSubmissionById(id: number): Promise<Submission | undefined> {
    const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, id));
    return submission;
  }

  async getStudentSubmissions(studentId: string): Promise<Submission[]> {
    return await db
      .select()
      .from(submissions)
      .where(eq(submissions.studentId, studentId))
      .orderBy(desc(submissions.submittedAt));
  }

  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const [newSubmission] = await db
      .insert(submissions)
      .values(submission)
      .returning();
    return newSubmission;
  }

  async updateSubmission(id: number, submission: Partial<InsertSubmission>): Promise<Submission> {
    const [updatedSubmission] = await db
      .update(submissions)
      .set(submission)
      .where(eq(submissions.id, id))
      .returning();
    return updatedSubmission;
  }

  async gradeSubmission(id: number, grade: number, feedback?: string): Promise<Submission> {
    const [gradedSubmission] = await db
      .update(submissions)
      .set({ grade, feedback, gradedAt: new Date() })
      .where(eq(submissions.id, id))
      .returning();
    return gradedSubmission;
  }

  // Announcement operations
  async getCourseAnnouncements(courseId: number): Promise<Announcement[]> {
    return await db
      .select()
      .from(announcements)
      .where(eq(announcements.courseId, courseId))
      .orderBy(desc(announcements.createdAt));
  }

  async getAnnouncementById(id: number): Promise<Announcement | undefined> {
    const [announcement] = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, id));
    return announcement;
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [newAnnouncement] = await db
      .insert(announcements)
      .values(announcement)
      .returning();
    return newAnnouncement;
  }

  async updateAnnouncement(id: number, announcement: Partial<InsertAnnouncement>): Promise<Announcement> {
    const [updatedAnnouncement] = await db
      .update(announcements)
      .set({ ...announcement, updatedAt: new Date() })
      .where(eq(announcements.id, id))
      .returning();
    return updatedAnnouncement;
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    const result = await db.delete(announcements).where(eq(announcements.id, id));
    return result.rowCount > 0;
  }

  // Message operations
  async getMessages(userId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.receiverId, userId))
      .orderBy(desc(messages.sentAt));
  }

  async getConversation(senderId: string, receiverId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        sql`(${messages.senderId} = ${senderId} AND ${messages.receiverId} = ${receiverId}) OR 
            (${messages.senderId} = ${receiverId} AND ${messages.receiverId} = ${senderId})`
      )
      .orderBy(asc(messages.sentAt));
  }

  async sendMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async markMessageAsRead(id: number): Promise<boolean> {
    const result = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id));
    return result.rowCount > 0;
  }

  // Discussion operations
  async getCourseDiscussions(courseId: number): Promise<Discussion[]> {
    return await db
      .select()
      .from(discussions)
      .where(eq(discussions.courseId, courseId))
      .orderBy(desc(discussions.isPinned), desc(discussions.createdAt));
  }

  async getDiscussionById(id: number): Promise<Discussion | undefined> {
    const [discussion] = await db
      .select()
      .from(discussions)
      .where(eq(discussions.id, id));
    return discussion;
  }

  async createDiscussion(discussion: InsertDiscussion): Promise<Discussion> {
    const [newDiscussion] = await db
      .insert(discussions)
      .values(discussion)
      .returning();
    return newDiscussion;
  }

  async updateDiscussion(id: number, discussion: Partial<InsertDiscussion>): Promise<Discussion> {
    const [updatedDiscussion] = await db
      .update(discussions)
      .set({ ...discussion, updatedAt: new Date() })
      .where(eq(discussions.id, id))
      .returning();
    return updatedDiscussion;
  }

  async deleteDiscussion(id: number): Promise<boolean> {
    const result = await db.delete(discussions).where(eq(discussions.id, id));
    return result.rowCount > 0;
  }

  // Discussion reply operations
  async getDiscussionReplies(discussionId: number): Promise<DiscussionReply[]> {
    return await db
      .select()
      .from(discussionReplies)
      .where(eq(discussionReplies.discussionId, discussionId))
      .orderBy(asc(discussionReplies.createdAt));
  }

  async createDiscussionReply(reply: InsertDiscussionReply): Promise<DiscussionReply> {
    const [newReply] = await db
      .insert(discussionReplies)
      .values(reply)
      .returning();
    return newReply;
  }

  async updateDiscussionReply(id: number, reply: Partial<InsertDiscussionReply>): Promise<DiscussionReply> {
    const [updatedReply] = await db
      .update(discussionReplies)
      .set({ ...reply, updatedAt: new Date() })
      .where(eq(discussionReplies.id, id))
      .returning();
    return updatedReply;
  }

  async deleteDiscussionReply(id: number): Promise<boolean> {
    const result = await db
      .delete(discussionReplies)
      .where(eq(discussionReplies.id, id));
    return result.rowCount > 0;
  }

  // Analytics operations
  async getStudentGrades(studentId: string): Promise<any[]> {
    return await db
      .select({
        assignmentId: submissions.assignmentId,
        assignmentTitle: assignments.title,
        courseTitle: courses.title,
        courseCode: courses.courseCode,
        grade: submissions.grade,
        maxPoints: assignments.maxPoints,
        submittedAt: submissions.submittedAt,
        dueDate: assignments.dueDate,
        isLate: submissions.isLate,
      })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .innerJoin(courses, eq(assignments.courseId, courses.id))
      .where(eq(submissions.studentId, studentId))
      .orderBy(desc(submissions.submittedAt));
  }

  async getCourseStats(courseId: number): Promise<any> {
    const [stats] = await db
      .select({
        totalStudents: count(enrollments.id),
        totalAssignments: count(assignments.id),
        avgGrade: avg(submissions.grade),
      })
      .from(courses)
      .leftJoin(enrollments, eq(enrollments.courseId, courses.id))
      .leftJoin(assignments, eq(assignments.courseId, courses.id))
      .leftJoin(submissions, eq(submissions.assignmentId, assignments.id))
      .where(eq(courses.id, courseId))
      .groupBy(courses.id);
    return stats;
  }

  async getStudentStats(studentId: string): Promise<any> {
    const [stats] = await db
      .select({
        totalCourses: count(enrollments.id),
        totalSubmissions: count(submissions.id),
        avgGrade: avg(submissions.grade),
      })
      .from(users)
      .leftJoin(enrollments, eq(enrollments.studentId, users.id))
      .leftJoin(submissions, eq(submissions.studentId, users.id))
      .where(eq(users.id, studentId))
      .groupBy(users.id);
    return stats;
  }
}

export const storage = new DatabaseStorage();
