import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { hashPassword, verifyPassword } from "../../utils/password";
import { signAccessToken } from "../../utils/jwt";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "MENTOR" | "ADMIN";
  createdAt: Date;
};

const publicUser = (u: UserRow) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
  createdAt: u.createdAt,
});

export async function register(input: {
  name: string;
  email: string;
  password: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) throw ApiError.conflict("Email already registered");

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      role: "STUDENT",
    },
  });

  const token = signAccessToken({ sub: user.id, role: user.role });
  return { user: publicUser(user), token };
}

export async function login(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  const ok = user
    ? await verifyPassword(input.password, user.passwordHash)
    : false;

  if (!user || !ok) throw ApiError.unauthorized("Invalid email or password");

  const token = signAccessToken({ sub: user.id, role: user.role });
  return { user: publicUser(user), token };
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("User not found");
  return publicUser(user);
}
