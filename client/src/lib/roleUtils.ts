export interface RolePermissions {
  canCreateCourses: boolean;
  canGradeAssignments: boolean;
  canManageUsers: boolean;
  canAccessAnalytics: boolean;
  canCreateAnnouncements: boolean;
  canModerateDiscussions: boolean;
  canAccessAllCourses: boolean;
  canManageSystemSettings: boolean;
}

export const getRolePermissions = (role: string): RolePermissions => {
  switch (role) {
    case 'admin':
      return {
        canCreateCourses: true,
        canGradeAssignments: true,
        canManageUsers: true,
        canAccessAnalytics: true,
        canCreateAnnouncements: true,
        canModerateDiscussions: true,
        canAccessAllCourses: true,
        canManageSystemSettings: true,
      };
    case 'teacher':
      return {
        canCreateCourses: true,
        canGradeAssignments: true,
        canManageUsers: false,
        canAccessAnalytics: true,
        canCreateAnnouncements: true,
        canModerateDiscussions: true,
        canAccessAllCourses: false,
        canManageSystemSettings: false,
      };
    case 'student':
    default:
      return {
        canCreateCourses: false,
        canGradeAssignments: false,
        canManageUsers: false,
        canAccessAnalytics: false,
        canCreateAnnouncements: false,
        canModerateDiscussions: false,
        canAccessAllCourses: false,
        canManageSystemSettings: false,
      };
  }
};

export const hasPermission = (userRole: string, permission: keyof RolePermissions): boolean => {
  const permissions = getRolePermissions(userRole);
  return permissions[permission];
};

export const canAccessRoute = (userRole: string, route: string): boolean => {
  const routePermissions: { [key: string]: string[] } = {
    '/': ['student', 'teacher', 'admin'],
    '/courses': ['student', 'teacher', 'admin'],
    '/assignments': ['student', 'teacher', 'admin'],
    '/grades': ['student', 'teacher', 'admin'],
    '/messages': ['student', 'teacher', 'admin'],
    '/announcements': ['student', 'teacher', 'admin'],
    '/analytics': ['teacher', 'admin'],
    '/profile': ['student', 'teacher', 'admin'],
  };

  return routePermissions[route]?.includes(userRole) || false;
};