import type { AuthUser } from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";

export async function upsertAuthUser(userData: AuthUser): Promise<AuthUser> {
  const [user] = await db
    .insert(usersTable)
    .values(userData)
    .onConflictDoUpdate({
      target: usersTable.id,
      set: { ...userData, updatedAt: new Date() },
    })
    .returning();

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
  };
}