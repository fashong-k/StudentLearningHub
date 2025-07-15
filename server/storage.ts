import {
  User,
  Course,
  Enrollment,
  Assignment,
  Submission,
  Announcement,
  Message,
  type UserAttributes,
  type UserCreationAttributes,
  type CourseAttributes,
  type CourseCreationAttributes,
  type EnrollmentAttributes,
  type EnrollmentCreationAttributes,
  type AssignmentAttributes,
  type AssignmentCreationAttributes,
  type SubmissionAttributes,
  type SubmissionCreationAttributes,
  type AnnouncementAttributes,
  type AnnouncementCreationAttributes,
  type MessageAttributes,
  type MessageCreationAttributes,
} from "./models/models";
import { sequelize } from "./db";
import { Op } from "sequelize";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<UserAttributes | undefined>;
  upsertUser(user: Partial<UserCreationAttributes> & { id: string }): Promise<UserAttributes>;
  
  // Course operations
  getCourses(): Promise<CourseAttributes[]>;
  getCourseById(id: number): Promise<CourseAttributes | undefined>;
  getTeacherCourses(teacherId: string): Promise<CourseAttributes[]>;
  getStudentCourses(studentId: string): Promise<CourseAttributes[]>;
  createCourse(course: CourseCreationAttributes): Promise<CourseAttributes>;
  updateCourse(id: number, course: Partial<CourseCreationAttributes>): Promise<CourseAttributes>;
  deleteCourse(id: number): Promise<boolean>;
  
  // Enrollment operations
  enrollStudent(studentId: string, courseId: number): Promise<EnrollmentAttributes>;
  unenrollStudent(studentId: string, courseId: number): Promise<boolean>;
  getCourseEnrollments(courseId: number): Promise<EnrollmentAttributes[]>;
  getStudentEnrollments(studentId: string): Promise<EnrollmentAttributes[]>;
  
  // Assignment operations
  getAssignments(courseId: number): Promise<AssignmentAttributes[]>;
  getAssignmentById(id: number): Promise<AssignmentAttributes | undefined>;
  createAssignment(assignment: AssignmentCreationAttributes): Promise<AssignmentAttributes>;
  updateAssignment(id: number, assignment: Partial<AssignmentCreationAttributes>): Promise<AssignmentAttributes>;
  deleteAssignment(id: number): Promise<boolean>;
  
  // Submission operations
  getSubmissions(assignmentId: number): Promise<SubmissionAttributes[]>;
  getSubmissionById(id: number): Promise<SubmissionAttributes | undefined>;
  getStudentSubmissions(studentId: string): Promise<SubmissionAttributes[]>;
  createSubmission(submission: SubmissionCreationAttributes): Promise<SubmissionAttributes>;
  updateSubmission(id: number, submission: Partial<SubmissionCreationAttributes>): Promise<SubmissionAttributes>;
  gradeSubmission(id: number, grade: number, feedback?: string): Promise<SubmissionAttributes>;
  
  // Announcement operations
  getCourseAnnouncements(courseId: number): Promise<AnnouncementAttributes[]>;
  getAnnouncementById(id: number): Promise<AnnouncementAttributes | undefined>;
  createAnnouncement(announcement: AnnouncementCreationAttributes): Promise<AnnouncementAttributes>;
  updateAnnouncement(id: number, announcement: Partial<AnnouncementCreationAttributes>): Promise<AnnouncementAttributes>;
  deleteAnnouncement(id: number): Promise<boolean>;
  
  // Message operations
  getMessages(userId: string): Promise<MessageAttributes[]>;
  getConversation(senderId: string, receiverId: string): Promise<MessageAttributes[]>;
  sendMessage(message: MessageCreationAttributes): Promise<MessageAttributes>;
  markMessageAsRead(id: number): Promise<boolean>;
  
  // Analytics operations
  getStudentGrades(studentId: string): Promise<any[]>;
  getCourseStats(courseId: number): Promise<any>;
  getStudentStats(studentId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<UserAttributes | undefined> {
    const user = await User.findByPk(id);
    return user?.toJSON();
  }

  async upsertUser(userData: Partial<UserCreationAttributes> & { id: string }): Promise<UserAttributes> {
    const [user] = await User.upsert({
      ...userData,
      updatedAt: new Date(),
    });
    return user.toJSON();
  }

  // Course operations
  async getCourses(): Promise<CourseAttributes[]> {
    const courses = await Course.findAll({
      include: [{
        model: User,
        as: 'teacher',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['created_at', 'DESC']]
    });
    return courses.map(course => course.toJSON());
  }

  async getCourseById(id: number): Promise<CourseAttributes | undefined> {
    const course = await Course.findByPk(id, {
      include: [{
        model: User,
        as: 'teacher',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });
    return course?.toJSON();
  }

  async getTeacherCourses(teacherId: string): Promise<CourseAttributes[]> {
    const courses = await Course.findAll({
      where: { teacherId },
      include: [{
        model: User,
        as: 'teacher',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['created_at', 'DESC']]
    });
    return courses.map(course => course.toJSON());
  }

  async getStudentCourses(studentId: string): Promise<CourseAttributes[]> {
    const enrollments = await Enrollment.findAll({
      where: { studentId },
      include: [{
        model: Course,
        as: 'course',
        include: [{
          model: User,
          as: 'teacher',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }]
      }]
    });
    return enrollments.map(enrollment => enrollment.toJSON().course);
  }

  async createCourse(course: CourseCreationAttributes): Promise<CourseAttributes> {
    const newCourse = await Course.create(course);
    return newCourse.toJSON();
  }

  async updateCourse(id: number, course: Partial<CourseCreationAttributes>): Promise<CourseAttributes> {
    await Course.update(course, { where: { id } });
    const updatedCourse = await Course.findByPk(id);
    if (!updatedCourse) {
      throw new Error('Course not found');
    }
    return updatedCourse.toJSON();
  }

  async deleteCourse(id: number): Promise<boolean> {
    const result = await Course.destroy({ where: { id } });
    return result > 0;
  }

  // Enrollment operations
  async enrollStudent(studentId: string, courseId: number): Promise<EnrollmentAttributes> {
    const enrollment = await Enrollment.create({
      studentId,
      courseId,
      enrolledAt: new Date()
    });
    return enrollment.toJSON();
  }

  async unenrollStudent(studentId: string, courseId: number): Promise<boolean> {
    const result = await Enrollment.destroy({
      where: { studentId, courseId }
    });
    return result > 0;
  }

  async getCourseEnrollments(courseId: number): Promise<EnrollmentAttributes[]> {
    const enrollments = await Enrollment.findAll({
      where: { courseId },
      include: [{
        model: User,
        as: 'student',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });
    return enrollments.map(enrollment => enrollment.toJSON());
  }

  async getStudentEnrollments(studentId: string): Promise<EnrollmentAttributes[]> {
    const enrollments = await Enrollment.findAll({
      where: { studentId },
      include: [{
        model: Course,
        as: 'course'
      }]
    });
    return enrollments.map(enrollment => enrollment.toJSON());
  }

  // Assignment operations
  async getAssignments(courseId: number): Promise<AssignmentAttributes[]> {
    const assignments = await Assignment.findAll({
      where: { courseId },
      order: [['dueDate', 'ASC']]
    });
    return assignments.map(assignment => assignment.toJSON());
  }

  async getAssignmentById(id: number): Promise<AssignmentAttributes | undefined> {
    const assignment = await Assignment.findByPk(id, {
      include: [{
        model: Course,
        as: 'course'
      }]
    });
    return assignment?.toJSON();
  }

  async createAssignment(assignment: AssignmentCreationAttributes): Promise<AssignmentAttributes> {
    const newAssignment = await Assignment.create(assignment);
    return newAssignment.toJSON();
  }

  async updateAssignment(id: number, assignment: Partial<AssignmentCreationAttributes>): Promise<AssignmentAttributes> {
    await Assignment.update(assignment, { where: { id } });
    const updatedAssignment = await Assignment.findByPk(id);
    if (!updatedAssignment) {
      throw new Error('Assignment not found');
    }
    return updatedAssignment.toJSON();
  }

  async deleteAssignment(id: number): Promise<boolean> {
    const result = await Assignment.destroy({ where: { id } });
    return result > 0;
  }

  // Submission operations
  async getSubmissions(assignmentId: number): Promise<SubmissionAttributes[]> {
    const submissions = await Submission.findAll({
      where: { assignmentId },
      include: [{
        model: User,
        as: 'student',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });
    return submissions.map(submission => submission.toJSON());
  }

  async getSubmissionById(id: number): Promise<SubmissionAttributes | undefined> {
    const submission = await Submission.findByPk(id, {
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Assignment,
          as: 'assignment'
        }
      ]
    });
    return submission?.toJSON();
  }

  async getStudentSubmissions(studentId: string): Promise<SubmissionAttributes[]> {
    const submissions = await Submission.findAll({
      where: { studentId },
      include: [{
        model: Assignment,
        as: 'assignment',
        include: [{
          model: Course,
          as: 'course'
        }]
      }]
    });
    return submissions.map(submission => submission.toJSON());
  }

  async createSubmission(submission: SubmissionCreationAttributes): Promise<SubmissionAttributes> {
    const newSubmission = await Submission.create({
      ...submission,
      submittedAt: new Date()
    });
    return newSubmission.toJSON();
  }

  async updateSubmission(id: number, submission: Partial<SubmissionCreationAttributes>): Promise<SubmissionAttributes> {
    await Submission.update(submission, { where: { id } });
    const updatedSubmission = await Submission.findByPk(id);
    if (!updatedSubmission) {
      throw new Error('Submission not found');
    }
    return updatedSubmission.toJSON();
  }

  async gradeSubmission(id: number, grade: number, feedback?: string): Promise<SubmissionAttributes> {
    await Submission.update({ grade, feedback }, { where: { id } });
    const updatedSubmission = await Submission.findByPk(id);
    if (!updatedSubmission) {
      throw new Error('Submission not found');
    }
    return updatedSubmission.toJSON();
  }

  // Announcement operations
  async getCourseAnnouncements(courseId: number): Promise<AnnouncementAttributes[]> {
    const announcements = await Announcement.findAll({
      where: { courseId },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['created_at', 'DESC']]
    });
    return announcements.map(announcement => announcement.toJSON());
  }

  async getAnnouncementById(id: number): Promise<AnnouncementAttributes | undefined> {
    const announcement = await Announcement.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Course,
          as: 'course'
        }
      ]
    });
    return announcement?.toJSON();
  }

  async createAnnouncement(announcement: AnnouncementCreationAttributes): Promise<AnnouncementAttributes> {
    const newAnnouncement = await Announcement.create(announcement);
    return newAnnouncement.toJSON();
  }

  async updateAnnouncement(id: number, announcement: Partial<AnnouncementCreationAttributes>): Promise<AnnouncementAttributes> {
    await Announcement.update(announcement, { where: { id } });
    const updatedAnnouncement = await Announcement.findByPk(id);
    if (!updatedAnnouncement) {
      throw new Error('Announcement not found');
    }
    return updatedAnnouncement.toJSON();
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    const result = await Announcement.destroy({ where: { id } });
    return result > 0;
  }

  // Message operations
  async getMessages(userId: string): Promise<MessageAttributes[]> {
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    return messages.map(message => message.toJSON());
  }

  async getConversation(senderId: string, receiverId: string): Promise<MessageAttributes[]> {
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { [Op.and]: [{ senderId }, { receiverId }] },
          { [Op.and]: [{ senderId: receiverId }, { receiverId: senderId }] }
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['created_at', 'ASC']]
    });
    return messages.map(message => message.toJSON());
  }

  async sendMessage(message: MessageCreationAttributes): Promise<MessageAttributes> {
    const newMessage = await Message.create(message);
    return newMessage.toJSON();
  }

  async markMessageAsRead(id: number): Promise<boolean> {
    const result = await Message.update(
      { isRead: true },
      { where: { id } }
    );
    return result[0] > 0;
  }

  // Analytics operations
  async getStudentGrades(studentId: string): Promise<any[]> {
    const submissions = await Submission.findAll({
      where: { 
        studentId,
        grade: { [Op.not]: null }
      },
      include: [{
        model: Assignment,
        as: 'assignment',
        include: [{
          model: Course,
          as: 'course'
        }]
      }]
    });
    return submissions.map(submission => submission.toJSON());
  }

  async getCourseStats(courseId: number): Promise<any> {
    const course = await Course.findByPk(courseId);
    const enrollmentCount = await Enrollment.count({ where: { courseId } });
    const assignmentCount = await Assignment.count({ where: { courseId } });
    
    const submissions = await Submission.findAll({
      include: [{
        model: Assignment,
        as: 'assignment',
        where: { courseId }
      }],
      where: { grade: { [Op.not]: null } }
    });

    const grades = submissions.map(s => parseFloat(s.grade?.toString() || '0'));
    const averageGrade = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;

    return {
      course: course?.toJSON(),
      enrollmentCount,
      assignmentCount,
      submissionCount: submissions.length,
      averageGrade
    };
  }

  async getStudentStats(studentId: string): Promise<any> {
    const enrollmentCount = await Enrollment.count({ where: { studentId } });
    const submissions = await Submission.findAll({
      where: { 
        studentId,
        grade: { [Op.not]: null }
      }
    });

    const grades = submissions.map(s => parseFloat(s.grade?.toString() || '0'));
    const averageGrade = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;

    return {
      enrollmentCount,
      submissionCount: submissions.length,
      averageGrade
    };
  }
}

export const storage = new DatabaseStorage();