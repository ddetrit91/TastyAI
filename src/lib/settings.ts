import { eq } from "drizzle-orm";
import { appSettings } from "@/lib/db/schema";
import { withDb } from "@/lib/db";

export type SettingKey = "allow_registration" | "maintenance_mode";

const DEFAULTS: Record<SettingKey, string> = {
  allow_registration: "true",
  maintenance_mode: "false",
};

export async function getSetting(key: SettingKey): Promise<string> {
  const rows = await withDb(async (db) => {
    return db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
  });
  return rows?.[0]?.value ?? DEFAULTS[key];
}

export async function getAllSettings(): Promise<Record<SettingKey, boolean>> {
  const allow = await getSetting("allow_registration");
  const maintenance = await getSetting("maintenance_mode");
  return {
    allow_registration: allow !== "false",
    maintenance_mode: maintenance === "true",
  };
}

export async function setSetting(key: SettingKey, value: boolean): Promise<void> {
  const now = new Date().toISOString();
  const str = value ? "true" : "false";
  await withDb(async (db) => {
    const existing = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1);
    if (existing[0]) {
      await db
        .update(appSettings)
        .set({ value: str, updatedAt: now })
        .where(eq(appSettings.key, key));
    } else {
      await db.insert(appSettings).values({ key, value: str, updatedAt: now });
    }
  });
}
