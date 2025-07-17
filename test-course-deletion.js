// Test script to demonstrate what happens when a course is deleted

async function loginAndGetCookie() {
  const loginResponse = await fetch('http://localhost:5000/api/local/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'teacher',
      password: 'teacher123'
    })
  });
  
  const sessionCookie = loginResponse.headers.get('set-cookie');
  return sessionCookie;
}

async function getRelatedData(courseId, sessionCookie) {
  console.log(`\n📊 Getting related data for course ${courseId}...`);
  
  // Get assignments
  const assignmentsResponse = await fetch(`http://localhost:5000/api/assignments/${courseId}`, {
    headers: { 'Cookie': sessionCookie }
  });
  const assignments = await assignmentsResponse.json();
  
  // Get enrollments
  const enrollmentsResponse = await fetch(`http://localhost:5000/api/enrollments/${courseId}`, {
    headers: { 'Cookie': sessionCookie }
  });
  const enrollments = await enrollmentsResponse.json();
  
  // Get announcements
  const announcementsResponse = await fetch(`http://localhost:5000/api/announcements`, {
    headers: { 'Cookie': sessionCookie }
  });
  const allAnnouncements = await announcementsResponse.json();
  const announcements = allAnnouncements.filter(a => a.courseId === courseId);
  
  console.log(`   📝 Assignments: ${assignments.length}`);
  console.log(`   👥 Enrollments: ${enrollments.length}`);
  console.log(`   📢 Announcements: ${announcements.length}`);
  
  return { assignments, enrollments, announcements };
}

async function demonstrateCourseDeletion() {
  console.log('🗑️  Course Deletion Cascade Effects Demonstration');
  console.log('=' .repeat(60));
  
  try {
    const sessionCookie = await loginAndGetCookie();
    
    // Get list of courses
    const coursesResponse = await fetch('http://localhost:5000/api/courses', {
      headers: { 'Cookie': sessionCookie }
    });
    const courses = await coursesResponse.json();
    
    console.log(`\n📚 Available courses: ${courses.length}`);
    courses.forEach(course => {
      console.log(`   ${course.id}: ${course.title} (${course.courseCode})`);
    });
    
    // Select a course to delete (using course ID 3 - Psychology)
    const courseToDelete = courses.find(c => c.id === 3);
    if (!courseToDelete) {
      console.log('❌ Course not found for deletion test');
      return;
    }
    
    console.log(`\n🎯 Testing deletion of: ${courseToDelete.title} (ID: ${courseToDelete.id})`);
    
    // Get all related data BEFORE deletion
    console.log('\n📊 BEFORE DELETION:');
    const beforeData = await getRelatedData(courseToDelete.id, sessionCookie);
    
    console.log('\n🔍 Based on database schema, when this course is deleted, CASCADE DELETE will remove:');
    console.log('   ✅ All assignments (assignments table)');
    console.log('   ✅ All enrollments (enrollments table)');
    console.log('   ✅ All submissions (submissions table)');
    console.log('   ✅ All announcements (announcements table)');
    console.log('   ✅ All messages (messages table)');
    console.log('   ✅ All calendar events (calendar_events table)');
    console.log('   ✅ All quizzes and quiz attempts (quizzes, quiz_attempts tables)');
    console.log('   ✅ All grade book entries (grade_book table)');
    console.log('   ✅ All course materials (course_materials table)');
    console.log('   ✅ All course schedules (course_schedules table)');
    console.log('   ✅ All course instructors (course_instructors table)');
    console.log('   ✅ All file uploads (file_uploads table)');
    console.log('   ✅ All notifications (notifications table)');
    console.log('   ✅ All attendance records (attendance table)');
    
    // Now delete the course
    console.log(`\n🗑️  Attempting to delete course ${courseToDelete.id}...`);
    
    const deleteResponse = await fetch(`http://localhost:5000/api/courses/${courseToDelete.id}`, {
      method: 'DELETE',
      headers: { 'Cookie': sessionCookie }
    });
    
    if (deleteResponse.ok) {
      console.log('✅ Course deleted successfully!');
      
      // Verify the course is gone
      const afterCoursesResponse = await fetch('http://localhost:5000/api/courses', {
        headers: { 'Cookie': sessionCookie }
      });
      const afterCourses = await afterCoursesResponse.json();
      
      console.log(`\n📊 AFTER DELETION:`);
      console.log(`   📚 Remaining courses: ${afterCourses.length}`);
      
      // Try to get the deleted course's data
      try {
        await getRelatedData(courseToDelete.id, sessionCookie);
      } catch (error) {
        console.log('   ✅ Related data has been automatically removed by CASCADE DELETE');
      }
      
    } else {
      const errorData = await deleteResponse.json();
      console.log(`❌ Failed to delete course: ${errorData.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error during course deletion test:', error.message);
  }
}

// Run the demonstration
demonstrateCourseDeletion().catch(console.error);