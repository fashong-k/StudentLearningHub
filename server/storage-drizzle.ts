import { users, courses, enrollments, assignments, submissions, announcements, messages, plagiarismChecks, plagiarismDatabase } from "@shared/schema";
import { db } from "./db-drizzle";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import type { 
  User as UserAttributes, 
  Course as CourseAttributes, 
  Enrollment as EnrollmentAttributes,
  Assignment as AssignmentAttributes,
  Submission as SubmissionAttributes,
  Announcement as AnnouncementAttributes,
  Message as MessageAttributes
} from "@shared/schema";

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
    const result = await db.execute(sql`
      SELECT id, email, first_name, last_name, profile_image_url, role, created_at, updated_at
      FROM student_learning_hub.users
      WHERE id = ${id}
    `);
    return result.rows[0] as UserAttributes;
  }

  async upsertUser(userData: Partial<UserAttributes> & { id: string }): Promise<UserAttributes> {
    const result = await db.execute(sql`
      INSERT INTO student_learning_hub.users (id, email, first_name, last_name, profile_image_url, role, created_at, updated_at)
      VALUES (${userData.id}, ${userData.email}, ${userData.firstName}, ${userData.lastName}, ${userData.profileImageUrl}, ${userData.role}, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        profile_image_url = EXCLUDED.profile_image_url,
        role = EXCLUDED.role,
        updated_at = NOW()
      RETURNING id, email, first_name, last_name, profile_image_url, role, created_at, updated_at
    `);
    return result.rows[0] as UserAttributes;
  }

  // Course operations
  async getCourses(): Promise<CourseAttributes[]> {
    const result = await db.execute(sql`
      SELECT id, title, description, course_code, teacher_id, semester, year, term_type, start_date, end_date, visibility, grading_scheme, is_active, created_at, updated_at
      FROM student_learning_hub.courses
      ORDER BY title ASC
    `);
    return result.rows as CourseAttributes[];
  }

  async getCourseById(id: number): Promise<CourseAttributes | undefined> {
    const result = await db.execute(sql`
      SELECT id, title, description, course_code, teacher_id, semester, year, term_type, start_date, end_date, visibility, grading_scheme, is_active, created_at, updated_at
      FROM student_learning_hub.courses
      WHERE id = ${id}
    `);
    return result.rows[0] as CourseAttributes;
  }

  async getTeacherCourses(teacherId: string): Promise<CourseAttributes[]> {
    const result = await db.execute(sql`
      SELECT id, title, description, course_code, teacher_id, semester, year, term_type, start_date, end_date, visibility, grading_scheme, is_active, created_at, updated_at
      FROM student_learning_hub.courses
      WHERE teacher_id = ${teacherId}
      ORDER BY title ASC
    `);
    return result.rows as CourseAttributes[];
  }

  async getStudentCourses(studentId: string): Promise<CourseAttributes[]> {
    const result = await db.execute(sql`
      SELECT c.id, c.title, c.description, c.course_code, c.teacher_id, c.semester, c.year, c.term_type, c.start_date, c.end_date, c.visibility, c.grading_scheme, c.is_active, c.created_at, c.updated_at
      FROM student_learning_hub.courses c
      INNER JOIN student_learning_hub.enrollments e ON e.course_id = c.id
      WHERE e.student_id = ${studentId}
      ORDER BY c.title ASC
    `);
    return result.rows as CourseAttributes[];
  }

  async createCourse(course: Omit<CourseAttributes, 'id' | 'createdAt' | 'updatedAt'>): Promise<CourseAttributes> {
    const courseData = {
      title: course.title,
      description: course.description,
      courseCode: course.courseCode,
      teacherId: course.teacherId,
      semester: course.semester,
      year: course.year,
      termType: course.termType || "semester",
      startDate: course.startDate || null,
      endDate: course.endDate || null,
      visibility: course.visibility || "private",
      gradingScheme: course.gradingScheme || "letter",
      isActive: course.isActive !== undefined ? course.isActive : true,
    };
    
    // Use raw SQL to ensure proper schema and enum handling
    try {
      const result = await db.execute(sql`
        INSERT INTO student_learning_hub.courses 
        (title, description, course_code, teacher_id, semester, year, term_type, start_date, end_date, visibility, grading_scheme, is_active)
        VALUES 
        (${courseData.title}, ${courseData.description}, ${courseData.courseCode}, ${courseData.teacherId}, 
         ${courseData.semester}, ${courseData.year}, ${courseData.termType}, ${courseData.startDate}, ${courseData.endDate}, 
         ${courseData.visibility}::student_learning_hub.course_visibility, ${courseData.gradingScheme}::student_learning_hub.grading_scheme, ${courseData.isActive})
        RETURNING id, title, description, course_code, teacher_id, semester, year, term_type, start_date, end_date, visibility, grading_scheme, is_active, created_at, updated_at
      `);
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error('No course returned from insert operation');
      }
      
      const newCourse = result.rows[0];
      console.log('Successfully created course:', newCourse);
      return newCourse as CourseAttributes;
    } catch (error) {
      console.error('Course creation failed:', error);
      throw error;
    }
  }

  async updateCourse(id: number, course: Partial<CourseAttributes>): Promise<CourseAttributes> {
    const updateData = {
      title: course.title,
      description: course.description,
      courseCode: course.courseCode,
      teacherId: course.teacherId,
      semester: course.semester,
      year: course.year,
      termType: course.termType,
      startDate: course.startDate,
      endDate: course.endDate,
      visibility: course.visibility,
      gradingScheme: course.gradingScheme,
      isActive: course.isActive,
      updatedAt: new Date(),
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    const [updatedCourse] = await db
      .update(courses)
      .set(updateData)
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