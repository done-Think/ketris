# Renter maintenance access

Renters can access Charges and Maintenance tickets in the dashboard. Schedule and My Properties remain outside this delivery. Login still opens Charges.

## Ticket access

- Access requires an active tenant user with an approved membership.
- The ticket must belong to the same tenant and property as its linked contract.
- The renter must be explicitly linked through a contract party with role `LOCATARIO` and their user ID. Matching names or email addresses does not grant access.
- Renters can open tickets for their linked contracts, including viewing tickets opened by other authorized users on those contracts.
- Renters can edit only their own tickets while the status is `ABERTO`. Editing cannot move a ticket to a different contract or property.
- Notes and JPEG, PNG or WebP attachments up to 8 MB are allowed while the ticket permits collaboration.
- Non-archived tickets in `RESOLVIDO`, `CANCELADO` or `FECHADO` remain readable by linked renters, including their timeline and attachments. Editing, notes and uploads are blocked.
- Renters cannot assign responsibility, manage providers, change status, confirm or contest resolution, archive, restore or reopen tickets.

## Resolution confirmation and contestation

Both actions require status `AGUARDANDO_CONFIRMACAO` and an accessible, non-archived ticket.

| Action                             | Authorized actor                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------- |
| Confirm resolution                 | Tenant ADMIN or linked property OWNER, provided the completion was not performed by an OWNER |
| Confirm work completed by an OWNER | Tenant ADMIN                                                                                 |
| Contest resolution                 | Tenant ADMIN or linked property OWNER, with a mandatory reason                               |

RENTER and AGENT do not have permission to confirm or contest resolution.

## Deferred work

Legacy tickets without a linked contract and archived tickets remain restricted to the tenant ADMIN. Explicit administrative contract association, archived read access and preservation of historical membership are separate deliveries. Current access is evaluated using the existing contract and property links; this delivery does not create membership snapshots.
