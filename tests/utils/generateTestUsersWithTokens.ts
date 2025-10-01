import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../../src/app/modules/user/user.model';
import { faker } from '@faker-js/faker';

export const generateTestUsersWithTokens = async () => {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = {
    _id: faker.database.mongodbObjectId(),
    name: 'Admin User',
    email: `admin_${faker.string.uuid()}@example.com`,
    role: 'admin',
    password: adminPassword,
  };

  const user = {
    _id: faker.database.mongodbObjectId(),
    name: 'Normal User',
    email: `user_${faker.string.uuid()}@example.com`,
    role: 'user',
    password: userPassword,
  };

  await User.create([admin, user]);

  const tokens = {
    admin: jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    ),
    user: jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    }),
  };

  return { users: { admin, user }, tokens };
};
