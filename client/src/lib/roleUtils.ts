export interface RolePermissions {
  canCreateCourses: boolean;
  canGradeAssignments: boolean;
  canManageUsers: boolean;
  canAccessAnalytics: boolean;
  canCreateAnnouncements: boolean;
  canModerateDiscussions: boolean;
  canAccessAllCourses: boolean;
  canManageSystemSettings: boolean;
  manageStudents: boolean;
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
        manageStudents: true,
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
        manageStudents: true,
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
        manageStudents: false,
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
    '/students': ['teacher', 'admin'],
    '/analytics': ['teacher', 'admin'],
    '/profile': ['student', 'teacher', 'admin'],
  };

  // Handle dynamic routes like /courses/:courseId/settings
  if (route.includes('/courses/') && route.includes('/settings')) {
    return ['teacher', 'admin'].includes(userRole);
  }

  // Handle dynamic routes like /courses/:courseId
  if (route.includes('/courses/') && !route.includes('/settings')) {
    return ['student', 'teacher', 'admin'].includes(userRole);
  }

  return routePermissions[route]?.includes(userRole) || false;
};