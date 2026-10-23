# Renter maintenance access

Renters can access Charges, Maintenance tickets, My Properties and Agenda in the dashboard. Login still opens Charges.

## Personal agenda and service dates

The renter agenda combines explicitly linked appointments, charge due dates and maintenance tickets from the existing authorized APIs. Lists are paginated through to completion and cached separately by tenant, user and role. Failure of one source does not hide successful sources. Charge due dates are calendar dates; they do not imply an appointment time.

Each accessible maintenance ticket appears on its opening date (`createdAt`) and, when set, its scheduled service date (`scheduledAt`, stored as `atendimentoEm`). Both entries link to the same ticket. Opening dates remain unchanged when service is rescheduled. A ticket without a scheduled date has only its opening entry.

Scheduling happens in the existing ticket detail after a provider has been assigned. The date/time selector stays disabled without a provider and displays a reminder to agree on the appointment with the selected provider first. A linked renter or authorized staff member can use the dedicated `schedule` action on an active ticket; it requires a valid date/time with timezone and appends an audit entry with the previous/new dates and provider. It does not grant permission to edit original ticket fields. Creation with an appointment is rejected because the new ticket has no provider yet; administrative field updates also enforce the provider requirement. Existing tickets remain unscheduled after the additive migration.

## Ticket access

Renter accounts may live in the shared renters tenant and have explicitly linked contracts in
multiple agencies. The account ID authorizes only the linked contracts. Staff remains restricted
to its own agency; sharing a renter does not share agency data. Ticket, contract and property must
belong to the same agency. New tickets and attachment storage use that agency's tenant, while
ticket lists, details, activities and private media all enforce the explicit membership.

Link confirmation requires an administrative API action: either
`POST /api/contracts/{id}/parties/{partyId}/link-user` with `{ "email": "..." }`, or
`POST /api/maintenance/links` with `{ "contractId": "...", "partyId": "...", "renterId": "..." }`.
Both require the contract agency's ADMIN, a LOCATARIO party and an active RENTER with a matching
normalized email. Repeating the same link is permitted; replacing it is rejected atomically.
Existing unlinked parties and legacy tickets do not become accessible through login or matching
email. A legacy ticket also requires the separate administrative `linkContract` action.

- Access requires an active tenant user with an approved membership.
- The ticket must belong to the same tenant and property as its linked contract.
- The renter must be explicitly linked through a contract party with role `LOCATARIO` and their user ID. Matching names or email addresses does not grant access.
- Renters can open tickets for their linked contracts, including viewing tickets opened by other authorized users on those contracts.
- Renters cannot edit original ticket fields, even on their own `ABERTO` tickets. Corrections and additional details must be appended as notes.
- Notes and JPEG, PNG or WebP attachments up to 8 MB are allowed while the ticket permits collaboration.
- Non-archived `RESOLVIDO` tickets remain readable by linked renters and accept additional notes. Notes preserve the resolution status and date. Uploads and field editing remain blocked until reopening; field editing stays unavailable to renters after reopening.
- `CANCELADO` and `FECHADO` tickets remain read-only for renters, including their timeline and attachments. Editing, notes, uploads and reopening are blocked.
- Renters cannot assign internal responsibility, arbitrarily change status, edit original ticket fields or existing history, archive or restore tickets.

## Provider assignment

Contract-linked renters can use the existing **Definir prestador** button and modal to enter provider details on accessible, non-archived active tickets, including those opened by other authorized users. The same `provider` action used by ADMIN and the assigned AGENT records the actor and snapshots of the previous and new provider details in the history. It does not grant editing of original ticket fields or previous activities.

Provider changes are blocked on `RESOLVIDO`, `CANCELADO`, `FECHADO`, archived or unlinked tickets. An existing pending replacement request must still be decided by ADMIN before the provider can be changed. OWNER replacement-request permissions remain unchanged. This delivery reuses the current form; it adds no professional catalog or database migration.

## Direct renter finalization

The `finish` action lets a contract-linked RENTER mark an accessible, non-archived ticket as `RESOLVIDO` directly from `ABERTO`, `EM_ANDAMENTO`, `AGUARDANDO_CONFIRMACAO` or `CONTESTADO`. It requires no prior team action, assigned professional or separate owner/ADMIN confirmation. It applies regardless of who opened the ticket.

Finalization records the renter as the completion author, sets the resolution date and appends a status-change activity containing the previous/new status, resolution date and previous completion role. Original fields, earlier activities, attachments and provider information remain intact. The UI asks the renter to confirm that the problem is resolved before sending the action.

This action is separate from the team's `complete` action, which continues to move an assigned service from `EM_ANDAMENTO` to `AGUARDANDO_CONFIRMACAO`, and the existing ADMIN/OWNER `confirm` action. A renter can still add notes after resolution and reopen with a reason. Repeated finalization and finalization of cancelled, closed, archived or inaccessible tickets are blocked. Provider registration and recommendations remain a separate delivery.

## Reopening and additional notes

A renter explicitly linked to the ticket contract can reopen a non-archived `RESOLVIDO` ticket, regardless of who opened it. A non-empty reason is mandatory and the target status must be `ABERTO`; renters cannot reopen directly into `EM_ANDAMENTO`.

Reopening records the author, reason, previous/new status, previous resolution date and completion role in the activity history. The current resolution and completion fields are cleared for the new service cycle. Original fields, earlier activities and attachments are preserved. ADMIN retains its existing reopening permissions for `RESOLVIDO` and `CANCELADO` tickets.

The `comment` permission controls appending notes separately from `collaborate`, which continues to control attachments. On resolved tickets only linked renters gain the extra note permission; other roles retain their existing restrictions. There is no note-edit or note-delete endpoint.

## Resolution confirmation and contestation

Both actions require status `AGUARDANDO_CONFIRMACAO` and an accessible, non-archived ticket.

| Action                             | Authorized actor                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------- |
| Confirm resolution                 | Tenant ADMIN or linked property OWNER, provided the completion was not performed by an OWNER |
| Confirm work completed by an OWNER | Tenant ADMIN                                                                                 |
| Contest resolution                 | Tenant ADMIN, linked property OWNER or contract-linked RENTER, with a mandatory reason       |

RENTER uses `finish` for direct finalization instead of the team's `confirm` action. AGENT cannot confirm or contest resolution. A contract-linked RENTER can contest an accessible, non-archived ticket only while it is `AGUARDANDO_CONFIRMACAO`, regardless of who opened the ticket. Contestation changes the status to `CONTESTADO` and records the reason, author and status transition in the activity history. Other status-management permissions remain restricted.

## Deferred work

Legacy tickets without a linked contract and archived tickets remain restricted to the tenant ADMIN. ADMIN can explicitly associate a legacy ticket with a contract of the same tenant and property through `linkContract`, including resolved and archived tickets. This preserves lifecycle data and records the previous/new association and author in the history. Access after association follows the selected contract; archived tickets remain ADMIN-only until restored. Archived read access and preservation of historical membership remain separate deliveries. Current access is evaluated using the existing contract and property links; this delivery does not create membership snapshots.
