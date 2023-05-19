export const tenantTable = `
CREATE TABLE IF NOT EXISTS "tenants" (
	"internal_id"	INTEGER,
	"status"	INTEGER NOT NULL,
	"name"	INTEGER NOT NULL,
	PRIMARY KEY("internal_id" AUTOINCREMENT)
)`;

export const userTable = `
CREATE TABLE IF NOT EXISTS "users" (
	"internal_id"	INTEGER NOT NULL,
	"id"	TEXT NOT NULL UNIQUE,
	"name"	TEXT,
	"status"	INTEGER NOT NULL,
	"system_admin"	INTEGER NOT NULL,
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
	FOREIGN KEY("user_internal_id") REFERENCES "users"("internal_id")
)
`;

export const userTenantTableIndex = `
CREATE INDEX IF NOT EXISTS "user_tenant_index" ON "user_tenants" (
	"user_internal_id",
	"tenant_internal_id"
) `;

export const findOneSystemAdmin = `
SELECT
  *
FROM 
  'users'
WHERE
  system_admin = 1 AND
  status = 1
LIMIT
  1
`;


export const insertUser = `
INSERT INTO 'users'
  ('id', 'name', 'status', 'system_admin')
VALUES ('01h0s5zzzqkahbv3myfttmcrhv', 'Default Admin', 1, 1)
`;

export const createStatements = [
  tenantTable,
  userTable,
  userTenantRelationshipTable,
  userTenantTableIndex
];