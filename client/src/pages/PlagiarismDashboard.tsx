import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Search, FileText, BarChart3, Users, Clock, CheckCircle, X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { safeFormat } from '@/lib/dateUtils';

interface PlagiarismCheck {
  submissionId: number;
  similarityScore: number;
  studentId: string;
  studentName: string;
  courseName: string;
  assignmentTitle: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  checkedAt: Date;
  checkedBy: string;
  matchedSources: number;
  suspiciousPatterns: number;
}

interface CourseStats {
  courseId: number;
  courseName: string;
  totalSubmissions: number;
  checkedSubmissions: number;
  averageSimilarity: number;
  highRiskSubmissions: number;
}

export default function PlagiarismDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // Fetch user's courses
  const { data: courses = [] } = useQuery({
    queryKey: ['/api/courses'],
    enabled: !!user,
  });

  // Fetch plagiarism checks for all courses
  const { data: allChecks = [], isLoading } = useQuery({
    queryKey: ['/api/plagiarism/all'],
    queryFn: async () => {
      const checks: PlagiarismCheck[] = [];
      
      for (const course of courses) {
        try {
          const courseChecks = await apiRequest(`/api/plagiarism/course/${course.id}`);
          checks.push(...courseChecks.map((check: any) => ({
            ...check,
            courseName: course.title,
            studentName: check.studentId, // Will be populated from relations
          })));
        } catch (error) {
          console.error(`Failed to fetch plagiarism checks for course ${course.id}:`, error);
        }
      }
      
      return checks;
    },
    enabled: !!user && courses.length > 0,
  });

  // Mutation for running plagiarism checks
  const runPlagiarismCheck = useMutation({
    mutationFn: async (submissionId: number) => {
      return await apiRequest('/api/plagiarism/check', 'POST', { submissionId });
    },
    onSuccess: () => {
      toast({
        title: "Plagiarism Check Started",
        description: "The plagiarism analysis is now running. Results will be available shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/plagiarism/all'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start plagiarism check. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter checks based on selected filters
  const filteredChecks = allChecks.filter(check => {
    const matchesSearch = searchTerm === '' || 
      check.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      check.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = selectedCourse === 'all' || check.courseName === selectedCourse;
    const matchesStatus = statusFilter === 'all' || check.status === statusFilter;
    
    let matchesSeverity = true;
    if (severityFilter !== 'all') {
      const score = check.similarityScore;
      switch (severityFilter) {
        case 'high':
          matchesSeverity = score >= 60;
          break;
        case 'medium':
          matchesSeverity = score >= 30 && score < 60;
          break;
        case 'low':
          matchesSeverity = score < 30;
          break;
      }
    }
    
    return matchesSearch && matchesCourse && matchesStatus && matchesSeverity;
  });

  // Calculate dashboard statistics
  const stats = {
    totalChecks: allChecks.length,
    completedChecks: allChecks.filter(check => check.status === 'completed').length,
    highRiskSubmissions: allChecks.filter(check => check.similarityScore >= 60).length,
    averageSimilarity: allChecks.length > 0 
      ? allChecks.reduce((sum, check) => sum + check.similarityScore, 0) / allChecks.length 
      : 0,
  };

  const getSeverityColor = (score: number) => {
    if (score >= 80) return 'destructive';
    if (score >= 60) return 'destructive';
    if (score >= 40) return 'default';
    if (score >= 20) return 'secondary';
    return 'secondary';
  };

  const getSeverityText = (score: number) => {
    if (score >= 80) return 'Very High';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Moderate';
    if (score >= 20) return 'Low';
    return 'Very Low';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            You don't have permission to access the plagiarism dashboard. Only teachers and administrators can view plagiarism results.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plagiarism Detection Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and analyze plagiarism checks across all your courses
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Checks</p>
                <p className="text-2xl font-bold">{stats.totalChecks}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completedChecks}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold">{stats.highRiskSubmissions}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Similarity</p>
                <p className="text-2xl font-bold">{stats.averageSimilarity.toFixed(1)}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="checks" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="checks">Plagiarism Checks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="checks" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Student name or assignment..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label>Course</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {courses.map((course: any) => (
                        <SelectItem key={course.id} value={course.title}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Severity</Label>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="high">High (60%+)</SelectItem>
                      <SelectItem value="medium">Medium (30-59%)</SelectItem>
                      <SelectItem value="low">Low (<30%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>
                Plagiarism Checks ({filteredChecks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span className="ml-2">Loading plagiarism checks...</span>
                </div>
              ) : filteredChecks.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Plagiarism Checks Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || selectedCourse !== 'all' || statusFilter !== 'all' || severityFilter !== 'all'
                      ? "No checks match your current filters."
                      : "No plagiarism checks have been performed yet."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredChecks.map((check, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {getStatusIcon(check.status)}
                          <div>
                            <h3 className="font-semibold">{check.assignmentTitle}</h3>
                            <p className="text-sm text-muted-foreground">
                              {check.studentName} • {check.courseName}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <Badge variant={getSeverityColor(check.similarityScore)}>
                            {check.similarityScore.toFixed(1)}% - {getSeverityText(check.similarityScore)}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {safeFormat(check.checkedAt, 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                      
                      {check.status === 'completed' && (
                        <div className="mt-3 flex items-center gap-6 text-sm text-muted-foreground">
                          <span>{check.matchedSources} similar sources</span>
                          <span>{check.suspiciousPatterns} suspicious patterns</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                <p className="text-muted-foreground">
                  Detailed analytics and reporting features will be available in the next update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}