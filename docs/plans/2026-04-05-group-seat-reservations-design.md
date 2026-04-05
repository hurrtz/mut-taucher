# Group Seat Reservations Design

## Data Model

- Add a new `group_reservations` table keyed by group.
- Keep reservations separate from `group_participants` so unnamed seats do not leak into billing, patient history, workbook targeting, or document workflows.
- Expose `reservationCount` and `occupiedCount` in group responses.

## Backend Flow

- `POST /api/admin/groups/:id/reservations`: create one reservation if capacity remains.
- `DELETE /api/admin/groups/:id/reservations/:reservationId`: release a reserved seat.
- `POST /api/admin/groups/:id/reservations/:reservationId/fill`: delete the reservation and add/reactivate the chosen patient as a participant in one transaction.

## Frontend Flow

- Extend the group manager participant section into a combined participant/reservation seat manager.
- Show active participants and active reservations separately, but derive progress and free-seat text from `occupiedCount`.
- Let the therapist either add a real patient directly or reserve a seat.
- Let the therapist convert any reservation into a patient using the same patient list used for direct adds.

## Public Homepage Ad

- Continue using the single active homepage group.
- Derive remaining seats from `maxParticipants - occupiedCount`.
