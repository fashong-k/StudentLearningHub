// Test script to demonstrate comprehensive course update validation scenarios

const scenarios = [
  {
    name: "Date Range Update",
    description: "Test validation when updating course start/end dates",
    courseId: 1,
    data: {
      semester: "Summer",
      startDate: "2025-08-15",
      endDate: "2025-12-15"
    }
  },
  {
    name: "Semester Change",
    description: "Test validation when changing semester",
    courseId: 1,
    data: {
      semester: "Winter",
      year: 2025
    }
  },
  {
    name: "Course Status Change",
    description: "Test validation when changing course visibility",
    courseId: 1,
    data: {
      visibility: "institution",
      isActive: true
    }
  },
  {
    name: "Complex Update",
    description: "Test validation with multiple simultaneous changes",
    courseId: 1,
    data: {
      semester: "Fall",
      year: 2025,
      visibility: "private",
      gradingScheme: "percentage"
    }
  }
];

async function testValidationScenario(scenario) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📝 ${scenario.description}`);
  console.log(`📊 Data: ${JSON.stringify(scenario.data, null, 2)}`);
  
  try {
    // Login first
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
    
    const loginData = await loginResponse.json();
    console.log(`✅ Login: ${loginData.message}`);
    
    // Get session cookie
    const sessionCookie = loginResponse.headers.get('set-cookie');
    
    // Test validation
    const validationResponse = await fetch(`http://localhost:5000/api/courses/${scenario.courseId}/validate-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(scenario.data)
    });
    
    const validationResult = await validationResponse.json();
    console.log(`📊 Validation Result:`);
    console.log(`   ✅ Can Update: ${validationResult.validation.canUpdate}`);
    console.log(`   ⚠️  Warnings: ${validationResult.validation.warnings.length}`);
    console.log(`   ❌ Errors: ${validationResult.validation.errors.length}`);
    
    if (validationResult.validation.warnings.length > 0) {
      console.log(`   📋 Warning Details:`);
      validationResult.validation.warnings.forEach((warning, index) => {
        console.log(`      ${index + 1}. ${warning}`);
      });
    }
    
    if (validationResult.validation.errors.length > 0) {
      console.log(`   🚨 Error Details:`);
      validationResult.validation.errors.forEach((error, index) => {
        console.log(`      ${index + 1}. ${error}`);
      });
    }
    
    console.log(`   📈 Affected Records:`);
    const affected = validationResult.validation.affectedRecords;
    console.log(`      - Enrollments: ${affected.enrollments}`);
    console.log(`      - Assignments: ${affected.assignments}`);
    console.log(`      - Announcements: ${affected.announcements}`);
    console.log(`      - Submissions: ${affected.submissions}`);
    
  } catch (error) {
    console.error(`❌ Error testing scenario: ${error.message}`);
  }
}

async function runAllScenarios() {
  console.log('🚀 Running Course Update Validation Test Suite');
  console.log('=' .repeat(60));
  
  for (const scenario of scenarios) {
    await testValidationScenario(scenario);
    console.log('-'.repeat(60));
  }
  
  console.log('✅ All validation scenarios completed!');
}

// Run the test suite
runAllScenarios().catch(console.error);