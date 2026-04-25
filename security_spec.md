# Security Specification - JB Healthcare

## 1. Data Invariants
- A Profile can only be created by the authenticated user with their own UID.
- Users cannot change their own `role` or `status` after creation (only Admin can).
- Orders must belong to the authenticated user.
- Prescriptions can only be created by Doctors and read by the Patient or the Doctor.
- Doctors, Hospitals, and LabTests are read-only for Patients/Anonymous, write-only for Admin.
- Settings are read-only for everyone, write-only for Admin.

## 2. The "Dirty Dozen" Payloads (Red Team)

### Payload 1: Identity Spoofing in Profiles
```json
// Collection: profiles
// Action: create
// Attack: Setting a different UID than current auth.uid
{ "id": "attacker-uid", "full_name": "Spoofed User", "role": "ADMIN", "status": "active" }
```
**Expected: PERMISSION_DENIED**

### Payload 2: Privilege Escalation in Profiles
```json
// Collection: profiles
// Action: update
// Attack: User trying to promote themselves to ADMIN
{ "role": "ADMIN" }
```
**Expected: PERMISSION_DENIED**

### Payload 3: Resource Poisoning in Orders
```json
// Collection: orders
// Action: create
// Attack: Injecting massive string to exhaust resources
{ "item_name": "A".repeat(1000000), "amount": 100, "status": "pending" }
```
**Expected: PERMISSION_DENIED**

### Payload 4: Orphaned Write in Orders
```json
// Collection: orders
// Action: create
// Attack: Creating an order for a non-existent user
{ "user_id": "non-existent-user", "item_name": "Test", "amount": 50, "status": "pending" }
```
**Expected: PERMISSION_DENIED**

### Payload 5: Unauthorized Access to Private Data
```json
// Collection: prescriptions
// Action: get
// Attack: Random user trying to read someone else's prescription
// targetId: some-other-patient-prescription
```
**Expected: PERMISSION_DENIED**

### Payload 6: Field Injection in Prescriptions
```json
// Collection: prescriptions
// Action: create
// Attack: Patient trying to write their own prescription
{ "patient_id": "my-uid", "doctor_id": "some-doctor", "medicines": "Morphine" }
```
**Expected: PERMISSION_DENIED (unless user role is DOCTOR)**

### Payload 7: Mutation of Immutable Fields
```json
// Collection: orders
// Action: update
// Attack: Changing the createdAt timestamp
{ "created_at": "2020-01-01T00:00:00Z" }
```
**Expected: PERMISSION_DENIED**

### Payload 8: Status Skipping in Orders
```json
// Collection: orders
// Action: update
// Attack: User trying to verify their own payment
{ "status": "verified" }
```
**Expected: PERMISSION_DENIED (Only Admin/System can verify)**

### Payload 9: Global Read Leak (Query Scraping)
```json
// Collection: profiles
// Action: list
// Attack: Listing all users without a where clause (Blanket Read)
```
**Expected: PERMISSION_DENIED (Must restrict to own profile)**

### Payload 10: ID Poisoning
```json
// Collection: doctors
// Action: get
// Attack: Injecting 1KB junk string as ID
// targetId: "A".repeat(1024)
```
**Expected: PERMISSION_DENIED**

### Payload 11: Self-Assignment of Verified Status
```json
// Collection: profiles
// Action: create
// Attack: Setting status to 'active' manually if the system requires moderation
{ "id": "my-uid", "full_name": "Me", "role": "PATIENT", "status": "active" }
```
**Expected: PERMISSION_DENIED (if default is pending)**

### Payload 12: Admin Claim Spoofing
```json
// Collection: settings
// Action: update
// Attack: User trying to write to settings by pretending to be admin via payload field
{ "isAdmin": true, "value": "pwned" }
```
**Expected: PERMISSION_DENIED**
