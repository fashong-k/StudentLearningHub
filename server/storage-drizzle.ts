import { users, courses, enrollments, assignments, submissions, announcements, messages, plagiarismChecks, plagiarismDatabase } from "@shared/schema";
import { db, dbSchema } from "./db-drizzle";
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
  getCoursesForStudent(studentId: string): Promise<CourseAttributes[]>;
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
  getAdvancedAnalytics(courseId?: number): Promise<any>;
  getStudentPerformanceTrends(studentId?: string, courseId?: number): Promise<any>;
  getAtRiskStudents(courseId?: number): Promise<any>;
  getCourseEngagementMetrics(courseId?: number): Promise<any>;
  getAssignmentAnalytics(courseId?: number): Promise<any>;
  
  // Plagiarism operations
  getPlagiarismCheck(submissionId: number): Promise<any>;
  getCoursePlagiarismChecks(courseId: number): Promise<any[]>;
  
  // Student management operations
  getAllStudents(): Promise<UserAttributes[]>;
  getStudentsFromTeacherCourses(teacherId: string): Promise<UserAttributes[]>;
  getStudentDetails(studentId: string): Promise<UserAttributes | undefined>;
  getAllStudentStats(): Promise<any>;
  getTeacherStudentStats(teacherId: string): Promise<any>;
  teacherHasStudentAccess(teacherId: string, studentId: string): Promise<boolean>;
}

export class DrizzleStorage implements IStorage {
  // Helper method to map database fields to camelCase
  private mapCourseFromDb(dbCourse: any): CourseAttributes {
    return {
      id: dbCourse.id,
      title: dbCourse.title,
      description: dbCourse.description,
      courseCode: dbCourse.course_code,
      teacherId: dbCourse.teacher_id,
      semester: dbCourse.semester,
      year: dbCourse.year,
      termType: dbCourse.term_type,
      startDate: dbCourse.start_date,
      endDate: dbCourse.end_date,
      visibility: dbCourse.visibility,
      gradingScheme: dbCourse.grading_scheme,
      isActive: dbCourse.is_active,
      createdAt: dbCourse.created_at,
      updatedAt: dbCourse.updated_at,
    };
  }

  private mapUserFromDb(dbUser: any): UserAttributes {
    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      profileImageUrl: dbUser.profile_image_url,
      role: dbUser.role,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
    };
  }

  // User operations
  async getUser(id: string): Promise<UserAttributes | undefined> {
    const result = await db.execute(sql`
      SELECT id, email, first_name, last_name, profile_image_url, role, created_at, updated_at
      FROM ${sql.identifier(dbSchema)}.users
      WHERE id = ${id}
    `);
    return result.rows[0] as UserAttributes;
  }

  async upsertUser(userData: Partial<UserAttributes> & { id: string }): Promise<UserAttributes> {
    const result = await db.execute(sql`
      INSERT INTO ${sql.identifier(dbSchema)}.users (id, email, first_name, last_name, profile_image_url, role, created_at, updated_at)
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
      SELECT 
        c.id, c.title, c.description, c.course_code, c.teacher_id, c.semester, c.year, 
        c.term_type, c.start_date, c.end_date, c.visibility, c.grading_scheme, c.is_active, 
        c.created_at, c.updated_at,
        u.first_name as teacher_first_name, u.last_name as teacher_last_name, u.email as teacher_email,
        COALESCE(enrollment_counts.enrolled_count, 0) as enrolled_count,
        COALESCE(assignment_counts.assignment_count, 0) as assignment_count
      FROM ${sql.identifier(dbSchema)}.courses c
      LEFT JOIN ${sql.identifier(dbSchema)}.users u ON c.teacher_id = u.id
      LEFT JOIN (
        SELECT course_id, COUNT(*) as enrolled_count
        FROM ${sql.identifier(dbSchema)}.enrollments
        WHERE is_active = true
        GROUP BY course_id
      ) enrollment_counts ON c.id = enrollment_counts.course_id
      LEFT JOIN (
        SELECT course_id, COUNT(*) as assignment_count
        FROM ${sql.identifier(dbSchema)}.assignments
        GROUP BY course_id
      ) assignment_counts ON c.id = assignment_counts.course_id
      ORDER BY c.title ASC
    `);
    return result.rows.map(row => {
      const course = this.mapCourseFromDb(row);
      if (row.teacher_first_name && row.teacher_last_name) {
        (course as any).teacher = {
          firstName: row.teacher_first_name,
          lastName: row.teacher_last_name,
          email: row.teacher_email
        };
      }
      // Add enrollment and assignment counts
      (course as any).enrolledCount = parseInt(row.enrolled_count) || 0;
      (course as any).assignmentCount = parseInt(row.assignment_count) || 0;
      return course;
    }) as CourseAttributes[];
  }

  async getCoursesForStudent(studentId: string): Promise<CourseAttributes[]> {
    const result = await db.execute(sql`
      SELECT 
        c.id, c.title, c.description, c.course_code, c.teacher_id, c.semester, c.year, 
        c.term_type, c.start_date, c.end_date, c.visibility, c.grading_scheme, c.is_active, 
        c.created_at, c.updated_at,
        u.first_name as teacher_first_name, u.last_name as teacher_last_name, u.email as teacher_email,
        COALESCE(enrollment_counts.enrolled_count, 0) as enrolled_count,
        COALESCE(assignment_counts.assignment_count, 0) as assignment_count,
        CASE WHEN student_enrollment.is_active = true THEN true ELSE false END as is_enrolled
      FROM ${sql.identifier(dbSchema)}.courses c
      LEFT JOIN ${sql.identifier(dbSchema)}.users u ON c.teacher_id = u.id
      LEFT JOIN (
        SELECT course_id, COUNT(*) as enrolled_count
        FROM ${sql.identifier(dbSchema)}.enrollments
        WHERE is_active = true
        GROUP BY course_id
      ) enrollment_counts ON c.id = enrollment_counts.course_id
      LEFT JOIN (
        SELECT course_id, COUNT(*) as assignment_count
        FROM ${sql.identifier(dbSchema)}.assignments
        GROUP BY course_id
      ) assignment_counts ON c.id = assignment_counts.course_id
      LEFT JOIN (
        SELECT course_id, is_active
        FROM ${sql.identifier(dbSchema)}.enrollments
        WHERE student_id = ${studentId}
      ) student_enrollment ON c.id = student_enrollment.course_id
      ORDER BY c.title ASC
    `);
    return result.rows.map(row => {
      const course = this.mapCourseFromDb(row);
      if (row.teacher_first_name && row.teacher_last_name) {
        (course as any).teacher = {
          firstName: row.teacher_first_name,
          lastName: row.teacher_last_name,
          email: row.teacher_email
        };
      }
      // Add enrollment and assignment counts
      (course as any).enrolledCount = parseInt(row.enrolled_count) || 0;
      (course as any).assignmentCount = parseInt(row.assignment_count) || 0;
      (course as any).isEnrolled = row.is_enrolled === true;
      return course;
    }) as CourseAttributes[];
  }

  async getCourseById(id: number): Promise<CourseAttributes | undefined> {
    const result = await db.execute(sql`
      SELECT 
        c.id, c.title, c.description, c.course_code, c.teacher_id, c.semester, c.year, 
        c.term_type, c.start_date, c.end_date, c.visibility, c.grading_scheme, c.is_active, 
        c.created_at, c.updated_at,
        u.first_name as teacher_first_name, u.last_name as teacher_last_name, u.email as teacher_email,
        COALESCE(enrollment_counts.enrolled_count, 0) as enrolled_count,
        COALESCE(assignment_counts.assignment_count, 0) as assignment_count
      FROM ${sql.identifier(dbSchema)}.courses c
      LEFT JOIN ${sql.identifier(dbSchema)}.users u ON c.teacher_id = u.id
      LEFT JOIN (
        SELECT course_id, COUNT(*) as enrolled_count
        FROM ${sql.identifier(dbSchema)}.enrollments
        WHERE is_active = true
        GROUP BY course_id
      ) enrollment_counts ON c.id = enrollment_counts.course_id
      LEFT JOIN (
        SELECT course_id, COUNT(*) as assignment_count
        FROM ${sql.identifier(dbSchema)}.assignments
        GROUP BY course_id
      ) assignment_counts ON c.id = assignment_counts.course_id
      WHERE c.id = ${id}
    `);
    
    if (!result.rows[0]) {
      return undefined;
    }
    
    const row = result.rows[0];
    const course = this.mapCourseFromDb(row);
    
    // Add teacher information if available
    if (row.teacher_first_name && row.teacher_last_name) {
      (course as any).teacher = {
        firstName: row.teacher_first_name,
        lastName: row.teacher_last_name,
        email: row.teacher_email
      };
    }
    
    // Add enrollment and assignment counts
    (course as any).enrolledCount = parseInt(row.enrolled_count) || 0;
    (course as any).assignmentCount = parseInt(row.assignment_count) || 0;
    
    return course;
  }

  async getTeacherCourses(teacherId: string): Promise<CourseAttributes[]> {
    const result = await db.execute(sql`
      SELECT 
        c.id, c.title, c.description, c.course_code, c.teacher_id, c.semester, c.year, 
        c.term_type, c.start_date, c.end_date, c.visibility, c.grading_scheme, c.is_active, 
        c.created_at, c.updated_at,
        u.first_name as teacher_first_name, u.last_name as teacher_last_name, u.email as teacher_email,
        COALESCE(enrollment_counts.enrolled_count, 0) as enrolled_count,
        COALESCE(assignment_counts.assignment_count, 0) as assignment_count
      FROM ${sql.identifier(dbSchema)}.courses c
      LEFT JOIN ${sql.identifier(dbSchema)}.users u ON c.teacher_id = u.id
      LEFT JOIN (
        SELECT course_id, COUNT(*) as enrolled_count
        FROM ${sql.identifier(dbSchema)}.enrollments
        WHERE is_active = true
        GROUP BY course_id
      ) enrollment_counts ON c.id = enrollment_counts.course_id
      LEFT JOIN (
        SELECT course_id, COUNT(*) as assignment_count
        FROM ${sql.identifier(dbSchema)}.assignments
        GROUP BY course_id
      ) assignment_counts ON c.id = assignment_counts.course_id
      WHERE c.teacher_id = ${teacherId}
      ORDER BY c.title ASC
    `);
    return result.rows.map(row => {
      const course = this.mapCourseFromDb(row);
      if (row.teacher_first_name && row.teacher_last_name) {
        (course as any).teacher = {
          firstName: row.teacher_first_name,
          lastName: row.teacher_last_name,
          email: row.teacher_email
        };
      }
      // Add enrollment and assignment counts
      (course as any).enrolledCount = parseInt(row.enrolled_count) || 0;
      (course as any).assignmentCount = parseInt(row.assignment_count) || 0;
      return course;
    }) as CourseAttributes[];
  }

  async getStudentCourses(studentId: string): Promise<CourseAttributes[]> {
    const result = await db.execute(sql`
      SELECT 
        c.id, c.title, c.description, c.course_code, c.teacher_id, c.semester, c.year, 
        c.term_type, c.start_date, c.end_date, c.visibility, c.grading_scheme, c.is_active, 
        c.created_at, c.updated_at,
        u.first_name as teacher_first_name, u.last_name as teacher_last_name, u.email as teacher_email,
        COALESCE(enrollment_counts.enrolled_count, 0) as enrolled_count,
        COALESCE(assignment_counts.assignment_count, 0) as assignment_count
      FROM ${sql.identifier(dbSchema)}.courses c
      INNER JOIN ${sql.identifier(dbSchema)}.enrollments e ON e.course_id = c.id
      LEFT JOIN ${sql.identifier(dbSchema)}.users u ON c.teacher_id = u.id
      LEFT JOIN (
        SELECT course_id, COUNT(*) as enrolled_count
        FROM ${sql.identifier(dbSchema)}.enrollments
        WHERE is_active = true
        GROUP BY course_id
      ) enrollment_counts ON c.id = enrollment_counts.course_id
      LEFT JOIN (
        SELECT course_id, COUNT(*) as assignment_count
        FROM ${sql.identifier(dbSchema)}.assignments
        GROUP BY course_id
      ) assignment_counts ON c.id = assignment_counts.course_id
      WHERE e.student_id = ${studentId}
      ORDER BY c.title ASC
    `);
    return result.rows.map(row => {
      const course = this.mapCourseFromDb(row);
      if (row.teacher_first_name && row.teacher_last_name) {
        (course as any).teacher = {
          firstName: row.teacher_first_name,
          lastName: row.teacher_last_name,
          email: row.teacher_email
        };
      }
      // Add enrollment and assignment counts
      (course as any).enrolledCount = parseInt(row.enrolled_count) || 0;
      (course as any).assignmentCount = parseInt(row.assignment_count) || 0;
      return course;
    }) as CourseAttributes[];
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
        INSERT INTO ${sql.identifier(dbSchema)}.courses 
        (title, description, course_code, teacher_id, semester, year, term_type, start_date, end_date, visibility, grading_scheme, is_active)
        VALUES 
        (${courseData.title}, ${courseData.description}, ${courseData.courseCode}, ${courseData.teacherId}, 
         ${courseData.semester}, ${courseData.year}, ${courseData.termType}, ${courseData.startDate}, ${courseData.endDate}, 
         ${courseData.visibility}::${sql.identifier(dbSchema)}.course_visibility, ${courseData.gradingScheme}::${sql.identifier(dbSchema)}.grading_scheme, ${courseData.isActive})
        RETURNING id, title, description, course_code, teacher_id, semester, year, term_type, start_date, end_date, visibility, grading_scheme, is_active, created_at, updated_at
      `);
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error('No course returned from insert operation');
      }
      
      const newCourse = result.rows[0];
      console.log('Successfully created course:', newCourse);
      return this.mapCourseFromDb(newCourse);
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
    try {
      // Check if student is already enrolled (active or inactive)
      const existingEnrollment = await db
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.studentId, studentId), eq(enrollments.courseId, courseId)))
        .limit(1);
      
      if (existingEnrollment.length > 0) {
        // If inactive enrollment exists, reactivate it
        if (!existingEnrollment[0].isActive) {
          const [reactivatedEnrollment] = await db
            .update(enrollments)
            .set({ isActive: true, enrolledAt: new Date() })
            .where(and(eq(enrollments.studentId, studentId), eq(enrollments.courseId, courseId)))
            .returning();
          return reactivatedEnrollment;
        }
        // If already active, return existing enrollment
        return existingEnrollment[0];
      }
      
      // Create new enrollment
      const [enrollment] = await db
        .insert(enrollments)
        .values({ 
          studentId, 
          courseId,
          enrolledAt: new Date(),
          isActive: true 
        })
        .returning();
      return enrollment;
    } catch (error) {
      // Handle unique constraint violation (duplicate enrollment)
      if (error.code === '23505') {
        // Fetch the existing enrollment and return it
        const [existingEnrollment] = await db
          .select()
          .from(enrollments)
          .where(and(eq(enrollments.studentId, studentId), eq(enrollments.courseId, courseId)))
          .limit(1);
        return existingEnrollment;
      }
      throw error;
    }
  }

  async unenrollStudent(studentId: string, courseId: number): Promise<boolean> {
    // Use soft delete to preserve academic records
    const result = await db
      .update(enrollments)
      .set({ isActive: false })
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

  // Student management operations
  async getAllStudents(): Promise<UserAttributes[]> {
    const result = await db.execute(sql`
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role, u.profile_image_url, u.created_at,
        COALESCE(course_counts.enrolled_courses, 0) as enrolled_courses,
        COALESCE(assignment_counts.completed_assignments, 0) as completed_assignments,
        COALESCE(grade_averages.average_grade, 0) as average_grade,
        COALESCE(activity.last_activity, NULL) as last_activity
      FROM ${sql.identifier(dbSchema)}.users u
      LEFT JOIN (
        SELECT student_id, COUNT(*) as enrolled_courses
        FROM ${sql.identifier(dbSchema)}.enrollments
        WHERE is_active = true
        GROUP BY student_id
      ) course_counts ON u.id = course_counts.student_id
      LEFT JOIN (
        SELECT student_id, COUNT(*) as completed_assignments
        FROM ${sql.identifier(dbSchema)}.submissions
        WHERE grade IS NOT NULL
        GROUP BY student_id
      ) assignment_counts ON u.id = assignment_counts.student_id
      LEFT JOIN (
        SELECT student_id, AVG(grade) as average_grade
        FROM ${sql.identifier(dbSchema)}.submissions
        WHERE grade IS NOT NULL
        GROUP BY student_id
      ) grade_averages ON u.id = grade_averages.student_id
      LEFT JOIN (
        SELECT student_id, MAX(submitted_at) as last_activity
        FROM ${sql.identifier(dbSchema)}.submissions
        GROUP BY student_id
      ) activity ON u.id = activity.student_id
      WHERE u.role = 'student'
      ORDER BY u.last_name ASC, u.first_name ASC
    `);
    
    return result.rows.map(row => ({
      ...this.mapUserFromDb(row),
      enrolledCourses: parseInt(row.enrolled_courses) || 0,
      completedAssignments: parseInt(row.completed_assignments) || 0,
      averageGrade: parseFloat(row.average_grade) || 0,
      lastActivity: row.last_activity,
      status: 'active' // Default status
    })) as UserAttributes[];
  }

  async getStudentsFromTeacherCourses(teacherId: string): Promise<UserAttributes[]> {
    const result = await db.execute(sql`
      SELECT DISTINCT
        u.id, u.email, u.first_name, u.last_name, u.role, u.profile_image_url, u.created_at,
        COALESCE(course_counts.enrolled_courses, 0) as enrolled_courses,
        COALESCE(assignment_counts.completed_assignments, 0) as completed_assignments,
        COALESCE(grade_averages.average_grade, 0) as average_grade,
        COALESCE(activity.last_activity, NULL) as last_activity
      FROM ${sql.identifier(dbSchema)}.users u
      INNER JOIN ${sql.identifier(dbSchema)}.enrollments e ON u.id = e.student_id
      INNER JOIN ${sql.identifier(dbSchema)}.courses c ON e.course_id = c.id
      LEFT JOIN (
        SELECT student_id, COUNT(*) as enrolled_courses
        FROM ${sql.identifier(dbSchema)}.enrollments
        WHERE is_active = true
        GROUP BY student_id
      ) course_counts ON u.id = course_counts.student_id
      LEFT JOIN (
        SELECT student_id, COUNT(*) as completed_assignments
        FROM ${sql.identifier(dbSchema)}.submissions
        WHERE grade IS NOT NULL
        GROUP BY student_id
      ) assignment_counts ON u.id = assignment_counts.student_id
      LEFT JOIN (
        SELECT student_id, AVG(grade) as average_grade
        FROM ${sql.identifier(dbSchema)}.submissions
        WHERE grade IS NOT NULL
        GROUP BY student_id
      ) grade_averages ON u.id = grade_averages.student_id
      LEFT JOIN (
        SELECT student_id, MAX(submitted_at) as last_activity
        FROM ${sql.identifier(dbSchema)}.submissions
        GROUP BY student_id
      ) activity ON u.id = activity.student_id
      WHERE u.role = 'student' AND c.teacher_id = ${teacherId} AND e.is_active = true
      ORDER BY u.last_name ASC, u.first_name ASC
    `);
    
    return result.rows.map(row => ({
      ...this.mapUserFromDb(row),
      enrolledCourses: parseInt(row.enrolled_courses) || 0,
      completedAssignments: parseInt(row.completed_assignments) || 0,
      averageGrade: parseFloat(row.average_grade) || 0,
      lastActivity: row.last_activity,
      status: 'active' // Default status
    })) as UserAttributes[];
  }

  async getCourseStudents(courseId: number): Promise<UserAttributes[]> {
    const result = await db.execute(sql`
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role, u.profile_image_url, u.created_at,
        COALESCE(course_counts.enrolled_courses, 0) as enrolled_courses,
        COALESCE(assignment_counts.completed_assignments, 0) as completed_assignments,
        COALESCE(grade_averages.average_grade, 0) as average_grade,
        COALESCE(activity.last_activity, NULL) as last_activity
      FROM ${sql.identifier(dbSchema)}.users u
      INNER JOIN ${sql.identifier(dbSchema)}.enrollments e ON u.id = e.student_id
      LEFT JOIN (
        SELECT student_id, COUNT(*) as enrolled_courses
        FROM ${sql.identifier(dbSchema)}.enrollments
        WHERE is_active = true
        GROUP BY student_id
      ) course_counts ON u.id = course_counts.student_id
      LEFT JOIN (
        SELECT student_id, COUNT(*) as completed_assignments
        FROM ${sql.identifier(dbSchema)}.submissions s
        INNER JOIN ${sql.identifier(dbSchema)}.assignments a ON s.assignment_id = a.id
        WHERE s.grade IS NOT NULL AND a.course_id = ${courseId}
        GROUP BY student_id
      ) assignment_counts ON u.id = assignment_counts.student_id
      LEFT JOIN (
        SELECT student_id, AVG(grade) as average_grade
        FROM ${sql.identifier(dbSchema)}.submissions s
        INNER JOIN ${sql.identifier(dbSchema)}.assignments a ON s.assignment_id = a.id
        WHERE s.grade IS NOT NULL AND a.course_id = ${courseId}
        GROUP BY student_id
      ) grade_averages ON u.id = grade_averages.student_id
      LEFT JOIN (
        SELECT student_id, MAX(submitted_at) as last_activity
        FROM ${sql.identifier(dbSchema)}.submissions s
        INNER JOIN ${sql.identifier(dbSchema)}.assignments a ON s.assignment_id = a.id
        WHERE a.course_id = ${courseId}
        GROUP BY student_id
      ) activity ON u.id = activity.student_id
      WHERE u.role = 'student' AND e.course_id = ${courseId} AND e.is_active = true
      ORDER BY u.last_name ASC, u.first_name ASC
    `);
    
    return result.rows.map(row => ({
      ...this.mapUserFromDb(row),
      enrolledCourses: parseInt(row.enrolled_courses) || 0,
      completedAssignments: parseInt(row.completed_assignments) || 0,
      averageGrade: parseFloat(row.average_grade) || 0,
      lastActivity: row.last_activity,
      status: 'active' // Default status
    })) as UserAttributes[];
  }

  async getStudentDetails(studentId: string): Promise<UserAttributes | undefined> {
    const result = await db.execute(sql`
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role, u.profile_image_url, u.created_at,
        COALESCE(course_counts.enrolled_courses, 0) as enrolled_courses,
        COALESCE(assignment_counts.completed_assignments, 0) as completed_assignments,
        COALESCE(grade_averages.average_grade, 0) as average_grade,
        COALESCE(activity.last_activity, NULL) as last_activity
      FROM ${sql.identifier(dbSchema)}.users u
      LEFT JOIN (
        SELECT student_id, COUNT(*) as enrolled_courses
        FROM ${sql.identifier(dbSchema)}.enrollments
        WHERE is_active = true
        GROUP BY student_id
      ) course_counts ON u.id = course_counts.student_id
      LEFT JOIN (
        SELECT student_id, COUNT(*) as completed_assignments
        FROM ${sql.identifier(dbSchema)}.submissions
        WHERE grade IS NOT NULL
        GROUP BY student_id
      ) assignment_counts ON u.id = assignment_counts.student_id
      LEFT JOIN (
        SELECT student_id, AVG(grade) as average_grade
        FROM ${sql.identifier(dbSchema)}.submissions
        WHERE grade IS NOT NULL
        GROUP BY student_id
      ) grade_averages ON u.id = grade_averages.student_id
      LEFT JOIN (
        SELECT student_id, MAX(submitted_at) as last_activity
        FROM ${sql.identifier(dbSchema)}.submissions
        GROUP BY student_id
      ) activity ON u.id = activity.student_id
      WHERE u.id = ${studentId} AND u.role = 'student'
    `);
    
    if (!result.rows[0]) {
      return undefined;
    }
    
    const row = result.rows[0];
    return {
      ...this.mapUserFromDb(row),
      enrolledCourses: parseInt(row.enrolled_courses) || 0,
      completedAssignments: parseInt(row.completed_assignments) || 0,
      averageGrade: parseFloat(row.average_grade) || 0,
      lastActivity: row.last_activity,
      status: 'active' // Default status
    } as UserAttributes;
  }

  async getAllStudentStats(): Promise<any> {
    const result = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT u.id) as total_students,
        COUNT(DISTINCT CASE WHEN e.is_active = true THEN u.id END) as active_students,
        COALESCE(AVG(grade_averages.average_grade), 0) as average_gpa,
        COUNT(DISTINCT e.id) as total_enrollments
      FROM ${sql.identifier(dbSchema)}.users u
      LEFT JOIN ${sql.identifier(dbSchema)}.enrollments e ON u.id = e.student_id
      LEFT JOIN (
        SELECT student_id, AVG(grade) as average_grade
        FROM ${sql.identifier(dbSchema)}.submissions
        WHERE grade IS NOT NULL
        GROUP BY student_id
      ) grade_averages ON u.id = grade_averages.student_id
      WHERE u.role = 'student'
    `);
    
    const row = result.rows[0];
    return {
      totalStudents: parseInt(row.total_students) || 0,
      activeStudents: parseInt(row.active_students) || 0,
      averageGPA: parseFloat(row.average_gpa) || 0,
      totalEnrollments: parseInt(row.total_enrollments) || 0
    };
  }

  async getTeacherStudentStats(teacherId: string): Promise<any> {
    const result = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT u.id) as total_students,
        COUNT(DISTINCT CASE WHEN e.is_active = true THEN u.id END) as active_students,
        COALESCE(AVG(grade_averages.average_grade), 0) as average_gpa,
        COUNT(DISTINCT e.id) as total_enrollments
      FROM ${sql.identifier(dbSchema)}.users u
      INNER JOIN ${sql.identifier(dbSchema)}.enrollments e ON u.id = e.student_id
      INNER JOIN ${sql.identifier(dbSchema)}.courses c ON e.course_id = c.id
      LEFT JOIN (
        SELECT student_id, AVG(grade) as average_grade
        FROM ${sql.identifier(dbSchema)}.submissions
        WHERE grade IS NOT NULL
        GROUP BY student_id
      ) grade_averages ON u.id = grade_averages.student_id
      WHERE u.role = 'student' AND c.teacher_id = ${teacherId}
    `);
    
    const row = result.rows[0];
    return {
      totalStudents: parseInt(row.total_students) || 0,
      activeStudents: parseInt(row.active_students) || 0,
      averageGPA: parseFloat(row.average_gpa) || 0,
      totalEnrollments: parseInt(row.total_enrollments) || 0
    };
  }

  async getCourseStudentStats(courseId: number): Promise<any> {
    const result = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT u.id) as total_students,
        COUNT(DISTINCT CASE WHEN e.is_active = true THEN u.id END) as active_students,
        COALESCE(AVG(grade_averages.average_grade), 0) as average_gpa,
        COUNT(DISTINCT e.id) as total_enrollments
      FROM ${sql.identifier(dbSchema)}.users u
      INNER JOIN ${sql.identifier(dbSchema)}.enrollments e ON u.id = e.student_id
      LEFT JOIN (
        SELECT student_id, AVG(grade) as average_grade
        FROM ${sql.identifier(dbSchema)}.submissions s
        INNER JOIN ${sql.identifier(dbSchema)}.assignments a ON s.assignment_id = a.id
        WHERE s.grade IS NOT NULL AND a.course_id = ${courseId}
        GROUP BY student_id
      ) grade_averages ON u.id = grade_averages.student_id
      WHERE u.role = 'student' AND e.course_id = ${courseId} AND e.is_active = true
    `);
    
    const row = result.rows[0];
    return {
      totalStudents: parseInt(row.total_students) || 0,
      activeStudents: parseInt(row.active_students) || 0,
      averageGPA: parseFloat(row.average_gpa) || 0,
      totalEnrollments: parseInt(row.total_enrollments) || 0
    };
  }

  async teacherHasStudentAccess(teacherId: string, studentId: string): Promise<boolean> {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM public.enrollments e
      INNER JOIN public.courses c ON e.course_id = c.id
      WHERE e.student_id = ${studentId} 
        AND c.teacher_id = ${teacherId}
        AND e.is_active = true
    `);
    
    return parseInt(result.rows[0].count) > 0;
  }

  // Advanced Analytics Methods
  async getAdvancedAnalytics(courseId?: number): Promise<any> {
    const courseFilter = courseId ? `AND c.id = ${courseId}` : '';
    
    const result = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT u.id) as total_students,
        COUNT(DISTINCT c.id) as total_courses,
        COUNT(DISTINCT a.id) as total_assignments,
        COUNT(DISTINCT s.id) as total_submissions,
        COALESCE(AVG(s.grade), 0) as average_grade,
        COUNT(DISTINCT CASE WHEN s.grade >= 90 THEN s.id END) as a_grades,
        COUNT(DISTINCT CASE WHEN s.grade >= 80 AND s.grade < 90 THEN s.id END) as b_grades,
        COUNT(DISTINCT CASE WHEN s.grade >= 70 AND s.grade < 80 THEN s.id END) as c_grades,
        COUNT(DISTINCT CASE WHEN s.grade >= 60 AND s.grade < 70 THEN s.id END) as d_grades,
        COUNT(DISTINCT CASE WHEN s.grade < 60 THEN s.id END) as f_grades,
        COUNT(DISTINCT CASE WHEN s.submitted_at > a.due_date THEN s.id END) as late_submissions,
        COUNT(DISTINCT CASE WHEN s.submitted_at IS NULL AND a.due_date < NOW() THEN a.id END) as missing_assignments
      FROM public.users u
      LEFT JOIN public.enrollments e ON u.id = e.student_id
      LEFT JOIN public.courses c ON e.course_id = c.id
      LEFT JOIN public.assignments a ON c.id = a.course_id
      LEFT JOIN public.submissions s ON a.id = s.assignment_id AND u.id = s.student_id
      WHERE u.role = 'student' ${sql.raw(courseFilter)}
    `);
    
    const row = result.rows[0];
    return {
      totalStudents: parseInt(row.total_students) || 0,
      totalCourses: parseInt(row.total_courses) || 0,
      totalAssignments: parseInt(row.total_assignments) || 0,
      totalSubmissions: parseInt(row.total_submissions) || 0,
      averageGrade: parseFloat(row.average_grade) || 0,
      gradeDistribution: {
        A: parseInt(row.a_grades) || 0,
        B: parseInt(row.b_grades) || 0,
        C: parseInt(row.c_grades) || 0,
        D: parseInt(row.d_grades) || 0,
        F: parseInt(row.f_grades) || 0
      },
      lateSubmissions: parseInt(row.late_submissions) || 0,
      missingAssignments: parseInt(row.missing_assignments) || 0
    };
  }

  async getStudentPerformanceTrends(studentId?: string, courseId?: number): Promise<any> {
    const studentFilter = studentId ? `AND s.student_id = '${studentId}'` : '';
    const courseFilter = courseId ? `AND a.course_id = ${courseId}` : '';
    
    const result = await db.execute(sql`
      SELECT 
        s.student_id,
        u.first_name || ' ' || u.last_name as student_name,
        a.title as assignment_title,
        s.grade,
        s.submitted_at,
        a.due_date,
        c.title as course_title,
        CASE WHEN s.submitted_at > a.due_date THEN true ELSE false END as is_late,
        ROW_NUMBER() OVER (PARTITION BY s.student_id ORDER BY s.submitted_at) as submission_order
      FROM public.submissions s
      INNER JOIN public.assignments a ON s.assignment_id = a.id
      INNER JOIN public.courses c ON a.course_id = c.id
      INNER JOIN public.users u ON s.student_id = u.id
      WHERE s.grade IS NOT NULL ${sql.raw(studentFilter)} ${sql.raw(courseFilter)}
      ORDER BY s.submitted_at ASC
    `);
    
    return result.rows.map(row => ({
      studentId: row.student_id,
      studentName: row.student_name,
      assignmentTitle: row.assignment_title,
      grade: parseFloat(row.grade),
      submittedAt: row.submitted_at,
      dueDate: row.due_date,
      courseTitle: row.course_title,
      isLate: row.is_late,
      submissionOrder: parseInt(row.submission_order)
    }));
  }

  async getAtRiskStudents(courseId?: number): Promise<any> {
    const courseFilter = courseId ? `AND c.id = ${courseId}` : '';
    
    const result = await db.execute(sql`
      SELECT 
        u.id,
        u.first_name || ' ' || u.last_name as student_name,
        u.email,
        COALESCE(AVG(s.grade), 0) as average_grade,
        COUNT(DISTINCT s.id) as total_submissions,
        COUNT(DISTINCT CASE WHEN s.submitted_at > a.due_date THEN s.id END) as late_submissions,
        COUNT(DISTINCT CASE WHEN s.submitted_at IS NULL AND a.due_date < NOW() THEN a.id END) as missing_assignments,
        MAX(s.submitted_at) as last_submission_date,
        COUNT(DISTINCT c.id) as enrolled_courses
      FROM public.users u
      INNER JOIN public.enrollments e ON u.id = e.student_id
      INNER JOIN public.courses c ON e.course_id = c.id
      LEFT JOIN public.assignments a ON c.id = a.course_id
      LEFT JOIN public.submissions s ON a.id = s.assignment_id AND u.id = s.student_id
      WHERE u.role = 'student' AND e.is_active = true ${sql.raw(courseFilter)}
      GROUP BY u.id, u.first_name, u.last_name, u.email
      HAVING 
        COALESCE(AVG(s.grade), 0) < 70 OR 
        COUNT(DISTINCT CASE WHEN s.submitted_at IS NULL AND a.due_date < NOW() THEN a.id END) > 2 OR
        COUNT(DISTINCT CASE WHEN s.submitted_at > a.due_date THEN s.id END) > 3
      ORDER BY average_grade ASC, missing_assignments DESC
    `);
    
    return result.rows.map(row => ({
      id: row.id,
      studentName: row.student_name,
      email: row.email,
      averageGrade: parseFloat(row.average_grade),
      totalSubmissions: parseInt(row.total_submissions),
      lateSubmissions: parseInt(row.late_submissions),
      missingAssignments: parseInt(row.missing_assignments),
      lastSubmissionDate: row.last_submission_date,
      enrolledCourses: parseInt(row.enrolled_courses),
      riskFactors: {
        lowGrade: parseFloat(row.average_grade) < 70,
        missingAssignments: parseInt(row.missing_assignments) > 2,
        lateSubmissions: parseInt(row.late_submissions) > 3,
        inactivity: !row.last_submission_date || new Date(row.last_submission_date) < new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      }
    }));
  }

  async getCourseEngagementMetrics(courseId?: number): Promise<any> {
    try {
      const courseFilter = courseId ? `AND c.id = ${courseId}` : '';
      
      const result = await db.execute(sql`
        SELECT 
          c.id as course_id,
          c.title as course_title,
          c.course_code,
          COUNT(DISTINCT e.student_id) as enrolled_students,
          COUNT(DISTINCT a.id) as total_assignments,
          COUNT(DISTINCT s.id) as total_submissions,
          COUNT(DISTINCT CASE WHEN s.grade IS NOT NULL THEN s.id END) as graded_submissions,
          COALESCE(AVG(s.grade), 0) as average_grade,
          COUNT(DISTINCT CASE WHEN s.submitted_at > a.due_date THEN s.id END) as late_submissions,
          COUNT(DISTINCT ann.id) as total_announcements,
          COUNT(DISTINCT msg.id) as total_messages,
          CASE 
            WHEN COUNT(DISTINCT a.id) > 0 AND COUNT(DISTINCT e.student_id) > 0 THEN 
              (COUNT(DISTINCT s.id)::float / (COUNT(DISTINCT a.id) * COUNT(DISTINCT e.student_id))) * 100
            ELSE 0 
          END as engagement_rate
        FROM public.courses c
        LEFT JOIN public.enrollments e ON c.id = e.course_id AND e.is_active = true
        LEFT JOIN public.assignments a ON c.id = a.course_id
        LEFT JOIN public.submissions s ON a.id = s.assignment_id
        LEFT JOIN public.announcements ann ON c.id = ann.course_id
        LEFT JOIN public.messages msg ON c.id = msg.course_id
        WHERE 1=1 ${sql.raw(courseFilter)}
        GROUP BY c.id, c.title, c.course_code
        ORDER BY c.id
      `);
      
      return result.rows.map(row => ({
        courseId: parseInt(row.course_id),
        courseTitle: row.course_title,
        courseCode: row.course_code,
        enrolledStudents: parseInt(row.enrolled_students),
        totalAssignments: parseInt(row.total_assignments),
        totalSubmissions: parseInt(row.total_submissions),
        gradedSubmissions: parseInt(row.graded_submissions),
        averageGrade: parseFloat(row.average_grade) || 0,
        lateSubmissions: parseInt(row.late_submissions),
        totalAnnouncements: parseInt(row.total_announcements),
        totalMessages: parseInt(row.total_messages),
        engagementRate: parseFloat(row.engagement_rate) || 0
      }));
    } catch (error) {
      console.error('Error in getCourseEngagementMetrics:', error);
      return [];
    }
  }

  async getAssignmentAnalytics(courseId?: number): Promise<any> {
    const courseFilter = courseId ? `AND c.id = ${courseId}` : '';
    
    const result = await db.execute(sql`
      SELECT 
        a.id as assignment_id,
        a.title as assignment_title,
        a.due_date,
        a.max_points,
        c.title as course_title,
        c.course_code,
        COUNT(DISTINCT s.id) as total_submissions,
        COUNT(DISTINCT CASE WHEN s.grade IS NOT NULL THEN s.id END) as graded_submissions,
        COALESCE(AVG(s.grade), 0) as average_grade,
        COALESCE(MAX(s.grade), 0) as highest_grade,
        COALESCE(MIN(s.grade), 0) as lowest_grade,
        COUNT(DISTINCT CASE WHEN s.submitted_at > a.due_date THEN s.id END) as late_submissions,
        COUNT(DISTINCT e.student_id) as enrolled_students,
        CASE 
          WHEN COUNT(DISTINCT e.student_id) > 0 THEN 
            (COUNT(DISTINCT s.id)::float / COUNT(DISTINCT e.student_id)) * 100
          ELSE 0 
        END as completion_rate
      FROM public.assignments a
      INNER JOIN public.courses c ON a.course_id = c.id
      LEFT JOIN public.enrollments e ON c.id = e.course_id AND e.is_active = true
      LEFT JOIN public.submissions s ON a.id = s.assignment_id
      WHERE 1=1 ${sql.raw(courseFilter)}
      GROUP BY a.id, a.title, a.due_date, a.max_points, c.title, c.course_code
      ORDER BY a.due_date DESC
    `);
    
    return result.rows.map(row => ({
      assignmentId: parseInt(row.assignment_id),
      assignmentTitle: row.assignment_title,
      dueDate: row.due_date,
      maxPoints: parseFloat(row.max_points) || 100,
      courseTitle: row.course_title,
      courseCode: row.course_code,
      totalSubmissions: parseInt(row.total_submissions),
      gradedSubmissions: parseInt(row.graded_submissions),
      averageGrade: parseFloat(row.average_grade),
      highestGrade: parseFloat(row.highest_grade),
      lowestGrade: parseFloat(row.lowest_grade),
      lateSubmissions: parseInt(row.late_submissions),
      enrolledStudents: parseInt(row.enrolled_students),
      completionRate: parseFloat(row.completion_rate)
    }));
  }
}

export const storage = new DrizzleStorage();