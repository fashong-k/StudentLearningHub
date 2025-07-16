import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

export default function LocalLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Role-to-username mapping for validation
  const roleToUsernameMap: { [key: string]: string[] } = {
    'student': ['student', 'student2', 'student3'],
    'teacher': ['teacher', 'teacher2'],
    'admin': ['admin']
  };

  // Pre-fill username from URL parameter if provided
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const usernameParam = urlParams.get('username');
    const roleParam = urlParams.get('role');
    
    if (usernameParam) {
      setUsername(usernameParam);
      // Auto-fill password for development convenience
      const passwordMap: { [key: string]: string } = {
        'admin': 'admin123',
        'teacher': 'teacher123',
        'student': 'student123',
        'teacher2': 'teacher123',
        'student2': 'student123',
        'student3': 'student123'
      };
      setPassword(passwordMap[usernameParam] || '');
    }
    
    if (roleParam) {
      setSelectedRole(roleParam);
    }
  }, []);

  const validateRoleAndUsername = (role: string, username: string): boolean => {
    const validUsernames = roleToUsernameMap[role];
    return validUsernames ? validUsernames.includes(username) : false;
  };

  const getSuggestedUsername = (role: string): string => {
    const validUsernames = roleToUsernameMap[role];
    return validUsernames ? validUsernames[0] : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate role-username match if a role was selected
    if (selectedRole && !validateRoleAndUsername(selectedRole, username)) {
      const suggestedUsername = getSuggestedUsername(selectedRole);
      const roleDisplay = selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1);
      setError(`Invalid username for ${roleDisplay} role. Please use "${suggestedUsername}" or select a different role.`);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/local/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.user.firstName}!`,
        });
        
        // Invalidate the auth query to refresh authentication state
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        // Wait for authentication state to refresh, then navigate
        await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
        
        // Navigate to dashboard (role-specific content handled by Dashboard component)
        setLocation('/');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Local Development Login</CardTitle>
          <CardDescription className="text-center">
            Sign in to access the Learning Management System
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedRole && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Selected Role:</strong> {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Please use a username that matches this role
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
              {selectedRole && (
                <p className="text-xs text-gray-600">
                  Valid usernames for {selectedRole}: {roleToUsernameMap[selectedRole]?.join(', ')}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-6 border-t pt-4">
            <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
              Development Credentials:
            </h3>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div><strong>Admin:</strong> admin / admin123</div>
              <div><strong>Teacher:</strong> teacher / teacher123</div>
              <div><strong>Student:</strong> student / student123</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}