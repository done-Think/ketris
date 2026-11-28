-- Removes every account and everything tied to it (properties, contracts, leads, charges, agenda,
-- Face Check, public profiles...). Kept on purpose: the system tenant 'locatarios' itself (renter
-- sign-up needs it, but not its users), platform admins, plans and platform configuration.
--
-- STEP 1 - preview (safe, read-only). Run this first and read the numbers.
SELECT (SELECT count(*) FROM tenants WHERE slug <> 'locatarios') AS tenants_to_delete,
       (SELECT count(*) FROM users) AS users_to_delete,
       (SELECT count(*) FROM properties) AS properties_to_delete,
       (SELECT count(*) FROM contracts) AS contracts_to_delete,
       (SELECT count(*) FROM tenants WHERE slug = 'locatarios') AS system_tenant_kept,
       (SELECT count(*) FROM platform_admins) AS platform_admins_kept;

-- STEP 2 - cleanup. ONE statement, so it is atomic on any client (all or nothing) and needs no
-- BEGIN/COMMIT. Rows behind NO ACTION/RESTRICT foreign keys are deleted explicitly in the same
-- statement; the cascade from the tenants removes the rest.
-- There is no undo after this runs: take an RDS snapshot first if anything here is worth keeping.
WITH doomed AS (
  SELECT id FROM tenants WHERE slug <> 'locatarios'
),
signatures AS (
  DELETE FROM contract_signatures
  WHERE "documentId" IN (
          SELECT d.id FROM contract_documents d JOIN contracts c ON c.id = d."contractId"
          WHERE c."tenantId" IN (SELECT id FROM doomed))
     OR "contractPartyId" IN (SELECT p.id FROM contract_parties p WHERE p."tenantId" IN (SELECT id FROM doomed))
  RETURNING 1
),
documents AS (
  DELETE FROM contract_documents
  WHERE "contractId" IN (SELECT id FROM contracts WHERE "tenantId" IN (SELECT id FROM doomed))
  RETURNING 1
),
receipts AS (DELETE FROM charge_receipts WHERE "tenantId" IN (SELECT id FROM doomed) RETURNING 1),
charge_audit AS (DELETE FROM charge_audit_events WHERE "tenantId" IN (SELECT id FROM doomed) RETURNING 1),
charges_gone AS (DELETE FROM charges WHERE "tenantId" IN (SELECT id FROM doomed) RETURNING 1),
tickets AS (DELETE FROM maintenance_tickets WHERE "tenantId" IN (SELECT id FROM doomed) RETURNING 1),
contracts_gone AS (DELETE FROM contracts WHERE "tenantId" IN (SELECT id FROM doomed) RETURNING 1),
face_emails AS (DELETE FROM face_check_invitation_emails WHERE "tenantId" IN (SELECT id FROM doomed) RETURNING 1),
face_sessions AS (DELETE FROM face_check_sessions WHERE "tenantId" IN (SELECT id FROM doomed) RETURNING 1),
agenda AS (DELETE FROM agenda_events WHERE "tenantId" IN (SELECT id FROM doomed) RETURNING 1),
leads_gone AS (DELETE FROM leads WHERE "tenantId" IN (SELECT id FROM doomed) RETURNING 1),
opportunities_gone AS (DELETE FROM opportunities WHERE "tenantId" IN (SELECT id FROM doomed) RETURNING 1),
properties_gone AS (DELETE FROM properties WHERE "tenantId" IN (SELECT id FROM doomed) RETURNING 1),
contacts_gone AS (DELETE FROM contacts WHERE "tenantId" IN (SELECT id FROM doomed) RETURNING 1),
tenants_gone AS (DELETE FROM tenants WHERE id IN (SELECT id FROM doomed) RETURNING 1)
DELETE FROM users WHERE "tenantId" IN (SELECT id FROM tenants WHERE slug = 'locatarios');

-- STEP 3 - check. Expect 1 tenant, 0 users and your platform admin(s).
SELECT (SELECT count(*) FROM tenants) AS tenants,
       (SELECT count(*) FROM users) AS users,
       (SELECT count(*) FROM properties) AS properties,
       (SELECT count(*) FROM platform_admins) AS platform_admins;
