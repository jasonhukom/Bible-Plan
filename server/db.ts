import { Pool, type PoolClient } from "pg";

const authConnectionString = process.env.DATABASE_URL;
const appConnectionString = process.env.APP_DATABASE_URL;
if (!authConnectionString || !appConnectionString) {
  throw new Error("DATABASE_URL and APP_DATABASE_URL must be configured");
}

// This pool is restricted to Better Auth and account-link migrations.
export const authPool = new Pool({ connectionString: authConnectionString });
// This pool must use bible_app_user, which cannot bypass RLS.
const appPool = new Pool({ connectionString: appConnectionString });

export async function withUserRLS<T>(
  headers: Headers,
  callback: (client: PoolClient, userId: string) => Promise<T>,
): Promise<T> {
  const { auth } = await import("./auth.js");
  const session = await auth.api.getSession({ headers });
  const userId = session?.user?.id;
  if (!userId) throw new Error("Authentication required");

  const client = await appPool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.user_id', $1, true)", [userId]);
    const result = await callback(client, userId);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function migrateGuestData(guestId: string, userId: string): Promise<void> {
  if (guestId === userId) return;
  const client = await authPool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL row_security = off");
    await client.query("UPDATE reading_plans SET user_id = $2 WHERE user_id = $1", [guestId, userId]);
    await client.query("UPDATE schedules SET user_id = $2 WHERE user_id = $1", [guestId, userId]);
    await client.query(
      `INSERT INTO user_settings (user_id, data, updated_at)
       SELECT $2, data, now() FROM user_settings WHERE user_id = $1
       ON CONFLICT (user_id) DO UPDATE SET data = user_settings.data || EXCLUDED.data, updated_at = now()`,
      [guestId, userId],
    );
    await client.query(
      `INSERT INTO saved_verses (user_id, reference, data)
       SELECT $2, reference, data FROM saved_verses WHERE user_id = $1
       ON CONFLICT (user_id, reference) DO UPDATE SET data = saved_verses.data || EXCLUDED.data`,
      [guestId, userId],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
