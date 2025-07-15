import { storage } from './storage';
import type { Express, Request, Response, NextFunction } from 'express';

// Simple local authentication for development
export interface LocalUser {
  id: string;
  username: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  firstName: string;
  lastName: string;
}

// Default users for local development
const defaultUsers: LocalUser[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@lms.local',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User'
  },
  {
    id: '2',
    username: 'teacher',
    email: 'teacher@lms.local',
    role: 'teacher',
    firstName: 'John',
    lastName: 'Teacher'
  },
  {
    id: '3',
    username: 'student',
    email: 'student@lms.local',
    role: 'student',
    firstName: 'Jane',
    lastName: 'Student'
  }
];

const userCredentials = {
  admin: 'admin123',
  teacher: 'teacher123',
  student: 'student123'
};

export function setupLocalAuth(app: Express) {
  // Local login endpoint
  app.post('/api/local/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }
    
    // Check credentials
    if (userCredentials[username as keyof typeof userCredentials] !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Find user
    const user = defaultUsers.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Create/update user in database
    try {
      await storage.upsertUser({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      });
    } catch (error) {
      console.log('Database not available, using mock user');
    }
    
    // Set session
    (req.session as any).user = user;
    
    res.json({ 
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  });
  
  // Local logout endpoint
  app.post('/api/local/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logout successful' });
    });
  });
  
  // Get current user for local development
  app.get('/api/auth/user', async (req: Request, res: Response) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const user = await storage.getUser(sessionUser.id);
      res.json(user || sessionUser);
    } catch (error) {
      // If database is not available, return session user
      res.json(sessionUser);
    }
  });
}

// Simple auth middleware for local development
export const isLocallyAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const sessionUser = (req.session as any).user;
  
  if (!sessionUser) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  // Add user to request for compatibility
  (req as any).user = {
    claims: {
      sub: sessionUser.id,
      email: sessionUser.email,
      first_name: sessionUser.firstName,
      last_name: sessionUser.lastName
    }
  };
  
  next();
};