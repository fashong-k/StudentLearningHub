import { useAuth } from "@/hooks/useAuth";
import { getRolePermissions, hasPermission, type RolePermissions } from "@/lib/roleUtils";

export function usePermissions() {
  const { user } = useAuth();
  const userRole = user?.role || "student";
  
  const permissions = getRolePermissions(userRole);
  
  const can = (permission: keyof RolePermissions): boolean => {
    return hasPermission(userRole, permission);
  };

  return {
    permissions,
    can,
    userRole,
    isAdmin: userRole === "admin",
    isTeacher: userRole === "teacher",
    isStudent: userRole === "student",
  };
}