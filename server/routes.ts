import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-drizzle";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupLocalAuth, isLocallyAuthenticated } from "./localAuth";
import { db } from "./db-drizzle";
import { sql } from "drizzle-orm";
import {
  insertCourseSchema,
  insertAssignmentSchema,
  insertSubmissionSchema,
  insertAnnouncementSchema,
  insertMessageSchema
} from "@shared/schema";
import { z } from "zod";
// import { courseUpdateValidator } from "./courseUpdateValidator";
// import { courseUpdateCascade } from "./courseUpdateCascade";
import multer from "multer";
import path from "path";
import fs from "fs";
import { initializeDatabase } from "./initializeDatabase";
import { initializeExtendedDatabase } from "./initializeExtendedDatabase";
import { analyzeCourseDeletionImpact, simulateCourseDeletion } from "./courseDeletionAnalyzer";

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

// Import the new seeding system
// import { runSeedProcess } from './seedData';

async function createDefaultUsers() {
  console.log('Creating default users...');
  
  const defaultUsers = [
    {
      id: 'admin',
      email: 'admin@lms.local',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin' as const,
      profileImageUrl: null,
    },
    {
      id: 'teacher',
      email: 'teacher@lms.local',
      firstName: 'John',
      lastName: 'Teacher',
      role: 'teacher' as const,
      profileImageUrl: null,
    },
    {
      id: 'student',
      email: 'student@lms.local',
      firstName: 'Jane',
      lastName: 'Student',
      role: 'student' as const,
      profileImageUrl: null,
    },
  ];

  for (const user of defaultUsers) {
    try {
      await storage.upsertUser(user);
      console.log(`✓ Created/updated user: ${user.id}`);
    } catch (error) {
      console.error(`Error creating user ${user.id}:`, error);
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database with Drizzle
  try {
    console.log('Database connected successfully with Drizzle');
    
    // Initialize database tables
    await initializeDatabase();
    
    // Initialize extended database tables for course update validation
    await initializeExtendedDatabase();
    
    // Create default users if they don't exist
    await createDefaultUsers();
  } catch (error) {
    console.error('Database setup failed:', error);
    console.log('Continuing without database connection for local development...');
  }
  
  // Auth middleware - use local auth for local development
  console.log('Setting up local authentication for development');
  setupLocalAuth(app);

  // Static file serving for uploads
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Determine which auth middleware to use
  const authMiddleware = isLocallyAuthenticated;
  // const authMiddleware = process.env.DATABASE_URL ? isAuthenticated : isLocallyAuthenticated;

  // Test database connection
  app.get("/api/test-db-connection", async (req: any, res) => {
    try {
      const result = await db.execute(sql`SELECT 1 as test`);
      res.json({ status: "success", message: "Database connection working", result: result.rows });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Database connection failed", error: error.message });
    }
  });

  // Course routes
  app.get("/api/courses", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id; // Use local auth user structure
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let courses;
      if (user.role === "teacher") {
        courses = await storage.getTeacherCourses(userId);
      } else if (user.role === "student") {
        courses = await storage.getCoursesForStudent(userId);
      } else {
        courses = await storage.getCourses();
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

  // Get course enrollments
  app.get("/api/enrollments/:courseId", authMiddleware, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can view enrollments" });
      }

      const enrollments = await storage.getCourseEnrollments(courseId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  // Get course assignments
  app.get("/api/assignments/:courseId", authMiddleware, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const assignments = await storage.getAssignments(courseId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  // Get course announcements
  app.get("/api/announcements/:courseId", authMiddleware, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const announcements = await storage.getCourseAnnouncements(courseId);
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post("/api/courses", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can create courses" });
      }

      console.log("Raw request body:", req.body);
      
      const courseData = {
        title: req.body.title,
        courseCode: req.body.courseCode,
        teacherId: userId,
        description: req.body.description || null,
        semester: req.body.semester || null,
        year: req.body.year || null,
        termType: req.body.termType || "semester",
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        visibility: req.body.visibility || "private",
        gradingScheme: req.body.gradingScheme || "letter",
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      };

      console.log("Parsed course data:", courseData);

      const course = await storage.createCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      if (error instanceof Error && error.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ message: "Course code already exists" });
      }
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  // Course update validation endpoint
  app.post("/api/courses/:id/validate-update", authMiddleware, async (req: any, res) => {
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

      const updates = req.body;
      const { validateCourseUpdate } = await import('./courseUpdateValidator-simple');
      const validation = await validateCourseUpdate(courseId, updates, course);
      
      res.json({ validation });
    } catch (error) {
      console.error("Error validating course update:", error);
      res.status(500).json({ message: "Failed to validate course update" });
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

      // Parse and validate the request body - convert dates properly
      const courseData = {
        ...req.body,
        // Convert string dates to Date objects if they exist
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      };
      
      // Validate the update before proceeding
      const { validateCourseUpdate } = await import('./courseUpdateValidator-simple');
      const validation = await validateCourseUpdate(courseId, courseData, course);
      
      if (!validation.canUpdate) {
        return res.status(400).json({ 
          message: "Course update validation failed",
          errors: validation.errors,
          warnings: validation.warnings,
        });
      }

      // Perform cascade updates
      const { applyCourseUpdateCascade } = await import('./courseUpdateCascade-simple');
      const cascadeResult = await applyCourseUpdateCascade(courseId, courseData);

      // Update the course
      const updatedCourse = await storage.updateCourse(courseId, courseData);
      
      res.json({
        course: updatedCourse,
        cascadeResult,
        validation: {
          warnings: validation.warnings,
          affectedRecords: validation.affectedRecords,
        },
      });
    } catch (error) {
      console.error("Error updating course:", error);
      if (error instanceof Error && error.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ message: "Course code already exists" });
      }
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  // Analyze course deletion impact
  app.post("/api/courses/:id/analyze-deletion", authMiddleware, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.id; // Use local auth user structure
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can analyze course deletion" });
      }

      const course = await storage.getCourseById(courseId);
      if (!course || course.teacherId !== userId) {
        return res.status(403).json({ message: "You can only analyze deletion of your own courses" });
      }

      const impactAnalysis = await analyzeCourseDeletionImpact(courseId);
      res.json({ impactAnalysis });
    } catch (error) {
      console.error("Error analyzing course deletion:", error);
      res.status(500).json({ message: "Failed to analyze course deletion" });
    }
  });

  app.delete("/api/courses/:id", authMiddleware, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.id; // Use local auth user structure
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can delete courses" });
      }

      const course = await storage.getCourseById(courseId);
      if (!course || course.teacherId !== userId) {
        return res.status(403).json({ message: "You can only delete your own courses" });
      }

      // Analyze impact before deletion
      const impactAnalysis = await analyzeCourseDeletionImpact(courseId);
      
      // Perform the deletion - CASCADE DELETE will handle all related records
      const deleted = await storage.deleteCourse(courseId);
      
      if (deleted) {
        res.json({ 
          message: "Course deleted successfully",
          deletionSummary: {
            courseTitle: course.title,
            courseCode: course.courseCode,
            cascadeEffects: impactAnalysis.cascadeEffects,
            totalRecordsDeleted: Object.values(impactAnalysis.cascadeEffects).reduce((sum, count) => sum + count, 0)
          }
        });
      } else {
        res.status(404).json({ message: "Course not found" });
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // Enroll in a course
  app.post("/api/courses/:id/enroll", authMiddleware, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "student") {
        return res.status(403).json({ message: "Only students can enroll in courses" });
      }

      const course = await storage.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      const enrollment = await storage.enrollStudent(userId, courseId);
      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error enrolling in course:", error);
      if (error instanceof Error && error.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ message: "Already enrolled in this course" });
      }
      res.status(500).json({ message: "Failed to enroll in course" });
    }
  });

  // Unenroll from a course
  app.delete("/api/courses/:id/enroll", authMiddleware, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.id; // Use local auth user structure
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "student") {
        return res.status(403).json({ message: "Only students can unenroll from courses" });
      }

      const success = await storage.unenrollStudent(userId, courseId);
      if (success) {
        res.json({ 
          message: "Successfully unenrolled from course",
          note: "Your academic records (grades, submissions, attendance) have been preserved for institutional records"
        });
      } else {
        res.status(404).json({ message: "Enrollment not found" });
      }
    } catch (error) {
      console.error("Error unenrolling from course:", error);
      res.status(500).json({ message: "Failed to unenroll from course" });
    }
  });

  // Enrollment routes
  app.post("/api/courses/:id/enroll", authMiddleware, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.id; // Use local auth user structure
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



  // Assignment routes
  app.get("/api/assignments", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let assignments = [];
      
      if (user.role === "student") {
        // Students see assignments from their enrolled courses
        const courses = await storage.getStudentCourses(userId);
        for (const course of courses) {
          const courseAssignments = await storage.getAssignments(course.id);
          assignments.push(...courseAssignments);
        }
      } else if (user.role === "teacher") {
        // Teachers see assignments from their courses
        const courses = await storage.getTeacherCourses(userId);
        for (const course of courses) {
          const courseAssignments = await storage.getAssignments(course.id);
          assignments.push(...courseAssignments);
        }
      } else {
        // Admin sees all assignments
        const courses = await storage.getCourses();
        for (const course of courses) {
          const courseAssignments = await storage.getAssignments(course.id);
          assignments.push(...courseAssignments);
        }
      }
      
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

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

      // Prepare assignment data with proper type conversion
      const assignmentData = {
        title: req.body.title,
        description: req.body.description,
        courseId,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        maxPoints: req.body.maxPoints ? req.body.maxPoints.toString() : null,
        assignmentType: req.body.assignmentType || "homework",
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      };

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

      // Prepare assignment update data with proper type conversion
      const assignmentData: any = {};
      
      if (req.body.title !== undefined) assignmentData.title = req.body.title;
      if (req.body.description !== undefined) assignmentData.description = req.body.description;
      if (req.body.dueDate !== undefined) assignmentData.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
      if (req.body.maxPoints !== undefined) assignmentData.maxPoints = req.body.maxPoints ? parseFloat(req.body.maxPoints) : null;
      if (req.body.assignmentType !== undefined) assignmentData.assignmentType = req.body.assignmentType;
      if (req.body.isActive !== undefined) assignmentData.isActive = req.body.isActive;

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

      // Prepare submission data with proper type conversion
      const submissionData = {
        assignmentId,
        studentId: userId,
        submissionText: req.body.submissionText || null,
        filePath: req.file?.path || null,
        submittedAt: req.body.submittedAt ? new Date(req.body.submittedAt) : new Date(),
        isLate: assignment.dueDate ? new Date() > new Date(assignment.dueDate) : false,
        grade: null,
        feedback: null,
        gradedAt: null,
      };

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
  app.get("/api/announcements", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let announcements = [];
      
      if (user.role === "student") {
        // Students see announcements from their enrolled courses
        const courses = await storage.getStudentCourses(userId);
        for (const course of courses) {
          const courseAnnouncements = await storage.getCourseAnnouncements(course.id);
          announcements.push(...courseAnnouncements);
        }
      } else if (user.role === "teacher") {
        // Teachers see announcements from their courses
        const courses = await storage.getTeacherCourses(userId);
        for (const course of courses) {
          const courseAnnouncements = await storage.getCourseAnnouncements(course.id);
          announcements.push(...courseAnnouncements);
        }
      } else {
        // Admin sees all announcements
        const courses = await storage.getCourses();
        for (const course of courses) {
          const courseAnnouncements = await storage.getCourseAnnouncements(course.id);
          announcements.push(...courseAnnouncements);
        }
      }
      
      // Sort announcements by creation date (newest first)
      announcements.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

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

      const announcementData = {
        title: req.body.title,
        courseId,
        content: req.body.content,
        authorId: userId,
        isImportant: req.body.isImportant || false,
      };

      const announcement = await storage.createAnnouncement(announcementData);
      res.status(201).json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });

  // Message routes
  app.get("/api/conversations", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // For now, return empty array as conversations are not implemented yet
      // In a real implementation, this would aggregate messages by conversation
      res.json([]);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

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
      
      const messageData = {
        content: req.body.content,
        senderId: userId,
        receiverId: req.body.receiverId,
        courseId: req.body.courseId || null,
        isRead: req.body.isRead || false,
        subject: req.body.subject || null,
        sentAt: new Date(),
      };

      const message = await storage.sendMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Grades route
  app.get("/api/grades", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role === "student") {
        // Students see their own grades
        const grades = await storage.getStudentGrades(userId);
        res.json(grades);
      } else if (user.role === "teacher") {
        // Teachers see all submissions for their courses
        const courses = await storage.getTeacherCourses(userId);
        const allSubmissions = [];
        
        for (const course of courses) {
          const assignments = await storage.getAssignments(course.id);
          for (const assignment of assignments) {
            const submissions = await storage.getSubmissions(assignment.id);
            allSubmissions.push(...submissions);
          }
        }
        
        res.json(allSubmissions);
      } else {
        // Admin can see all grades
        const grades = await storage.getStudentGrades(userId);
        res.json(grades);
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
      res.status(500).json({ message: "Failed to fetch grades" });
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

  // Plagiarism detection endpoints
  app.post("/api/plagiarism/check", authMiddleware, async (req: any, res) => {
    try {
      const { submissionId } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!submissionId) {
        return res.status(400).json({ message: "Submission ID is required" });
      }

      // Only teachers and admins can run plagiarism checks
      if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // Get submission details
      const submission = await storage.getSubmissionById(submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      // Check if user has permission to check this submission
      if (user.role === 'teacher') {
        const assignment = await storage.getAssignmentById(submission.assignmentId);
        if (!assignment) {
          return res.status(404).json({ message: "Assignment not found" });
        }
        const course = await storage.getCourseById(assignment.courseId);
        if (!course || course.teacherId !== userId) {
          return res.status(403).json({ message: "You can only check submissions for your courses" });
        }
      }

      // Run plagiarism check
      const { plagiarismService } = await import('./plagiarismDetection');
      const result = await plagiarismService.analyzeSubmission(
        submissionId,
        submission.submissionText || '',
        userId
      );

      res.json(result);
    } catch (error) {
      console.error("Plagiarism check error:", error);
      res.status(500).json({ message: "Failed to run plagiarism check" });
    }
  });

  app.get("/api/plagiarism/results/:submissionId", authMiddleware, async (req: any, res) => {
    try {
      const { submissionId } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // Check if user has permission to view this submission's results
      if (user.role === 'teacher') {
        const submission = await storage.getSubmissionById(parseInt(submissionId));
        if (!submission) {
          return res.status(404).json({ message: "Submission not found" });
        }
        const assignment = await storage.getAssignmentById(submission.assignmentId);
        if (!assignment) {
          return res.status(404).json({ message: "Assignment not found" });
        }
        const course = await storage.getCourseById(assignment.courseId);
        if (!course || course.teacherId !== userId) {
          return res.status(403).json({ message: "You can only view results for your courses" });
        }
      }

      // Get plagiarism results
      const { plagiarismService } = await import('./plagiarismDetection');
      const result = await plagiarismService.getPlagiarismResults(parseInt(submissionId));
      
      if (!result) {
        return res.status(404).json({ message: "No plagiarism results found" });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching plagiarism results:", error);
      res.status(500).json({ message: "Failed to fetch plagiarism results" });
    }
  });

  app.get("/api/plagiarism/course/:courseId", authMiddleware, async (req: any, res) => {
    try {
      const { courseId } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      // Only teachers and admins can view course plagiarism results
      if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // Check if user has permission to view this course
      if (user.role === 'teacher') {
        const course = await storage.getCourseById(parseInt(courseId));
        if (!course || course.teacherId !== userId) {
          return res.status(403).json({ message: "You can only view plagiarism results for your courses" });
        }
      }

      const { plagiarismService } = await import('./plagiarismDetection');
      const results = await plagiarismService.getCoursePlagiarismChecks(parseInt(courseId));

      res.json(results);
    } catch (error) {
      console.error("Error fetching course plagiarism results:", error);
      res.status(500).json({ message: "Failed to fetch course plagiarism results" });
    }
  });

  // Student Management API endpoints
  app.get("/api/students", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id; // Use local auth user structure
      const user = await storage.getUser(userId);
      const courseId = req.query.courseId;
      
      if (!user || (user.role !== "teacher" && user.role !== "admin")) {
        return res.status(403).json({ message: "Only teachers and admins can view student management" });
      }

      let students = [];
      
      if (courseId) {
        // Course-specific students
        if (user.role === "admin") {
          students = await storage.getCourseStudents(parseInt(courseId));
        } else if (user.role === "teacher") {
          // Check if teacher owns the course
          const course = await storage.getCourseById(parseInt(courseId));
          if (course && course.teacherId === userId) {
            students = await storage.getCourseStudents(parseInt(courseId));
          } else {
            return res.status(403).json({ message: "You can only view students from your own courses" });
          }
        }
      } else {
        // All students based on role
        if (user.role === "admin") {
          students = await storage.getAllStudents();
        } else if (user.role === "teacher") {
          students = await storage.getStudentsFromTeacherCourses(userId);
        }
      }

      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/students/stats", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id; // Use local auth user structure
      const user = await storage.getUser(userId);
      const courseId = req.query.courseId;
      
      if (!user || (user.role !== "teacher" && user.role !== "admin")) {
        return res.status(403).json({ message: "Only teachers and admins can view student statistics" });
      }

      let stats = {};
      
      if (courseId) {
        // Course-specific statistics
        if (user.role === "admin") {
          stats = await storage.getCourseStudentStats(parseInt(courseId));
        } else if (user.role === "teacher") {
          // Check if teacher owns the course
          const course = await storage.getCourseById(parseInt(courseId));
          if (course && course.teacherId === userId) {
            stats = await storage.getCourseStudentStats(parseInt(courseId));
          } else {
            return res.status(403).json({ message: "You can only view statistics for your own courses" });
          }
        }
      } else {
        // General statistics based on role
        if (user.role === "admin") {
          stats = await storage.getAllStudentStats();
        } else if (user.role === "teacher") {
          stats = await storage.getTeacherStudentStats(userId);
        }
      }

      res.json(stats);
    } catch (error) {
      console.error("Error fetching student statistics:", error);
      res.status(500).json({ message: "Failed to fetch student statistics" });
    }
  });

  app.get("/api/students/:studentId", authMiddleware, async (req: any, res) => {
    try {
      const { studentId } = req.params;
      const userId = req.user.id; // Use local auth user structure
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== "teacher" && user.role !== "admin")) {
        return res.status(403).json({ message: "Only teachers and admins can view student details" });
      }

      const student = await storage.getStudentDetails(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Check if teacher has permission to view this student
      if (user.role === "teacher") {
        const hasPermission = await storage.teacherHasStudentAccess(userId, studentId);
        if (!hasPermission) {
          return res.status(403).json({ message: "You can only view students from your courses" });
        }
      }

      res.json(student);
    } catch (error) {
      console.error("Error fetching student details:", error);
      res.status(500).json({ message: "Failed to fetch student details" });
    }
  });

  app.get("/api/students/:studentId/courses", authMiddleware, async (req: any, res) => {
    try {
      const { studentId } = req.params;
      const userId = req.user.id; // Use local auth user structure
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== "teacher" && user.role !== "admin")) {
        return res.status(403).json({ message: "Only teachers and admins can view student courses" });
      }

      // Check if teacher has permission to view this student
      if (user.role === "teacher") {
        const hasPermission = await storage.teacherHasStudentAccess(userId, studentId);
        if (!hasPermission) {
          return res.status(403).json({ message: "You can only view students from your courses" });
        }
      }

      const courses = await storage.getStudentCourses(studentId);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching student courses:", error);
      res.status(500).json({ message: "Failed to fetch student courses" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
