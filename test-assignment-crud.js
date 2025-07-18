// Use built-in fetch (Node 18+) or import fetch for testing

const BASE_URL = 'http://localhost:5000';

// Test authentication first
async function testAuth() {
  console.log('🔐 Testing authentication...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/local/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'teacher',
        password: 'teacher123'
      })
    });
    
    const authResult = await response.text();
    console.log('Auth response:', authResult);
    
    if (response.headers.get('set-cookie')) {
      console.log('✅ Authentication successful - got cookies');
      return response.headers.get('set-cookie');
    } else {
      console.log('❌ Authentication failed - no cookies');
      return null;
    }
  } catch (error) {
    console.error('❌ Auth error:', error);
    return null;
  }
}

// Test assignment CRUD operations
async function testAssignmentCRUD() {
  console.log('\n🧪 Testing Assignment CRUD Operations...\n');
  
  // Get auth cookies
  const cookies = await testAuth();
  if (!cookies) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': cookies
  };
  
  console.log('\n📋 Test 1: Get assignments for course 1');
  try {
    const response = await fetch(`${BASE_URL}/api/assignments/1`, { headers });
    const assignments = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(assignments, null, 2));
    
    if (response.status === 200 && Array.isArray(assignments)) {
      console.log('✅ Successfully retrieved assignments');
      console.log(`📊 Found ${assignments.length} assignments`);
    } else {
      console.log('❌ Failed to retrieve assignments');
    }
  } catch (error) {
    console.error('❌ Error getting assignments:', error);
  }
  
  console.log('\n📝 Test 2: Create new assignment');
  const newAssignment = {
    courseId: 1,
    title: 'Test Assignment - CRUD Validation',
    description: 'This assignment is created by the CRUD test suite to validate functionality',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    maxPoints: 100,
    assignmentType: 'homework',
    isActive: true
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/assignments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(newAssignment)
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.status === 201 && result.success) {
      console.log('✅ Successfully created assignment');
      console.log('📋 Assignment ID:', result.data.id);
      return result.data.id; // Return for further tests
    } else {
      console.log('❌ Failed to create assignment');
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating assignment:', error);
    return null;
  }
}

// Test validation scenarios
async function testValidationScenarios() {
  console.log('\n🔍 Testing Validation Scenarios...\n');
  
  const cookies = await testAuth();
  if (!cookies) return;
  
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': cookies
  };
  
  console.log('📝 Test: Invalid due date (past date)');
  const invalidAssignment = {
    courseId: 1,
    title: 'Invalid Assignment',
    description: 'This should fail validation',
    dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    maxPoints: 100,
    assignmentType: 'homework',
    isActive: true
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/assignments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(invalidAssignment)
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.status === 400) {
      console.log('✅ Validation correctly rejected past due date');
    } else {
      console.log('❌ Validation should have rejected past due date');
    }
  } catch (error) {
    console.error('❌ Error in validation test:', error);
  }
  
  console.log('\n📝 Test: Invalid max points (too high)');
  const invalidPoints = {
    courseId: 1,
    title: 'Invalid Points Assignment',
    description: 'This should fail max points validation',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    maxPoints: 2000, // Over the 1000 limit
    assignmentType: 'homework',
    isActive: true
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/assignments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(invalidPoints)
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.status === 400) {
      console.log('✅ Validation correctly rejected excessive max points');
    } else {
      console.log('❌ Validation should have rejected excessive max points');
    }
  } catch (error) {
    console.error('❌ Error in points validation test:', error);
  }
}

// Test permission scenarios
async function testPermissionScenarios() {
  console.log('\n🔒 Testing Permission Scenarios...\n');
  
  console.log('👨‍🎓 Test: Student trying to access course assignments');
  
  // Login as student
  try {
    const response = await fetch(`${BASE_URL}/api/local/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'student', password: 'student123' })
    });
    
    const studentCookies = response.headers.get('set-cookie');
    
    if (studentCookies) {
      console.log('✅ Student logged in successfully');
      
      // Try to access assignments for course 1 (should work if enrolled)
      const assignmentResponse = await fetch(`${BASE_URL}/api/assignments/1`, {
        headers: { 'Cookie': studentCookies }
      });
      
      const assignments = await assignmentResponse.json();
      console.log('Student access status:', assignmentResponse.status);
      console.log('Student access response:', JSON.stringify(assignments, null, 2));
      
      if (assignmentResponse.status === 200) {
        console.log('✅ Student can read assignments from enrolled course');
      } else if (assignmentResponse.status === 403) {
        console.log('✅ Student correctly denied access to non-enrolled course');
      }
      
      // Try to create assignment (should fail)
      const createResponse = await fetch(`${BASE_URL}/api/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': studentCookies
        },
        body: JSON.stringify({
          courseId: 1,
          title: 'Student Attempt',
          description: 'This should fail',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          maxPoints: 100,
          assignmentType: 'homework',
          isActive: true
        })
      });
      
      const createResult = await createResponse.json();
      console.log('Student create status:', createResponse.status);
      console.log('Student create response:', JSON.stringify(createResult, null, 2));
      
      if (createResponse.status === 403) {
        console.log('✅ Student correctly denied assignment creation');
      } else {
        console.log('❌ Student should be denied assignment creation');
      }
    }
  } catch (error) {
    console.error('❌ Error in student permission test:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Assignment CRUD Test Suite\n');
  console.log('=' .repeat(50));
  
  await testAssignmentCRUD();
  await testValidationScenarios();
  await testPermissionScenarios();
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Assignment CRUD Test Suite Complete');
}

// Execute tests
runAllTests().catch(console.error);