# Security Specification: Korlyn and Helolex Hub

This specification outlines the security constraints and data integrity invariants for the Firestore database, modeling threats against the database and specifying tests to verify zero-trust posture.

## 1. Data Invariants

1. **Authentication Rule**: No unauthenticated writes are allowed. Users may only interact with resources they own, or via explicitly specified flows.
2. **Admins Rule**: Admins can override, read, and write any records. Admin status is verified by document lookup at `/admin_settings/admin_passcode` (or using a dedicated admins collection, but here we can check the passcode or verify access based on a secure structure). Wait, the codebase checks for `admin_passcode` value as a way to gate admin access on the client. On the backend, we will check whether the admin passcode matches or restrict global edits.
3. **UserAccount Invariants**:
   - `phone` must be a valid E.164 phone number.
   - `created_at` must be immutable and set to the server timestamp `request.time`.
   - `points`, `clicks_count`, `registrations_count`, and `purchases_count` must be non-negative integers.
   - A user profile can only be created or modified by the user themselves (or an admin).
4. **Payment Invariants**:
   - `id` must be a valid unique transaction code.
   - `submitted_at` must be a string and is immutable once created.
   - `status` can only transition through `pending` -> `approved` or `pending` -> `rejected`. Once in a terminal status (`approved` or `rejected`), it is locked and cannot be updated.
   - `amount` must be a valid amount format (e.g., `₦25,000` or `₦100,000`).
5. **PII Protection**: Both `users_account` and `payments` collections contain PII (emails and phone numbers). Therefore, a user can only read their own user account or their own payments unless they are authenticated as an administrator.

---

## 2. The "Dirty Dozen" Hostile Payloads

Below are twelve malicious payloads designed to breach identity, integrity, and state transition laws:

### Payload 1: PII Data Harvester (Breaching PII isolation)
- **Target**: `GET /users_account/+2348031124589`
- **Attacker**: Authenticated as `user_malicious`
- **Objective**: Direct read access to another user's profile containing their phone and email.
- **Expected Outcome**: `PERMISSION_DENIED`

### Payload 2: Fraudulent Point Injector (Self-incrementing referral points)
- **Target**: `UPDATE /users_account/+2348011111111`
- **Attacker**: Authenticated as `user_malicious` (phone matching target)
- **Payload**:
  ```json
  {
    "points": 999999
  }
  ```
- **Objective**: Granting themselves infinite points.
- **Expected Outcome**: `PERMISSION_DENIED`

### Payload 3: Status Hijack - Self License Approval (Approving pending payment)
- **Target**: `UPDATE /payments/TXN-4109-M`
- **Attacker**: Authenticated as user who submitted payment
- **Payload**:
  ```json
  {
    "status": "approved",
    "ownership_id": "HLX-99999",
    "issue_date": "2026-07-01"
  }
  ```
- **Objective**: Skip admin verification to self-approve a license.
- **Expected Outcome**: `PERMISSION_DENIED`

### Payload 4: Rogue System Config Overwrite (Altering bank details)
- **Target**: `UPDATE /admin_settings/bank_details`
- **Attacker**: Unprivileged user
- **Payload**:
  ```json
  {
    "value": "{\"bankName\":\"Rogue Bank\",\"accountName\":\"Attacker Corp\",\"accountNumber\":\"9999999999\"}"
  }
  ```
- **Objective**: Divert user payments to attacker's bank account.
- **Expected Outcome**: `PERMISSION_DENIED`

### Payload 5: Creation Timestamp Spoofing (Forged registration date)
- **Target**: `CREATE /users_account/+2348022222222`
- **Attacker**: Registered user
- **Payload**:
  ```json
  {
    "phone": "+2348022222222",
    "created_at": "1999-01-01T00:00:00Z"
  }
  ```
- **Objective**: Spoof history to manipulate loyalty rewards or dates.
- **Expected Outcome**: `PERMISSION_DENIED`

### Payload 6: ID Poisoning (Resource Exhaustion)
- **Target**: `CREATE /payments/TXN-VERY-LONG-ID-CONTAINING-JUNK-CHARACTERS-THAT-EXCEEDS-128-BYTES-AND-USES-SPECIAL-CHARS-$$$$$$`
- **Attacker**: Registered user
- **Payload**:
  ```json
  {
    "id": "TXN-VERY-LONG-ID-CONTAINING-JUNK-CHARACTERS-THAT-EXCEEDS-128-BYTES-AND-USES-SPECIAL-CHARS-$$$$$$",
    "email": "attacker@spam.org",
    "phone": "+2348033333333",
    "receipt_name": "receipt.png",
    "receipt_data_url": "https://malicious.url",
    "status": "pending",
    "submitted_at": "2026-07-01T15:51:00Z",
    "amount": "₦25,000"
  }
  ```
- **Objective**: Force database index storage bloat.
- **Expected Outcome**: `PERMISSION_DENIED`

### Payload 7: Terminal State Unlock (Re-submitting a rejected payment)
- **Target**: `UPDATE /payments/TXN-0129-Z` (Already `rejected`)
- **Attacker**: User of payment `TXN-0129-Z`
- **Payload**:
  ```json
  {
    "status": "pending"
  }
  ```
- **Objective**: Override a definitive reject status.
- **Expected Outcome**: `PERMISSION_DENIED`

### Payload 8: Anonymous Identity Spoofing (Setting email to an unverified address)
- **Target**: `CREATE /users_account/+2348044444444`
- **Attacker**: Anonymous user or unverified user
- **Payload**:
  ```json
  {
    "phone": "+2348044444444",
    "email": "admin@helolex.com",
    "created_at": "2026-07-01T15:51:00Z"
  }
  ```
- **Objective**: Registering without verifying email.
- **Expected Outcome**: `PERMISSION_DENIED`

### Payload 9: Rogue Referral Point Incrementor (Updating click details of another user)
- **Target**: `UPDATE /users_account/+2348031124589` (Another user's profile)
- **Attacker**: Malicious user `+2348011111111`
- **Payload**:
  ```json
  {
    "points": 100
  }
  ```
- **Objective**: Tamper with other users' points data.
- **Expected Outcome**: `PERMISSION_DENIED`

### Payload 10: Ghost Field Injection (Shadow updates to pass records)
- **Target**: `UPDATE /payments/TXN-9021-X`
- **Attacker**: Malicious user
- **Payload**:
  ```json
  {
    "ghost_field": "unlocked_premium_mode"
  }
  ```
- **Objective**: Inject non-schema attributes to exploit client-side vulnerabilities.
- **Expected Outcome**: `PERMISSION_DENIED`

### Payload 11: Immature Timestamp Update (Zero latency spoof)
- **Target**: `UPDATE /users_account/+2348011111111`
- **Attacker**: Malicious user
- **Payload**:
  ```json
  {
    "created_at": "2030-01-01T00:00:00Z"
  }
  ```
- **Objective**: Force created_at to bypass immutability constraint.
- **Expected Outcome**: `PERMISSION_DENIED`

### Payload 12: Insecure List Scraper (Query scraping)
- **Target**: `LIST /payments` (With query `where('status', '==', 'approved')`)
- **Attacker**: Ordinary non-admin user
- **Objective**: Retrieve payments of all other users.
- **Expected Outcome**: `PERMISSION_DENIED` (Unless query is securely restricted by owner phone)

---

## 3. Test Suite Runner Mock Verification

The security rules must be formulated to address all 12 threats.
These tests are verified against the static rules definition through dry-run validation.
