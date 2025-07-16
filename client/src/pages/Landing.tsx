import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, BookOpen, Users, Award } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mr-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">EduPortal</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A comprehensive Student-Teacher Learning Management System that enhances 
            the educational experience through streamlined communication, course management, 
            and resource accessibility.
          </p>
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            onClick={() => window.location.href = '/login'}
          >
            Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Course Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Create, manage, and organize courses with modules and assignments
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Facilitate direct communication between students and teachers
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Gradebook</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Automatically grade assignments and provide detailed feedback
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <GraduationCap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Track student engagement and performance with detailed insights
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Key Features
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">For Students</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• View enrolled courses and assignments</li>
                <li>• Submit assignments with file uploads</li>
                <li>• Track grades and academic progress</li>
                <li>• Participate in course discussions</li>
                <li>• Receive announcements and notifications</li>
                <li>• Access course materials and resources</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">For Teachers</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Create and manage courses</li>
                <li>• Design assignments with multiple formats</li>
                <li>• Grade submissions and provide feedback</li>
                <li>• Make announcements to students</li>
                <li>• Monitor student progress and engagement</li>
                <li>• Facilitate discussions and messaging</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Learning Experience?
          </h2>
          <p className="text-gray-600 mb-8">
            Join thousands of students and teachers who are already using EduPortal
          </p>
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            onClick={() => window.location.href = '/login'}
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
