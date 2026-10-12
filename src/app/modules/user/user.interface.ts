import { UserRoleEnum, UserStatus } from '@prisma/client';

export interface IUserFilterRequest {
  name?: string | undefined;
  email?: string | undefined;
}

export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  country?: string;
  state?: string;
  address?: string;
  password: string;
  dob?: Date; // Using JavaScript Date object for DateTime
  role: UserRoleEnum; // Assuming UserRoleEnum is defined elsewhere
  status: UserStatus; // Assuming UserStatus is defined elsewhere
  createdAt: Date;
  updatedAt: Date;
}
