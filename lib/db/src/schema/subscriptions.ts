import {
  date,
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const subscriptionsTable = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    plan: varchar("plan", { length: 20 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    activatedAt: timestamp("activated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    currentPeriodStart: date("current_period_start", {
      mode: "string",
    }).notNull(),
    notes: varchar("notes", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("subscriptions_user_status_idx").on(table.userId, table.status),
  ],
);

export type Subscription = typeof subscriptionsTable.$inferSelect;
export type InsertSubscription = typeof subscriptionsTable.$inferInsert;

export const verdictUsageTable = pgTable(
  "verdict_usage",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    periodKey: varchar("period_key", { length: 20 }).notNull(),
    used: integer("used").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("verdict_usage_user_period_idx").on(table.userId, table.periodKey),
    uniqueIndex("verdict_usage_user_period_unique").on(
      table.userId,
      table.periodKey,
    ),
  ],
);

export type VerdictUsage = typeof verdictUsageTable.$inferSelect;