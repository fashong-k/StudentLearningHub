import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function Profile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden lms-background">
      <Navigation />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Profile</h1>
          
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
                    <AvatarFallback className="text-lg">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">
                      {user?.firstName} {user?.lastName}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="secondary" className="capitalize">
                        {user?.role}
                      </Badge>
                      <span className="text-sm text-gray-500">{user?.email}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Personal Information</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <span className="ml-2">{user?.email || "Not provided"}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Role:</span>
                        <span className="ml-2 capitalize">{user?.role}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Member since:</span>
                        <span className="ml-2">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Account Status</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <Badge variant="outline" className="ml-2 text-green-600">
                          Active
                        </Badge>
                      </div>
                      <div>
                        <span className="text-gray-600">Last login:</span>
                        <span className="ml-2">Today</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
