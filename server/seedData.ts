import { User, Course, Assignment, Enrollment, Announcement, Message, Submission } from './models/models';
import { sequelize } from './db';

export async function shouldSeedData(): Promise<boolean> {
  const environment = process.env.ENVIRONMENT || 'development';
  const runMode = process.env.RUN_MODE || 'demo';
  
  console.log(`Environment: ${environment}, Run Mode: ${runMode}`);
  
  // Check if we should seed data based on environment
  if (environment === 'development') {
    return true; // Always seed in development
  } else if (environment === 'production' && runMode === 'demo') {
    return true; // Seed in production if demo mode
  }
  
  return false; // Don't seed in production live mode
}

export async function checkIfDataExists(): Promise<boolean> {
  try {
    const userCount = await User.count();
    const courseCount = await Course.count();
    const assignmentCount = await Assignment.count();
    
    // If we have any substantial data, don't seed
    return userCount > 3 || courseCount > 0 || assignmentCount > 0;
  } catch (error) {
    console.error('Error checking existing data:', error);
    return false;
  }
}

export async function seedDefaultUsers() {
  console.log('Seeding default users...');
  
  const defaultUsers = [
    {
      id: 'admin',
      email: 'admin@lms.local',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin' as const,
      profileImageUrl: undefined
    },
    {
      id: 'teacher',
      email: 'teacher@lms.local',
      firstName: 'John',
      lastName: 'Teacher',
      role: 'teacher' as const,
      profileImageUrl: undefined
    },
    {
      id: 'student',
      email: 'student@lms.local',
      firstName: 'Jane',
      lastName: 'Student',
      role: 'student' as const,
      profileImageUrl: undefined
    },
    {
      id: 'teacher2',
      email: 'teacher2@lms.local',
      firstName: 'Sarah',
      lastName: 'Wilson',
      role: 'teacher' as const,
      profileImageUrl: undefined
    },
    {
      id: 'student2',
      email: 'student2@lms.local',
      firstName: 'Mike',
      lastName: 'Johnson',
      role: 'student' as const,
      profileImageUrl: undefined
    },
    {
      id: 'student3',
      email: 'student3@lms.local',
      firstName: 'Emily',
      lastName: 'Davis',
      role: 'student' as const,
      profileImageUrl: undefined
    }
  ];
  
  for (const userData of defaultUsers) {
    try {
      const existingUser = await User.findByPk(userData.id);
      if (!existingUser) {
        await User.create(userData);
        console.log(`   ✅ Created user: ${userData.id} (${userData.role})`);
      } else {
        console.log(`   ⚠️  User "${userData.id}" already exists, skipping...`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to create user "${userData.id}":`, error);
    }
  }
}

export async function seedSampleCourses() {
  console.log('Seeding sample courses...');
  
  const sampleCourses = [
    {
      title: 'Introduction to Computer Science',
      description: 'Learn the fundamentals of programming, algorithms, and data structures. This course covers basic programming concepts using Python and introduces computational thinking. Students will build projects including a calculator, text analyzer, and simple game.',
      courseCode: 'CS 101',
      semester: 'Fall',
      year: 2025,
      teacherId: 'teacher',
      credits: 3,
      maxEnrollment: 30,
      isActive: true
    },
    {
      title: 'Calculus I',
      description: 'Differential and integral calculus with applications. Topics include limits, derivatives, integrals, and the fundamental theorem of calculus. Emphasis on problem-solving techniques and real-world applications in science and engineering.',
      courseCode: 'MATH 201',
      semester: 'Fall',
      year: 2025,
      teacherId: 'teacher2',
      credits: 4,
      maxEnrollment: 25,
      isActive: true
    },
    {
      title: 'Introduction to Psychology',
      description: 'Overview of psychological principles, research methods, and applications in understanding human behavior and mental processes. Course includes laboratory experiments and case study analysis.',
      courseCode: 'PSYC 101',
      semester: 'Fall',
      year: 2025,
      teacherId: 'teacher',
      credits: 3,
      maxEnrollment: 40,
      isActive: true
    },
    {
      title: 'Data Structures and Algorithms',
      description: 'Advanced programming concepts including linked lists, trees, graphs, sorting algorithms, and complexity analysis. Prerequisites: CS 101 or equivalent programming experience.',
      courseCode: 'CS 201',
      semester: 'Spring',
      year: 2025,
      teacherId: 'teacher',
      credits: 4,
      maxEnrollment: 25,
      isActive: true
    },
    {
      title: 'Statistics for Data Science',
      description: 'Applied statistics with focus on data analysis, probability distributions, hypothesis testing, and regression analysis. Hands-on experience with R and Python statistical libraries.',
      courseCode: 'STAT 301',
      semester: 'Spring',
      year: 2025,
      teacherId: 'teacher2',
      credits: 3,
      maxEnrollment: 35,
      isActive: true
    }
  ];
  
  const createdCourses = [];
  for (const courseData of sampleCourses) {
    try {
      const existingCourse = await Course.findOne({ where: { courseCode: courseData.courseCode } });
      if (!existingCourse) {
        const course = await Course.create(courseData);
        createdCourses.push(course);
        console.log(`   ✅ Created course: ${courseData.courseCode} - ${courseData.title}`);
      } else {
        createdCourses.push(existingCourse);
        console.log(`   ⚠️  Course "${courseData.courseCode}" already exists, skipping...`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to create course "${courseData.courseCode}":`, error);
    }
  }
  
  return createdCourses;
}

export async function seedSampleEnrollments(courses: any[]) {
  console.log('Seeding sample enrollments...');
  
  const enrollments = [
    // Students enrolled in multiple courses for comprehensive analytics
    { studentId: 'student', courseId: courses[0]?.id }, // CS 101
    { studentId: 'student', courseId: courses[1]?.id }, // MATH 201
    { studentId: 'student', courseId: courses[2]?.id }, // PSYC 101
    { studentId: 'student', courseId: courses[3]?.id }, // CS 201
    
    { studentId: 'student2', courseId: courses[0]?.id }, // CS 101
    { studentId: 'student2', courseId: courses[1]?.id }, // MATH 201
    { studentId: 'student2', courseId: courses[4]?.id }, // STAT 301
    
    { studentId: 'student3', courseId: courses[0]?.id }, // CS 101
    { studentId: 'student3', courseId: courses[2]?.id }, // PSYC 101
    { studentId: 'student3', courseId: courses[3]?.id }, // CS 201
    { studentId: 'student3', courseId: courses[4]?.id }, // STAT 301
  ];
  
  for (const enrollment of enrollments) {
    if (enrollment.courseId) {
      try {
        const existing = await Enrollment.findOne({
          where: { studentId: enrollment.studentId, courseId: enrollment.courseId }
        });
        if (!existing) {
          await Enrollment.create(enrollment);
          console.log(`   ✅ Enrolled ${enrollment.studentId} in course ${enrollment.courseId}`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to enroll student:`, error);
      }
    }
  }
}

export async function seedSampleAssignments(courses: any[]) {
  console.log('Seeding sample assignments...');
  
  const assignments = [
    // CS 101 assignments - Introduction to Computer Science
    {
      title: 'Python Basics Programming',
      description: 'Write a Python program that demonstrates variables, loops, and functions. Include comments explaining your code. Create a simple calculator that can perform basic arithmetic operations.',
      courseId: courses[0]?.id,
      dueDate: new Date('2025-02-15'),
      totalPoints: 100,
      type: 'programming',
      maxPoints: 100,
      isActive: true
    },
    {
      title: 'Algorithm Analysis Report',
      description: 'Research and write a report on different sorting algorithms, comparing their time and space complexity. Include code examples and performance analysis.',
      courseId: courses[0]?.id,
      dueDate: new Date('2025-03-01'),
      totalPoints: 150,
      type: 'report',
      maxPoints: 150,
      isActive: true
    },
    {
      title: 'Text Processing Application',
      description: 'Build a text analyzer that counts words, characters, and sentences. Implement basic text statistics and file I/O operations.',
      courseId: courses[0]?.id,
      dueDate: new Date('2025-03-20'),
      totalPoints: 120,
      type: 'programming',
      maxPoints: 120,
      isActive: true
    },
    
    // MATH 201 assignments - Calculus I
    {
      title: 'Calculus Problem Set 1',
      description: 'Solve problems involving limits, derivatives, and basic integration techniques. Show all work and explain your reasoning.',
      courseId: courses[1]?.id,
      dueDate: new Date('2025-02-20'),
      totalPoints: 80,
      type: 'homework',
      maxPoints: 80,
      isActive: true
    },
    {
      title: 'Applications of Derivatives',
      description: 'Real-world problems involving optimization, related rates, and curve sketching. Include graphical representations where applicable.',
      courseId: courses[1]?.id,
      dueDate: new Date('2025-03-10'),
      totalPoints: 120,
      type: 'homework',
      maxPoints: 120,
      isActive: true
    },
    {
      title: 'Integration Techniques Exam',
      description: 'Comprehensive exam covering substitution, integration by parts, and partial fractions. Practice problems available on course website.',
      courseId: courses[1]?.id,
      dueDate: new Date('2025-03-25'),
      totalPoints: 200,
      type: 'exam',
      maxPoints: 200,
      isActive: true
    },
    
    // PSYC 101 assignments - Introduction to Psychology
    {
      title: 'Research Methods Essay',
      description: 'Write an essay discussing different research methods in psychology and their applications. Include examples from recent studies.',
      courseId: courses[2]?.id,
      dueDate: new Date('2025-02-25'),
      totalPoints: 100,
      type: 'essay',
      maxPoints: 100,
      isActive: true
    },
    {
      title: 'Case Study Analysis',
      description: 'Analyze a psychological case study using concepts learned in class. Apply theoretical frameworks to real-world scenarios.',
      courseId: courses[2]?.id,
      dueDate: new Date('2025-03-15'),
      totalPoints: 130,
      type: 'case_study',
      maxPoints: 130,
      isActive: true
    },
    {
      title: 'Behavioral Observation Lab',
      description: 'Conduct a behavioral observation study following ethical guidelines. Record observations and analyze patterns.',
      courseId: courses[2]?.id,
      dueDate: new Date('2025-04-01'),
      totalPoints: 110,
      type: 'lab',
      maxPoints: 110,
      isActive: true
    },
    
    // CS 201 assignments - Data Structures and Algorithms
    {
      title: 'Linked List Implementation',
      description: 'Implement a doubly linked list with insert, delete, and search operations. Include comprehensive test cases.',
      courseId: courses[3]?.id,
      dueDate: new Date('2025-04-10'),
      totalPoints: 140,
      type: 'programming',
      maxPoints: 140,
      isActive: true
    },
    {
      title: 'Binary Search Tree Project',
      description: 'Create a binary search tree with balance checking and tree traversal algorithms. Compare performance with other data structures.',
      courseId: courses[3]?.id,
      dueDate: new Date('2025-04-25'),
      totalPoints: 180,
      type: 'project',
      maxPoints: 180,
      isActive: true
    },
    
    // STAT 301 assignments - Statistics for Data Science
    {
      title: 'Descriptive Statistics Analysis',
      description: 'Analyze a dataset using measures of central tendency, dispersion, and correlation. Use R or Python for calculations.',
      courseId: courses[4]?.id,
      dueDate: new Date('2025-04-15'),
      totalPoints: 90,
      type: 'analysis',
      maxPoints: 90,
      isActive: true
    },
    {
      title: 'Hypothesis Testing Project',
      description: 'Design and conduct hypothesis tests on real-world data. Include statistical interpretation and visualization.',
      courseId: courses[4]?.id,
      dueDate: new Date('2025-05-01'),
      totalPoints: 160,
      type: 'project',
      maxPoints: 160,
      isActive: true
    }
  ];
  
  const createdAssignments = [];
  for (const assignmentData of assignments) {
    if (assignmentData.courseId) {
      try {
        const assignment = await Assignment.create(assignmentData);
        createdAssignments.push(assignment);
        console.log(`   ✅ Created assignment: ${assignmentData.title}`);
      } catch (error) {
        console.error(`   ❌ Failed to create assignment "${assignmentData.title}":`, error);
      }
    }
  }
  
  return createdAssignments;
}

export async function seedSampleSubmissions(assignments: any[]) {
  console.log('Seeding sample submissions...');
  
  const submissions = [
    // CS 101 submissions - Python Basics Programming
    {
      assignmentId: assignments[0]?.id, // Python Basics Programming
      studentId: 'student',
      submissionText: 'I have created a Python calculator that performs basic arithmetic operations. The program uses functions for add, subtract, multiply, and divide operations. I implemented input validation to handle division by zero and invalid input types. The code includes comprehensive comments explaining each function and variable usage.',
      submittedAt: new Date('2025-02-14'),
      grade: 92,
      feedback: 'Excellent work! Good code structure and comprehensive error handling. Consider adding more advanced operations.',
      status: 'graded'
    },
    {
      assignmentId: assignments[0]?.id, // Python Basics Programming
      studentId: 'student2',
      submissionText: 'Created a basic calculator in Python with addition, subtraction, multiplication, and division functions. Added input validation for numeric inputs and division by zero checking. The program uses a simple menu system for user interaction.',
      submittedAt: new Date('2025-02-13'),
      grade: 88,
      feedback: 'Good implementation. Code is clean and functional. Add more detailed comments for better documentation.',
      status: 'graded'
    },
    {
      assignmentId: assignments[0]?.id, // Python Basics Programming
      studentId: 'student3',
      submissionText: 'My Python calculator includes basic arithmetic operations with error handling. I used try-except blocks to handle invalid inputs and created separate functions for each operation. The main function provides a user-friendly interface.',
      submittedAt: new Date('2025-02-15'),
      grade: 85,
      feedback: 'Well-structured code with good error handling. Consider adding more mathematical functions.',
      status: 'graded'
    },
    
    // Algorithm Analysis Report submissions
    {
      assignmentId: assignments[1]?.id, // Algorithm Analysis Report
      studentId: 'student',
      submissionText: 'This report analyzes bubble sort, merge sort, and quicksort algorithms. Bubble sort has O(n²) time complexity making it inefficient for large datasets. Merge sort uses divide-and-conquer with O(n log n) complexity. Quicksort averages O(n log n) but can degrade to O(n²) in worst case. Performance benchmarks show merge sort is most consistent across different input sizes.',
      submittedAt: new Date('2025-02-28'),
      grade: 94,
      feedback: 'Outstanding analysis with detailed complexity comparison. Excellent use of benchmarking data.',
      status: 'graded'
    },
    {
      assignmentId: assignments[1]?.id, // Algorithm Analysis Report
      studentId: 'student2',
      submissionText: 'Analysis of sorting algorithms including bubble sort, merge sort, and quicksort. Bubble sort is O(n²) and inefficient. Merge sort is O(n log n) with divide-and-conquer approach. Quicksort is O(n log n) average case but O(n²) worst case. Testing shows merge sort performs consistently.',
      submittedAt: new Date('2025-03-01'),
      grade: 78,
      feedback: 'Good basic analysis but lacks depth in performance comparison. Add more detailed benchmarking.',
      status: 'graded'
    },
    
    // MATH 201 submissions
    {
      assignmentId: assignments[3]?.id, // Calculus Problem Set 1
      studentId: 'student',
      submissionText: 'Solved limit problems using L\'Hôpital\'s rule and algebraic manipulation. For derivatives, applied power rule, product rule, and chain rule. Integration problems solved using substitution and integration by parts. All work shown with step-by-step solutions.',
      submittedAt: new Date('2025-02-19'),
      grade: 76,
      feedback: 'Good understanding of calculus concepts. Minor errors in integration by parts problems.',
      status: 'graded'
    },
    {
      assignmentId: assignments[3]?.id, // Calculus Problem Set 1
      studentId: 'student2',
      submissionText: 'Completed all limit, derivative, and integration problems. Used appropriate techniques for each problem type. Showed detailed work for complex problems involving chain rule and substitution method.',
      submittedAt: new Date('2025-02-20'),
      grade: 82,
      feedback: 'Strong work on derivative problems. Review integration techniques for better accuracy.',
      status: 'graded'
    },
    {
      assignmentId: assignments[3]?.id, // Calculus Problem Set 1
      studentId: 'student3',
      submissionText: 'Solved calculus problems systematically. Applied limit theorems correctly. Used differentiation rules appropriately. Integration solutions include proper constant of integration and verification.',
      submittedAt: new Date('2025-02-18'),
      grade: 89,
      feedback: 'Excellent systematic approach. Very thorough solutions with proper verification.',
      status: 'graded'
    },
    
    // Applications of Derivatives submissions
    {
      assignmentId: assignments[4]?.id, // Applications of Derivatives
      studentId: 'student',
      submissionText: 'Solved optimization problems using first and second derivative tests. Applied related rates to real-world scenarios including balloon inflation and ladder problems. Created accurate graphs showing critical points and inflection points.',
      submittedAt: new Date('2025-03-09'),
      grade: 91,
      feedback: 'Excellent application of derivative concepts. Clear graphical representations.',
      status: 'graded'
    },
    {
      assignmentId: assignments[4]?.id, // Applications of Derivatives
      studentId: 'student2',
      submissionText: 'Completed optimization and related rate problems. Used derivative tests to find maximum and minimum values. Graphed functions showing increasing/decreasing intervals and concavity.',
      submittedAt: new Date('2025-03-10'),
      grade: 84,
      feedback: 'Good work on optimization. Review related rates for more complex scenarios.',
      status: 'graded'
    },
    
    // PSYC 101 submissions
    {
      assignmentId: assignments[6]?.id, // Research Methods Essay
      studentId: 'student',
      submissionText: 'This essay examines experimental, correlational, and observational research methods in psychology. Experimental methods allow for causal inference through controlled manipulation of variables. Correlational studies identify relationships but cannot establish causation. Observational methods provide naturalistic data but lack control. Each method has strengths and limitations depending on research questions.',
      submittedAt: new Date('2025-02-24'),
      grade: 87,
      feedback: 'Comprehensive analysis of research methods. Good use of examples from recent studies.',
      status: 'graded'
    },
    {
      assignmentId: assignments[6]?.id, // Research Methods Essay
      studentId: 'student3',
      submissionText: 'Research methods in psychology include experimental, correlational, and case study approaches. Experimental methods provide controlled conditions for testing hypotheses. Correlational research examines relationships between variables. Case studies offer in-depth analysis of individual subjects. Each method contributes unique insights to psychological understanding.',
      submittedAt: new Date('2025-02-25'),
      grade: 79,
      feedback: 'Good coverage of research methods. Strengthen arguments with more specific examples.',
      status: 'graded'
    },
    
    // Case Study Analysis submissions
    {
      assignmentId: assignments[7]?.id, // Case Study Analysis
      studentId: 'student',
      submissionText: 'Analysis of patient with dissociative identity disorder using cognitive-behavioral and psychodynamic frameworks. Symptoms include memory gaps, identity confusion, and behavioral changes. CBT approach focuses on coping strategies and symptom management. Psychodynamic perspective examines unconscious conflicts and early trauma. Integrated treatment approach recommended.',
      submittedAt: new Date('2025-03-14'),
      grade: 93,
      feedback: 'Excellent integration of theoretical frameworks. Thorough analysis with practical applications.',
      status: 'graded'
    },
    {
      assignmentId: assignments[7]?.id, // Case Study Analysis
      studentId: 'student3',
      submissionText: 'Case study analysis applying learning theories to behavioral modification. Subject shows maladaptive behaviors that can be addressed through operant conditioning principles. Reinforcement schedules and behavior shaping techniques provide framework for intervention. Treatment plan includes baseline measurement and progress monitoring.',
      submittedAt: new Date('2025-03-15'),
      grade: 86,
      feedback: 'Good application of learning theories. Consider additional therapeutic approaches.',
      status: 'graded'
    },
    
    // CS 201 submissions
    {
      assignmentId: assignments[9]?.id, // Linked List Implementation
      studentId: 'student',
      submissionText: 'Implemented doubly linked list with insert, delete, and search operations. Each node contains data and pointers to previous and next nodes. Insert operation handles head, tail, and middle insertions. Delete operation updates pointers correctly. Search function traverses list efficiently. Included comprehensive test cases.',
      submittedAt: new Date('2025-04-09'),
      grade: 95,
      feedback: 'Outstanding implementation with excellent test coverage. Code is clean and well-documented.',
      status: 'graded'
    },
    {
      assignmentId: assignments[9]?.id, // Linked List Implementation
      studentId: 'student3',
      submissionText: 'Created doubly linked list data structure with full CRUD operations. Implemented proper memory management and pointer handling. Added error checking for edge cases like empty list operations. Test suite covers all major functionality.',
      submittedAt: new Date('2025-04-10'),
      grade: 88,
      feedback: 'Good implementation with solid error handling. Consider optimizing search operation.',
      status: 'graded'
    },
    
    // STAT 301 submissions
    {
      assignmentId: assignments[11]?.id, // Descriptive Statistics Analysis
      studentId: 'student2',
      submissionText: 'Analyzed housing price dataset using Python pandas. Calculated mean, median, mode, and standard deviation. Created histograms and box plots for distribution analysis. Computed correlation coefficients between variables. Found strong positive correlation between square footage and price (r=0.78).',
      submittedAt: new Date('2025-04-14'),
      grade: 91,
      feedback: 'Excellent statistical analysis with clear visualizations. Good interpretation of results.',
      status: 'graded'
    },
    {
      assignmentId: assignments[11]?.id, // Descriptive Statistics Analysis
      studentId: 'student3',
      submissionText: 'Statistical analysis of student performance data using R. Computed descriptive statistics including measures of central tendency and variability. Created scatter plots and correlation matrix. Identified outliers using box plot analysis. Results show normal distribution with few extreme values.',
      submittedAt: new Date('2025-04-15'),
      grade: 85,
      feedback: 'Solid statistical work. Expand on outlier analysis and interpretation.',
      status: 'graded'
    }
  ];
  
  for (const submissionData of submissions) {
    if (submissionData.assignmentId) {
      try {
        await Submission.create(submissionData);
        console.log(`   ✅ Created submission for assignment ${submissionData.assignmentId}`);
      } catch (error) {
        console.error(`   ❌ Failed to create submission:`, error);
      }
    }
  }
}

export async function seedSampleAnnouncements(courses: any[]) {
  console.log('Seeding sample announcements...');
  
  const announcements = [
    // CS 101 announcements
    {
      title: 'Welcome to CS 101!',
      content: 'Welcome to Introduction to Computer Science! This course will cover fundamental programming concepts, algorithms, and data structures. Please review the syllabus and ensure you have Python 3.8+ installed on your computer. Office hours are Monday and Wednesday 2-4 PM.',
      courseId: courses[0]?.id,
      authorId: 'teacher',
      isImportant: true
    },
    {
      title: 'Python Development Environment Setup',
      content: 'Please install Python 3.8 or higher and VS Code editor before our next class. Installation guides are available on the course website. If you encounter any issues, please attend office hours or contact the TA.',
      courseId: courses[0]?.id,
      authorId: 'teacher',
      isImportant: false
    },
    {
      title: 'Midterm Project Guidelines',
      content: 'The midterm project involves creating a text processing application. Requirements include file I/O, string manipulation, and basic data analysis. Project proposals are due next Friday. Start thinking about your topic!',
      courseId: courses[0]?.id,
      authorId: 'teacher',
      isImportant: true
    },
    
    // MATH 201 announcements
    {
      title: 'Calculus Study Group',
      content: 'Join our weekly calculus study group every Thursday at 6 PM in the math building. We\'ll work through practice problems and review challenging concepts. Bring your questions and textbook!',
      courseId: courses[1]?.id,
      authorId: 'teacher2',
      isImportant: false
    },
    {
      title: 'Integration Exam Next Week',
      content: 'The integration techniques exam is scheduled for next Thursday. The exam covers substitution, integration by parts, and partial fractions. Review chapters 7-8 and complete all practice problems. Office hours extended this week.',
      courseId: courses[1]?.id,
      authorId: 'teacher2',
      isImportant: true
    },
    {
      title: 'Graphing Calculator Policy',
      content: 'Reminder: Only TI-83, TI-84, and Casio fx-9750G calculators are permitted during exams. No programming or WiFi-enabled calculators allowed. If you need to borrow a calculator, please contact me before the exam.',
      courseId: courses[1]?.id,
      authorId: 'teacher2',
      isImportant: true
    },
    
    // PSYC 101 announcements
    {
      title: 'Research Participation Opportunity',
      content: 'The psychology department is conducting a study on memory and learning. Students can earn 2 extra credit points by participating. Sessions are 1 hour long and available weekdays. Sign up at the research lab.',
      courseId: courses[2]?.id,
      authorId: 'teacher',
      isImportant: false
    },
    {
      title: 'Guest Lecture: Dr. Sarah Chen',
      content: 'We\'re excited to welcome Dr. Sarah Chen from Stanford University for a guest lecture on "Cognitive Behavioral Therapy in Modern Practice." The lecture is this Friday at 2 PM in the auditorium. Attendance is optional but highly recommended.',
      courseId: courses[2]?.id,
      authorId: 'teacher',
      isImportant: false
    },
    {
      title: 'Case Study Assignment Instructions',
      content: 'Detailed instructions for the case study assignment are now available. Choose from 3 provided cases and apply appropriate theoretical frameworks. Papers should be 5-7 pages, APA format. Due date is March 15th.',
      courseId: courses[2]?.id,
      authorId: 'teacher',
      isImportant: true
    },
    
    // CS 201 announcements
    {
      title: 'Advanced Programming Concepts',
      content: 'This course builds on CS 101 with advanced data structures and algorithms. We\'ll cover linked lists, trees, graphs, and complexity analysis. Prerequisites include solid understanding of object-oriented programming.',
      courseId: courses[3]?.id,
      authorId: 'teacher',
      isImportant: true
    },
    {
      title: 'Group Project Formation',
      content: 'It\'s time to form groups for the final project. Teams of 3-4 students will implement a complete data structure library. Project proposals due April 1st. Use the discussion board to find teammates.',
      courseId: courses[3]?.id,
      authorId: 'teacher',
      isImportant: false
    },
    
    // STAT 301 announcements
    {
      title: 'Statistical Software Installation',
      content: 'Please install R and RStudio before next class. We\'ll also use Python with pandas and scipy libraries. Installation guides and campus software licenses are available on the course website.',
      courseId: courses[4]?.id,
      authorId: 'teacher2',
      isImportant: true
    },
    {
      title: 'Real-World Data Analysis Project',
      content: 'Your final project involves analyzing a real-world dataset of your choice. Project topics could include sports statistics, financial data, or social media analysis. Project proposals due April 15th.',
      courseId: courses[4]?.id,
      authorId: 'teacher2',
      isImportant: false
    }
  ];
  
  for (const announcementData of announcements) {
    if (announcementData.courseId) {
      try {
        await Announcement.create(announcementData);
        console.log(`   ✅ Created announcement: ${announcementData.title}`);
      } catch (error) {
        console.error(`   ❌ Failed to create announcement:`, error);
      }
    }
  }
}

export async function seedSampleMessages(courses: any[]) {
  console.log('Seeding sample messages...');
  
  const messages = [
    // Student-Teacher conversations
    {
      senderId: 'student',
      receiverId: 'teacher',
      courseId: courses[0]?.id,
      subject: 'Question about Assignment 1',
      content: 'Hi Professor, I\'m having trouble with the calculator assignment. The division by zero handling isn\'t working as expected. Could you provide some guidance?',
      isRead: true
    },
    {
      senderId: 'teacher',
      receiverId: 'student',
      courseId: courses[0]?.id,
      subject: 'Re: Question about Assignment 1',
      content: 'Hi Jane, for division by zero, use a try-except block to catch ZeroDivisionError. Return an error message instead of crashing. Check the example in lecture notes. Let me know if you need more help!',
      isRead: false
    },
    {
      senderId: 'student2',
      receiverId: 'teacher2',
      courseId: courses[1]?.id,
      subject: 'Office Hours Question',
      content: 'Hello, I won\'t be able to attend office hours today. Could we schedule a brief meeting to discuss the integration problems? I\'m particularly confused about partial fractions.',
      isRead: true
    },
    {
      senderId: 'teacher2',
      receiverId: 'student2',
      courseId: courses[1]?.id,
      subject: 'Re: Office Hours Question',
      content: 'Sure Mike, I\'m available tomorrow at 3 PM or Friday at 1 PM. For partial fractions, remember to factor the denominator completely first. We can work through examples when we meet.',
      isRead: false
    },
    {
      senderId: 'student3',
      receiverId: 'teacher',
      courseId: courses[2]?.id,
      subject: 'Research Paper Topic',
      content: 'I\'m interested in writing about the effectiveness of cognitive behavioral therapy for anxiety disorders. Is this topic appropriate for our research paper assignment?',
      isRead: true
    },
    {
      senderId: 'teacher',
      receiverId: 'student3',
      courseId: courses[2]?.id,
      subject: 'Re: Research Paper Topic',
      content: 'That\'s an excellent topic, Emily! Make sure to include recent studies and discuss both benefits and limitations. Focus on specific anxiety disorders for more depth. Good choice!',
      isRead: false
    }
  ];
  
  for (const messageData of messages) {
    if (messageData.courseId) {
      try {
        await Message.create(messageData);
        console.log(`   ✅ Created message: ${messageData.subject}`);
      } catch (error) {
        console.error(`   ❌ Failed to create message:`, error);
      }
    }
  }
}

export async function seedAllData() {
  console.log('🌱 Starting comprehensive data seeding...');
  
  try {
    // Check if we should seed data
    const shouldSeed = await shouldSeedData();
    if (!shouldSeed) {
      console.log('⚠️  Skipping data seeding based on environment settings');
      return;
    }
    
    // If DB_INIT is true, force seeding even if data exists
    if (process.env.DB_INIT === 'true') {
      console.log('🚀 DB_INIT=true - Force seeding comprehensive analytics data...');
    } else {
      // Check if data already exists
      const dataExists = await checkIfDataExists();
      if (dataExists) {
        console.log('⚠️  Data already exists, skipping seeding');
        return;
      }
    }
    
    // Seed all data in order
    await seedDefaultUsers();
    const courses = await seedSampleCourses();
    await seedSampleEnrollments(courses);
    const assignments = await seedSampleAssignments(courses);
    await seedSampleSubmissions(assignments);
    await seedSampleAnnouncements(courses);
    await seedSampleMessages(courses);
    
    console.log('✅ Comprehensive data seeding completed successfully!');
    console.log('📊 Analytics data ready for demonstration:');
    console.log('   - 5 courses with varied enrollment');
    console.log('   - 13 assignments with realistic due dates');
    console.log('   - 25+ submissions with graded analytics');
    console.log('   - 13 announcements across all courses');
    console.log('   - 6 message conversations');
    console.log('   - Comprehensive analytics for dashboard');
    
  } catch (error) {
    console.error('❌ Error during data seeding:', error);
  }
}

// End of comprehensive seeding functions - All analytics data ready for demonstration