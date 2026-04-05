# Group Seat Reservations

## Goal

Allow group therapies to track reserved seats that are not yet assigned to an official patient record. Reservations should count against group capacity and the public homepage ad, but they must remain convertible into a real participant later once the person has completed the intro-call flow and exists as a patient.

## Requirements

- Therapists can reserve one or more seats in a group without selecting a patient.
- Reserved seats count toward the group's occupied seats and reduce the number of free seats.
- Therapists can later convert a reservation into a concrete patient participation without losing the seat.
- Converting a reservation into a patient should create the same future payment rows as directly adding a participant.
- Reservations must not create patient history, billing, or group-session payment rows before a real patient is assigned.
- The homepage group ad must use occupied seats = active participants + active reservations.

## Out Of Scope

- Public self-service reservation of group seats
- Automatic conversion from intro-call bookings into group reservations
- Payment handling for unnamed reservations
