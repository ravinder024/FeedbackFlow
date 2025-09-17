import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, password, companyName, designation, privacyAccepted } = req.body;

  if (!name || !email || !password || !companyName || !designation || !privacyAccepted) {
    return res.status(400).json({ error: 'All fields are required and privacy must be accepted.' });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ error: 'Email already registered.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      companyName,
      designation,
      privacyAcceptedAt: new Date(),
      role: 'TEST_MEMBER',
    },
  });

  return res.status(201).json({ message: 'Registration successful', user: { id: user.id, email: user.email } });
} 