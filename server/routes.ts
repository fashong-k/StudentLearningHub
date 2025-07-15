import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupLocalAuth, isLocallyAuthenticated } from "./localAuth";
import { sequelize, testConnection, initializeDatabase } from "./db";
import {
  User,
  Course,
  Enrollment,
  Assignment,
  Submission,
  Announcement,
  Message,
  setupAssociations
} from "./models/models";
import { z } from "zod";

// Simple validation schemas for Sequelize
const insertCourseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  courseCode: z.string().min(1),
  semester: z.string().optional(),
  year: z.number().optional(),
  teacherId: z.string().min(1),
});

const insertAssignmentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  courseId: z.number(),
  dueDate: z.string().optional(),
  totalPoints: z.number().optional(),
});

const insertSubmissionSchema = z.object({
  assignmentId: z.number(),
  studentId: z.string().min(1),
  submittedAt: z.string().optional(),
  grade: z.number().optional(),
  feedback: z.string().optional(),
});

const insertAnnouncementSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  courseId: z.number(),
  authorId: z.string().min(1),
  isImportant: z.boolean().optional(),
});

const insertMessageSchema = z.object({
  senderId: z.string().min(1),
  receiverId: z.string().min(1),
  content: z.string().min(1),
  isRead: z.boolean().optional(),
});
import multer from "multer";
import path from "path";
import fs from "fs";

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database
  try {
    const dbInitialized = await initializeDatabase();
    
    if (dbInitialized) {
      // Set up model associations
      setupAssociations();
      
      // Sync database (create tables if they don't exist, don't alter existing ones)
      await sequelize.sync({ force: false });
      console.log('Database synchronized successfully.');
      
      console.log('All database tables have been created successfully.');
    } else {
      console.log('Database initialization failed, continuing without database...');
    }
  } catch (error) {
    console.error('Database setup failed:', error);
    console.log('Continuing without database connection for local development...');
  }
  
  // Auth middleware - use local auth if no DATABASE_URL (local development)
  if (process.env.DB_HOST) {
    setupLocalAuth(app);
  } 

  // if (process.env.DATABASE_URL) {
  //   await setupAuth(app);
  // } else {
  //   console.log('Using local authentication for development');
  //   setupLocalAuth(app);
  // }

  // Static file serving for uploads
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Determine which auth middleware to use
  const authMiddleware = isLocallyAuthenticated;
  // const authMiddleware = process.env.DATABASE_URL ? isAuthenticated : isLocallyAuthenticated;

  // Course routes
  app.get("/api/courses", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let courses;
      if (user.role === "teacher") {
        courses = await storage.getTeacherCourses(userId);
      } else {
        courses = await storage.getStudentCourses(userId);
      }

      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", authMiddleware, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourseById(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can create courses" });
      }

      const courseData = insertCourseSchema.parse({
        ...req.body,
        teacherId: userId,
      });

      const course = await storage.createCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.put("/api/courses/:id", authMiddleware, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can update courses" });
      }

      const course = await storage.getCourseById(courseId);
      if (!course || course.teacherId !== userId) {
        return res.status(403).json({ message: "You can only update your own courses" });
      }

      const courseData = insertCourseSchema.partial().parse(req.body);
      const updatedCourse = await storage.updateCourse(courseId, courseData);
      res.json(updatedCourse);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", authMiddleware, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can delete courses" });
      }

      const course = await storage.getCourseById(courseId);
      if (!course || course.teacherId !== userId) {
        return res.status(403).json({ message: "You can only delete your own courses" });
      }

      const deleted = await storage.deleteCourse(courseId);
      if (deleted) {
        res.json({ message: "Course deleted successfully" });
      } else {
        res.status(404).json({ message: "Course not found" });
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // Enrollment routes
  app.post("/api/courses/:id/enroll", authMiddleware, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "student") {
        return res.status(403).json({ message: "Only students can enroll in courses" });
      }

      const enrollment = await storage.enrollStudent(userId, courseId);
      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error enrolling student:", error);
      res.status(500).json({ message: "Failed to enroll student" });
    }
  });

  app.delete("/api/courses/:id/enroll", authMiddleware, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "student") {
        return res.status(403).json({ message: "Only students can unenroll from courses" });
      }

      const unenrolled = await storage.unenrollStudent(userId, courseId);
      if (unenrolled) {
        res.json({ message: "Successfully unenrolled from course" });
      } else {
        res.status(404).json({ message: "Enrollment not found" });
      }
    } catch (error) {
      console.error("Error unenrolling student:", error);
      res.status(500).json({ message: "Failed to unenroll student" });
    }
  });

  // Assignment routes
  app.get("/api/courses/:id/assignments", authMiddleware, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const assignments = await storage.getAssignments(courseId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.post("/api/courses/:id/assignments", authMiddleware, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can create assignments" });
      }

      const course = await storage.getCourseById(courseId);
      if (!course || course.teacherId !== userId) {
        return res.status(403).json({ message: "You can only create assignments for your own courses" });
      }

      const assignmentData = insertAssignmentSchema.parse({
        ...req.body,
        courseId,
      });

      const assignment = await storage.createAssignment(assignmentData);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  app.put("/api/assignments/:id", authMiddleware, async (req: any, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can update assignments" });
      }

      const assignment = await storage.getAssignmentById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      const course = await storage.getCourseById(assignment.courseId);
      if (!course || course.teacherId !== userId) {
        return res.status(403).json({ message: "You can only update assignments for your own courses" });
      }

      const assignmentData = insertAssignmentSchema.partial().parse(req.body);
      const updatedAssignment = await storage.updateAssignment(assignmentId, assignmentData);
      res.json(updatedAssignment);
    } catch (error) {
      console.error("Error updating assignment:", error);
      res.status(500).json({ message: "Failed to update assignment" });
    }
  });

  app.delete("/api/assignments/:id", authMiddleware, async (req: any, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can delete assignments" });
      }

      const assignment = await storage.getAssignmentById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      const course = await storage.getCourseById(assignment.courseId);
      if (!course || course.teacherId !== userId) {
        return res.status(403).json({ message: "You can only delete assignments for your own courses" });
      }

      const deleted = await storage.deleteAssignment(assignmentId);
      if (deleted) {
        res.json({ message: "Assignment deleted successfully" });
      } else {
        res.status(404).json({ message: "Assignment not found" });
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      res.status(500).json({ message: "Failed to delete assignment" });
    }
  });

  // Submission routes
  app.get("/api/assignments/:id/submissions", authMiddleware, async (req: any, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role === "teacher") {
        const assignment = await storage.getAssignmentById(assignmentId);
        if (!assignment) {
          return res.status(404).json({ message: "Assignment not found" });
        }

        const course = await storage.getCourseById(assignment.courseId);
        if (!course || course.teacherId !== userId) {
          return res.status(403).json({ message: "You can only view submissions for your own courses" });
        }

        const submissions = await storage.getSubmissions(assignmentId);
        res.json(submissions);
      } else {
        const submissions = await storage.getSubmissions(assignmentId);
        const userSubmissions = submissions.filter(sub => sub.studentId === userId);
        res.json(userSubmissions);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.post("/api/assignments/:id/submissions", authMiddleware, upload.single("file"), async (req: any, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "student") {
        return res.status(403).json({ message: "Only students can submit assignments" });
      }

      const assignment = await storage.getAssignmentById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      const submissionData = insertSubmissionSchema.parse({
        assignmentId,
        studentId: userId,
        submissionText: req.body.submissionText,
        filePath: req.file?.path,
        isLate: assignment.dueDate ? new Date() > new Date(assignment.dueDate) : false,
      });

      const submission = await storage.createSubmission(submissionData);
      res.status(201).json(submission);
    } catch (error) {
      console.error("Error creating submission:", error);
      res.status(500).json({ message: "Failed to create submission" });
    }
  });

  app.put("/api/submissions/:id/grade", authMiddleware, async (req: any, res) => {
    try {
      const submissionId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can grade submissions" });
      }

      const submission = await storage.getSubmissionById(submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      const assignment = await storage.getAssignmentById(submission.assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      const course = await storage.getCourseById(assignment.courseId);
      if (!course || course.teacherId !== userId) {
        return res.status(403).json({ message: "You can only grade submissions for your own courses" });
      }

      const { grade, feedback } = req.body;
      const gradedSubmission = await storage.gradeSubmission(submissionId, grade, feedback);
      res.json(gradedSubmission);
    } catch (error) {
      console.error("Error grading submission:", error);
      res.status(500).json({ message: "Failed to grade submission" });
    }
  });

  // Announcement routes
  app.get("/api/courses/:id/announcements", authMiddleware, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const announcements = await storage.getCourseAnnouncements(courseId);
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post("/api/courses/:id/announcements", authMiddleware, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can create announcements" });
      }

      const course = await storage.getCourseById(courseId);
      if (!course || course.teacherId !== userId) {
        return res.status(403).json({ message: "You can only create announcements for your own courses" });
      }

      const announcementData = insertAnnouncementSchema.parse({
        ...req.body,
        courseId,
        authorId: userId,
      });

      const announcement = await storage.createAnnouncement(announcementData);
      res.status(201).json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });

  // Message routes
  app.get("/api/messages", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messages = await storage.getMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: userId,
      });

      const message = await storage.sendMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/student/:studentId", authMiddleware, async (req: any, res) => {
    try {
      const studentId = req.params.studentId;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Students can only view their own analytics
      if (user.role === "student" && userId !== studentId) {
        return res.status(403).json({ message: "You can only view your own analytics" });
      }

      const grades = await storage.getStudentGrades(studentId);
      const stats = await storage.getStudentStats(studentId);
      
      res.json({ grades, stats });
    } catch (error) {
      console.error("Error fetching student analytics:", error);
      res.status(500).json({ message: "Failed to fetch student analytics" });
    }
  });

  app.get("/api/analytics/course/:courseId", authMiddleware, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can view course analytics" });
      }

      const course = await storage.getCourseById(courseId);
      if (!course || course.teacherId !== userId) {
        return res.status(403).json({ message: "You can only view analytics for your own courses" });
      }

      const stats = await storage.getCourseStats(courseId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching course analytics:", error);
      res.status(500).json({ message: "Failed to fetch course analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
