import { useQuery } from "@tanstack/react-query";

// Define the user type based on the API response
export interface AuthUser {
  id: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role?: 'student' | 'teacher' | 'admin';
  createdAt?: Date;
  updatedAt?: Date;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<AuthUser>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
