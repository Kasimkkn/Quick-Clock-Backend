import { Optional } from "sequelize";

interface UserAttributes {
    id: string;
    fullName: string;
    email: string;
    password: string;
    mobile: string;
    department: string;
    designation: string;
    role: 'employee' | 'admin';
    photoUrl?: string;
    birthday?: string;
    createdAt: Date;
    updatedAt: Date;
    isWfhEnabled?: boolean;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> { }

export { UserAttributes, UserCreationAttributes };
