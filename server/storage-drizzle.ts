import { users, courses, enrollments, assignments, submissions, announcements, messages, plagiarismChecks, plagiarismDatabase } from "@shared/schema";
import { db } from "./db-drizzle";
import { eq, and, desc, asc } from "drizzle-orm";
import type { 
  UserAttributes, 
  CourseAttributes, 
  EnrollmentAttributes,
  AssignmentAttributes,
  SubmissionAttributes,
  AnnouncementAttributes,
  MessageAttributes
} from "./models/models";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<UserAttributes | undefined>;
  upsertUser(user: Partial<UserAttributes> & { id: string }): Promise<UserAttributes>;
  
  // Course operations
  getCourses(): Promise<CourseAttributes[]>;
  getCourseById(id: number): Promise<CourseAttributes | undefined>;
  getTeacherCourses(teacherId: string): Promise<CourseAttributes[]>;
  getStudentCourses(studentId: string): Promise<CourseAttributes[]>;
  createCourse(course: Omit<CourseAttributes, 'id' | 'createdAt' | 'updatedAt'>): Promise<CourseAttributes>;
  updateCourse(id: number, course: Partial<CourseAttributes>): Promise<CourseAttributes>;
  deleteCourse(id: number): Promise<boolean>;
  
  // Enrollment operations
  enrollStudent(studentId: string, courseId: number): Promise<EnrollmentAttributes>;
  unenrollStudent(studentId: string, courseId: number): Promise<boolean>;
  getCourseEnrollments(courseId: number): Promise<EnrollmentAttributes[]>;
  getStudentEnrollments(studentId: string): Promise<EnrollmentAttributes[]>;
  
  // Assignment operations
  getAssignments(courseId: number): Promise<AssignmentAttributes[]>;
  getAssignmentById(id: number): Promise<AssignmentAttributes | undefined>;
  createAssignment(assignment: Omit<AssignmentAttributes, 'id' | 'createdAt' | 'updatedAt'>): Promise<AssignmentAttributes>;
  updateAssignment(id: number, assignment: Partial<AssignmentAttributes>): Promise<AssignmentAttributes>;
  deleteAssignment(id: number): Promise<boolean>;
  
  // Submission operations
  getSubmissions(assignmentId: number): Promise<SubmissionAttributes[]>;
  getSubmissionById(id: number): Promise<SubmissionAttributes | undefined>;
  getStudentSubmissions(studentId: string): Promise<SubmissionAttributes[]>;
  createSubmission(submission: Omit<SubmissionAttributes, 'id'>): Promise<SubmissionAttributes>;
  updateSubmission(id: number, submission: Partial<SubmissionAttributes>): Promise<SubmissionAttributes>;
  gradeSubmission(id: number, grade: number, feedback?: string): Promise<SubmissionAttributes>;
  
  // Announcement operations
  getCourseAnnouncements(courseId: number): Promise<AnnouncementAttributes[]>;
  getAnnouncementById(id: number): Promise<AnnouncementAttributes | undefined>;
  createAnnouncement(announcement: Omit<AnnouncementAttributes, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnnouncementAttributes>;
  updateAnnouncement(id: number, announcement: Partial<AnnouncementAttributes>): Promise<AnnouncementAttributes>;
  deleteAnnouncement(id: number): Promise<boolean>;
  
  // Message operations
  getMessages(userId: string): Promise<MessageAttributes[]>;
  getConversation(senderId: string, receiverId: string): Promise<MessageAttributes[]>;
  sendMessage(message: Omit<MessageAttributes, 'id'>): Promise<MessageAttributes>;
  markMessageAsRead(id: number): Promise<boolean>;
  
  // Analytics operations
  getStudentGrades(studentId: string): Promise<any[]>;
  getCourseStats(courseId: number): Promise<any>;
  getStudentStats(studentId: string): Promise<any>;
  
  // Plagiarism operations
  getPlagiarismCheck(submissionId: number): Promise<any>;
  getCoursePlagiarismChecks(courseId: number): Promise<any[]>;
}

export class DrizzleStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<UserAttributes | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: Partial<UserAttributes> & { id: string }): Promise<UserAttributes> {
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
  async getCourses(): Promise<CourseAttributes[]> {
    return await db.select().from(courses).orderBy(asc(courses.title));
  }

  async getCourseById(id: number): Promise<CourseAttributes | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getTeacherCourses(teacherId: string): Promise<CourseAttributes[]> {
    return await db.select().from(courses).where(eq(courses.teacherId, teacherId));
  }

  async getStudentCourses(studentId: string): Promise<CourseAttributes[]> {
    const result = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        courseCode: courses.courseCode,
        teacherId: courses.teacherId,
        semester: courses.semester,
        year: courses.year,
        termType: courses.termType,
        startDate: courses.startDate,
        endDate: courses.endDate,
        visibility: courses.visibility,
        gradingScheme: courses.gradingScheme,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
      })
      .from(courses)
      .innerJoin(enrollments, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.studentId, studentId));
    
    return result;
  }

  async createCourse(course: Omit<CourseAttributes, 'id' | 'createdAt' | 'updatedAt'>): Promise<CourseAttributes> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: number, course: Partial<CourseAttributes>): Promise<CourseAttributes> {
    const [updatedCourse] = await db
      .update(courses)
      .set({ ...course, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    const result = await db.delete(courses).where(eq(courses.id, id));
    return result.rowCount > 0;
  }

  // Enrollment operations
  async enrollStudent(studentId: string, courseId: number): Promise<EnrollmentAttributes> {
    const [enrollment] = await db
      .insert(enrollments)
      .values({ studentId, courseId })
      .returning();
    return enrollment;
  }

  async unenrollStudent(studentId: string, courseId: number): Promise<boolean> {
    const result = await db
      .delete(enrollments)
      .where(and(eq(enrollments.studentId, studentId), eq(enrollments.courseId, courseId)));
    return result.rowCount > 0;
  }

  async getCourseEnrollments(courseId: number): Promise<EnrollmentAttributes[]> {
    return await db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  async getStudentEnrollments(studentId: string): Promise<EnrollmentAttributes[]> {
    return await db.select().from(enrollments).where(eq(enrollments.studentId, studentId));
  }

  // Assignment operations
  async getAssignments(courseId: number): Promise<AssignmentAttributes[]> {
    return await db.select().from(assignments).where(eq(assignments.courseId, courseId));
  }

  async getAssignmentById(id: number): Promise<AssignmentAttributes | undefined> {
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, id));
    return assignment;
  }

  async createAssignment(assignment: Omit<AssignmentAttributes, 'id' | 'createdAt' | 'updatedAt'>): Promise<AssignmentAttributes> {
    const [newAssignment] = await db.insert(assignments).values(assignment).returning();
    return newAssignment;
  }

  async updateAssignment(id: number, assignment: Partial<AssignmentAttributes>): Promise<AssignmentAttributes> {
    const [updatedAssignment] = await db
      .update(assignments)
      .set({ ...assignment, updatedAt: new Date() })
      .where(eq(assignments.id, id))
      .returning();
    return updatedAssignment;
  }

  async deleteAssignment(id: number): Promise<boolean> {
    const result = await db.delete(assignments).where(eq(assignments.id, id));
    return result.rowCount > 0;
  }

  // Submission operations
  async getSubmissions(assignmentId: number): Promise<SubmissionAttributes[]> {
    return await db.select().from(submissions).where(eq(submissions.assignmentId, assignmentId));
  }

  async getSubmissionById(id: number): Promise<SubmissionAttributes | undefined> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
    return submission;
  }

  async getStudentSubmissions(studentId: string): Promise<SubmissionAttributes[]> {
    return await db.select().from(submissions).where(eq(submissions.studentId, studentId));
  }

  async createSubmission(submission: Omit<SubmissionAttributes, 'id'>): Promise<SubmissionAttributes> {
    const [newSubmission] = await db.insert(submissions).values(submission).returning();
    return newSubmission;
  }

  async updateSubmission(id: number, submission: Partial<SubmissionAttributes>): Promise<SubmissionAttributes> {
    const [updatedSubmission] = await db
      .update(submissions)
      .set(submission)
      .where(eq(submissions.id, id))
      .returning();
    return updatedSubmission;
  }

  async gradeSubmission(id: number, grade: number, feedback?: string): Promise<SubmissionAttributes> {
    const [gradedSubmission] = await db
      .update(submissions)
      .set({ grade, feedback, gradedAt: new Date() })
      .where(eq(submissions.id, id))
      .returning();
    return gradedSubmission;
  }

  // Announcement operations
  async getCourseAnnouncements(courseId: number): Promise<AnnouncementAttributes[]> {
    return await db
      .select()
      .from(announcements)
      .where(eq(announcements.courseId, courseId))
      .orderBy(desc(announcements.createdAt));
  }

  async getAnnouncementById(id: number): Promise<AnnouncementAttributes | undefined> {
    const [announcement] = await db.select().from(announcements).where(eq(announcements.id, id));
    return announcement;
  }

  async createAnnouncement(announcement: Omit<AnnouncementAttributes, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnnouncementAttributes> {
    const [newAnnouncement] = await db.insert(announcements).values(announcement).returning();
    return newAnnouncement;
  }

  async updateAnnouncement(id: number, announcement: Partial<AnnouncementAttributes>): Promise<AnnouncementAttributes> {
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
  async getMessages(userId: string): Promise<MessageAttributes[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.receiverId, userId))
      .orderBy(desc(messages.sentAt));
  }

  async getConversation(senderId: string, receiverId: string): Promise<MessageAttributes[]> {
    return await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.senderId, senderId),
          eq(messages.receiverId, receiverId)
        )
      )
      .orderBy(asc(messages.sentAt));
  }

  async sendMessage(message: Omit<MessageAttributes, 'id'>): Promise<MessageAttributes> {
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

  // Analytics operations
  async getStudentGrades(studentId: string): Promise<any[]> {
    return await db
      .select({
        id: submissions.id,
        assignmentId: submissions.assignmentId,
        grade: submissions.grade,
        feedback: submissions.feedback,
        submittedAt: submissions.submittedAt,
        assignmentTitle: assignments.title,
        courseTitle: courses.title,
        maxPoints: assignments.maxPoints,
      })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .innerJoin(courses, eq(assignments.courseId, courses.id))
      .where(eq(submissions.studentId, studentId));
  }

  async getCourseStats(courseId: number): Promise<any> {
    // Implementation for course statistics
    return {
      totalStudents: 0,
      totalAssignments: 0,
      averageGrade: 0,
    };
  }

  async getStudentStats(studentId: string): Promise<any> {
    // Implementation for student statistics
    return {
      totalSubmissions: 0,
      averageGrade: 0,
      coursesEnrolled: 0,
    };
  }

  // Plagiarism operations
  async getPlagiarismCheck(submissionId: number): Promise<any> {
    const [check] = await db
      .select()
      .from(plagiarismChecks)
      .where(eq(plagiarismChecks.submissionId, submissionId));
    return check;
  }

  async getCoursePlagiarismChecks(courseId: number): Promise<any[]> {
    return await db
      .select({
        id: plagiarismChecks.id,
        submissionId: plagiarismChecks.submissionId,
        similarityScore: plagiarismChecks.similarityScore,
        status: plagiarismChecks.status,
        checkedAt: plagiarismChecks.checkedAt,
        checkedBy: plagiarismChecks.checkedBy,
      })
      .from(plagiarismChecks)
      .innerJoin(submissions, eq(plagiarismChecks.submissionId, submissions.id))
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .where(eq(assignments.courseId, courseId));
  }
}

export const storage = new DrizzleStorage();