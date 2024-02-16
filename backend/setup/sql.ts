export const tenantTable = `
CREATE TABLE IF NOT EXISTS "tenants" (
	"internal_id"	INTEGER,
	"id"	TEXT NOT NULL UNIQUE,
	"status"	INTEGER NOT NULL,
	"is_default"	INTEGER NOT NULL,
	"name"	INTEGER NOT NULL,
	"constrain" TEXT,
	"created_at"	NUMERIC NOT NULL DEFAULT 0,
	"updated_at"	NUMERIC DEFAULT 0,
	"deleted_at"	NUMERIC DEFAULT 0,
	PRIMARY KEY("internal_id" AUTOINCREMENT)
)`;

export const userTable = `
CREATE TABLE IF NOT EXISTS "users" (
	"internal_id"	INTEGER NOT NULL,
	"id"	TEXT NOT NULL UNIQUE,
	"name"	TEXT,
	"status"	INTEGER NOT NULL,
	"system_admin"	INTEGER NOT NULL,
	"created_at"	NUMERIC NOT NULL DEFAULT 0,
	"updated_at"	NUMERIC DEFAULT 0,
	"deleted_at"	NUMERIC DEFAULT 0,
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
	"constrain" TEXT,
	"created_at"	NUMERIC NOT NULL,
	"updated_at"	NUMERIC DEFAULT 0,
	"deleted_at"	NUMERIC DEFAULT 0,
	FOREIGN KEY("user_internal_id") REFERENCES "users"("internal_id") ON DELETE CASCADE,
	FOREIGN KEY("tenant_internal_id") REFERENCES "tenants"("internal_id") ON DELETE CASCADE
)
`;

export const userTenantTableIndex = `
CREATE INDEX IF NOT EXISTS "user_tenant_index" ON "user_tenants" (
	"user_internal_id",
	"tenant_internal_id"
) `;

export const signedUrlTable = `
CREATE TABLE IF NOT EXISTS "signed_urls" (
	"internal_id"	INTEGER,
	"id"	TEXT NOT NULL,
	"author_internal_id"	INTEGER,
	"tenant_internal_id"	INTEGER,
	"version"	INTEGER DEFAULT 1,
	"total"	INTEGER DEFAULT 1,
	"constraint"	TEXT NOT NULL,
	"metadata"	TEXT,
	"expire_at"	NUMERIC NOT NULL,
	"created_at"	NUMERIC NOT NULL,
	"updated_at"	NUMERIC DEFAULT 0,
	"deleted_at"	NUMERIC DEFAULT 0,
	PRIMARY KEY("internal_id" AUTOINCREMENT),
	FOREIGN KEY("author_internal_id") REFERENCES "users"("internal_id") ON DELETE CASCADE,
	FOREIGN KEY("tenant_internal_id") REFERENCES "tenants"("internal_id") ON DELETE CASCADE
)
`;

const uploadTable = `
CREATE TABLE IF NOT EXISTS "uploads" (
	"internal_id"	INTEGER,
	"id"	TEXT NOT NULL,
	"name"	TEXT NOT NULL,
	"tenant_internal_id"	INTEGER NOT NULL,
	"user_internal_id"	INTEGER NOT NULL,
	"storage"	TEXT NOT NULL,
	"uploaded_at"	INTEGER NOT NULL,
	FOREIGN KEY("user_internal_id") REFERENCES "users"("internal_id"),
	FOREIGN KEY("tenant_internal_id") REFERENCES "tenants"("internal_id") ON DELETE CASCADE,
	PRIMARY KEY("internal_id" AUTOINCREMENT)
)
`;

export const createStatements = [
	tenantTable,
	userTable,
	userTenantRelationshipTable,
	userTenantTableIndex,
	signedUrlTable,
	uploadTable,
];