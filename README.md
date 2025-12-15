# Backend Developer Take-Home Test (NestJS)

## Objective

This exercise is designed to assess your ability to structure a NestJS project, design clean APIs, and implement real-world backend logic without overengineering.

We are not looking for perfection — clarity, correctness, and good engineering judgment matter more.

## Tech Stack

- **NestJS**
- **TypeScript**
- In-memory storage or simple database (SQLite / Postgres optional)

## Task

Build a **simple wallet service**.

## Functional Requirements

### 1. Create Wallet

Create an API to create a wallet.

**Wallet fields:**

- `id`
- `currency` (USD)
- `balance`

### 2. Fund Wallet

Create an API to fund a wallet.

- Add a positive amount to the wallet balance
- Validate input

### 3. Transfer Between Wallets

Create an API to transfer funds between wallets.

- Prevent negative balances
- Validate sender and receiver wallets
- Handle insufficient balance errors

### 4. Fetch Wallet Details

Create an API to fetch wallet details.

- Wallet information
- Transaction history

## Validation & Error Handling

- Validate request payloads
- Return meaningful error responses
- Ensure wallet balance integrity

## Nice-to-Have (Optional)

These are optional and will be considered a bonus:

- Idempotency for fund/transfer operations
- Simple unit tests
- Brief notes on how this system would scale in production

## Submission Instructions

Please submit:

- A **GitHub repository link**
- A **README** that includes:
  - Setup instructions
  - Any assumptions made
- Postman Collection with API Endpoints
  - API endpoints

## Time Expectation

- **Estimated effort:** 4–6 hours
- **Deadline:** 24 hours from receiving the test

## Notes

- Focus on clean structure and readability
- Do not overengineer
- In-memory storage is perfectly acceptable

# Solution

# Wallet Service (NestJS + Prisma)

A simple backend service to manage wallets, fund accounts, and transfer money between users.

## Tech Stack

- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** SQLite (for easy setup)
- **ORM:** Prisma

## Setup Instructions

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. Database Setup (SQLite)
   This project uses SQLite for ease of local testing.

   ```bash
   npx prisma migrate dev --name init
   ```

3. Run the Application

   ```bash
    npm run start:dev
   ```

   The server will start at http://localhost:7400.

4. Run Tests
   ```bash
     npm run test
   ```

## API Usage

You can test the API using the provided [Postman collection](https://documenter.getpostman.com/view/20124288/2sB3dTtTNt) or via cURL.

1. **Create Wallet** -> `POST /wallets`
2. **Fund Wallet** -> `POST /wallets/:id/fund`
3. **Transfer** -> `POST /wallets/:id/transfer`
4. **Get Details** -> `GET /wallets/:id`

## Design Assumptions & Decisions

1. **Currency:** The requirements specified currency as a field, but for the scope of this test, I assumed all wallets operate in NGN. No currency conversion logic was implemented.
2. **Data Types:** I used Float for the balance to keep the schema simple for this assessment. In a real-world financial application, I would use the Decimal type (supported by Prisma/Postgres) or store values as Integers (kobo) to avoid floating-point precision errors.
3. **Concurrency:** I used database.$transaction to ensure atomicity. If a transfer fails halfway, the entire operation rolls back.
4. **Idempotency (Bonus):** I added an optional idempotencyKey to the Fund and Transfer DTOs. If a client retries a request with the same key (e.g., due to a network timeout), the server checks the database for an existing transaction with that key and returns the previous result instead of re-processing the money.

## Production Scaling Strategy

If this application were to scale to millions of users, here is how I would evolve the architecture:

1. **Database Locking:** While database.$transaction handles atomicity, high concurrency requires row-level locking. I would implement Pessimistic Locking (SELECT ... FOR UPDATE) on the sender's wallet row during a transfer to prevent race conditions (Double Spending).
2. **Async Processing:** For heavy loads, direct HTTP transfers can bottle-neck. I would move the transaction processing to a message queue (e.g., RabbitMQ or Kafka). The API would accept the request, return "Processing", and a background worker would handle the ledger updates.
3. **Database Selection:** SQLite is not suitable for production. I would migrate to PostgreSQL.
   I would implement a connection pooler (like PgBouncer) to handle thousands of concurrent connections from the NestJS serverless instances.
4. **Horizontal Scaling:** The application is stateless. We can spin up multiple instances of the NestJS app behind a Load Balancer (AWS ALB / Nginx).
