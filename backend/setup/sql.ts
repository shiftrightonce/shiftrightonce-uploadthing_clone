export const tenantTable = `
CREATE TABLE IF NOT EXISTS "tenants" (
	"internal_id"	INTEGER,
	"id"	TEXT NOT NULL UNIQUE,
	"status"	INTEGER NOT NULL,
	"is_default"	INTEGER NOT NULL,
	"name"	INTEGER NOT NULL,
	"created_at"	INTEGER NOT NULL DEFAULT 0,
	"updated_at"	INTEGER DEFAULT 0,
	"deleted_at"	INTEGER DEFAULT 0,
	PRIMARY KEY("internal_id" AUTOINCREMENT)
)`;

export const userTable = `
CREATE TABLE IF NOT EXISTS "users" (
	"internal_id"	INTEGER NOT NULL,
	"id"	TEXT NOT NULL UNIQUE,
	"name"	TEXT,
	"status"	INTEGER NOT NULL,
	"system_admin"	INTEGER NOT NULL,
	"created_at"	INTEGER NOT NULL DEFAULT 0,
	"updated_at"	INTEGER DEFAULT 0,
	"deleted_at"	INTEGER DEFAULT 0,
	PRIMARY KEY("internal_id" AUTOINCREMENT)
)
`;

export const userTenantRelationshipTable = `
CREATE TABLE IF NOT EXISTS "user_tenants" (
	"user_internal_id"	INTEGER NOT NULL,
	"tenant_internal_id"	INTEGER NOT NULL,
	"status"	INTEGER NOT NULL,
	"roles"	TEXT NOT NULL,
	"token"	TEXT NOT NULL,
	"created_at"	INTEGER NOT NULL,
	"updated_at"	INTEGER,
	"deleted_at"	INTEGER,
	FOREIGN KEY("user_internal_id") REFERENCES "users"("internal_id"),
	FOREIGN KEY("tenant_internal_id") REFERENCES "tenants"("internal_id")
)
`;

export const userTenantTableIndex = `
CREATE INDEX IF NOT EXISTS "user_tenant_index" ON "user_tenants" (
	"user_internal_id",
	"tenant_internal_id"
) `;

export const createStatements = [
	tenantTable,
	userTable,
	userTenantRelationshipTable,
	userTenantTableIndex
];