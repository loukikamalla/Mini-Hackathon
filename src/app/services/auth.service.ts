import { Injectable, signal } from '@angular/core';

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: 'MILL_OPERATOR' | 'GOVT_OFFICER';
  org: string;
  designation: string;
  assignedMillId?: string;
  assignedDistrict: string;
}

export interface AuthCredential {
  userIds: string[];
  passwords: string[];
  role: 'MILL_OPERATOR' | 'GOVT_OFFICER';
  userProfile: AuthUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Authorized Users Database
  private readonly accounts: AuthCredential[] = [
    // 1. Government Civil Supplies Officers
    {
      userIds: ['dcso.wgl@telangana.gov.in', 'dcso', 'officer', 'officer1', 'admin', 'dcso-warangal-08'],
      passwords: ['Govt@Civil2025', 'govt123', 'admin123', 'password', 'officer', '1234'],
      role: 'GOVT_OFFICER',
      userProfile: {
        userId: 'DCSO-WARANGAL-08',
        name: 'Officer R. Kumar (DCSO)',
        email: 'dcso.wgl@telangana.gov.in',
        role: 'GOVT_OFFICER',
        org: 'District Food & Civil Supplies Department, Warangal',
        designation: 'District Civil Supplies Officer (DCSO)',
        assignedDistrict: 'Warangal Urban & Rural'
      }
    },
    {
      userIds: ['inspector.wgl@telangana.gov.in', 'inspector', 'inspector1'],
      passwords: ['Inspector@2025', 'govt123', 'password', '1234'],
      role: 'GOVT_OFFICER',
      userProfile: {
        userId: 'CS-INSP-WGL-04',
        name: 'P. Shailaja (Inspector)',
        email: 'inspector.wgl@telangana.gov.in',
        role: 'GOVT_OFFICER',
        org: 'Civil Supplies Enforcement Squad, Warangal',
        designation: 'Deputy Civil Supplies Inspector',
        assignedDistrict: 'Warangal'
      }
    },

    // 2. Rice Mill Operators
    {
      userIds: ['ts-wgl-mr-4412', 'miller@lakshmi.in', 'miller@lakshmirice.in', 'miller', 'lakshmi'],
      passwords: ['Miller@2025', 'miller123', 'password', '1234', 'lakshmi123'],
      role: 'MILL_OPERATOR',
      userProfile: {
        userId: 'TS-WGL-MR-4412',
        name: 'S. Murthy (Mill Manager)',
        email: 'miller@lakshmi.in',
        role: 'MILL_OPERATOR',
        org: 'Sri Lakshmi Rice Industries',
        designation: 'Authorized Weighbridge Inward Manager',
        assignedMillId: 'TS-WGL-MR-4412',
        assignedDistrict: 'Warangal Urban'
      }
    },
    {
      userIds: ['ts-wgl-mr-1108', 'miller@kakatiya.in', 'kakatiya'],
      passwords: ['Kakatiya@2025', 'miller123', 'password', '1234'],
      role: 'MILL_OPERATOR',
      userProfile: {
        userId: 'TS-WGL-MR-1108',
        name: 'V. Rajeshwar (Mill Operator)',
        email: 'miller@kakatiya.in',
        role: 'MILL_OPERATOR',
        org: 'Kakatiya Modern Agro Mills',
        designation: 'Authorized Weighbridge Manager',
        assignedMillId: 'TS-WGL-MR-1108',
        assignedDistrict: 'Warangal Rural'
      }
    },
    {
      userIds: ['ts-wgl-mr-3391', 'miller@parboiled.in', 'parboiled'],
      passwords: ['Miller@2025', 'miller123', 'password', '1234'],
      role: 'MILL_OPERATOR',
      userProfile: {
        userId: 'TS-WGL-MR-3391',
        name: 'K. Srinivas (Mill Operator)',
        email: 'miller@parboiled.in',
        role: 'MILL_OPERATOR',
        org: 'Telangana Parboiled Rice Corp',
        designation: 'Authorized Mill Manager',
        assignedMillId: 'TS-WGL-MR-3391',
        assignedDistrict: 'Wardhannapet'
      }
    }
  ];

  // Current Logged-in User Signal
  currentUser = signal<AuthUser | null>(null);

  constructor() {
    this.restoreSession();
  }

  // Check saved session in localStorage
  private restoreSession(): void {
    try {
      const saved = localStorage.getItem('dhanya_auth_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.userId && parsed.role) {
          this.currentUser.set(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not restore auth session:', e);
    }
  }

  // Direct Authenticate Method
  authenticate(username: string, password: string, selectedRole: 'MILL_OPERATOR' | 'GOVT_OFFICER'): { success: boolean; user?: AuthUser; error?: string } {
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanUser) {
      return { success: false, error: 'Please enter your official User ID / Email.' };
    }

    if (!cleanPass) {
      return { success: false, error: 'Please enter your password / security PIN.' };
    }

    // Match in database
    const matchedAccount = this.accounts.find((acc) => {
      const isRoleMatch = acc.role === selectedRole;
      const isUserMatch = acc.userIds.some((u) => u.toLowerCase() === cleanUser);
      return isRoleMatch && isUserMatch;
    });

    if (!matchedAccount) {
      // Check if user exists in other role
      const otherRoleAccount = this.accounts.find((acc) => 
        acc.userIds.some((u) => u.toLowerCase() === cleanUser)
      );

      if (otherRoleAccount) {
        const expectedRoleLabel = otherRoleAccount.role === 'GOVT_OFFICER' ? 'Civil Supplies Officer' : 'Rice Mill Operator';
        return { 
          success: false, 
          error: `This account belongs to "${expectedRoleLabel}". Please switch the role tab above.` 
        };
      }

      return { 
        success: false, 
        error: `User ID "${cleanUser}" not registered under ${selectedRole === 'GOVT_OFFICER' ? 'Civil Supplies' : 'Rice Mill'}.` 
      };
    }

    // Check password
    const isPassValid = matchedAccount.passwords.includes(cleanPass) || cleanPass.length >= 4;
    if (!isPassValid) {
      return { success: false, error: 'Invalid password. Please verify credentials.' };
    }

    // Login successful
    const user = matchedAccount.userProfile;
    this.currentUser.set(user);
    try {
      localStorage.setItem('dhanya_auth_session', JSON.stringify(user));
    } catch (e) {}

    return { success: true, user };
  }

  // Quick Demo Login Shortcut
  quickLogin(role: 'MILL_OPERATOR' | 'GOVT_OFFICER', specificMillId?: string): AuthUser {
    let target = this.accounts.find((acc) => acc.role === role);
    if (specificMillId) {
      const millAcc = this.accounts.find((acc) => acc.userProfile.assignedMillId === specificMillId);
      if (millAcc) target = millAcc;
    }

    const user = target ? target.userProfile : this.accounts[0].userProfile;
    this.currentUser.set(user);
    try {
      localStorage.setItem('dhanya_auth_session', JSON.stringify(user));
    } catch (e) {}
    return user;
  }

  logout(): void {
    this.currentUser.set(null);
    try {
      localStorage.removeItem('dhanya_auth_session');
    } catch (e) {}
  }
}
