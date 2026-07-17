# Product Requirements Document (PRD): Full Stack Authentication

## 1. Overview & Scope
**The Goal:** Build a secure system for users to create accounts, log in, and securely access protected resources using a token-based architecture.

### 1.1 Core Features (MVP)
- [x] **User Registration:** Secure account creation.
- [x] **Email Verification:** Verify user's email before allowing login (send verification mail on signup).
- [x] **User Authentication:** Login functionality verifying credentials.
- [x] **Session Management:** Keep users logged in securely using short-lived Access Tokens and long-lived Refresh Tokens.
- [x] **Secure Logout:** Invalidate sessions and clear credentials from the client.
- [x] **Forget Password:** send mail to the user for forget password. 

### 1.2 Out of Scope (V1)
- Third-party OAuth (Google, GitHub, etc.).
- Rate Limiting

---

## 2. User Journey & Flows

### 2.1 Registration (Signup) Flow
1. User submits `name`, `email` and `password` via the client interface.
2. Client performs basic input format validation.
3. Request is transmitted to the backend server.
4. Validate the incoming data on the server using middleware with a library (joi)
5. Server verifies the user does not already exist (search user in DB).
6. Server securely hashes the password (using Bcrypt).
7. Server saves the new user record to the database with `is_verified: false`.
8. Server creates an email verification token (raw and hashed).
9. Server sets the hashed token and token expiry (e.g., 24 hours) in the user's DB record and saves the changes.
10. Server sets up a `verificationUrl` with the raw token
    `http://localhost:4000/verify-email/${rawToken}`
11. Server sends a mail to the user with the verificationUrl.
12. Server returns a `201 User Created Successfully` success response with a message to check their email for verification.

### 2.2 Email Verification Flow
1. User clicks the link received in their email (`http://localhost:4000/verify-email/${rawToken}`).
2. Client routing captures the `:token` from the URL and sends a `POST` request to `/api/auth/verify-email/:token`.
3. Server hashes the raw token extracted from `req.params.token`.
4. Server searches the database for a user who has that exact hashed token saved in their record AND checks if the token expiration time is still greater than `Date.now()`.
5. If no user is found or the time has expired, server throws a `400 Bad Request` error ("Invalid or expired verification token").
6. If the token is valid, server sets `is_verified` to `true` in the user's record.
7. Server explicitly sets the verification token and verification token expiry fields to `undefined` or `null` so the token cannot be used again.
8. Server saves the database changes.
9. Server returns a `200 OK` success message ("Email verified successfully"), and the frontend redirects the user to the Login page.

### 2.3 Resend Verification Email Flow
1. If the token expired or the mail was lost, user enters their email and sends a POST req on `/resend-verification`.
2. Validations on the req.body that the email meets the requirement/criterias (using joi middleware).
3. Find user by email in DB. If user not found throw error.
4. If the user is already verified (`is_verified: true`), return a message that the account is already verified.
5. Create a new verification token (raw and hashed).
6. Set the hashed token and new token expiry in the DB and save the changes.
7. Send a mail to the user with the new verificationUrl.
8. Return a success message that the verification email is sent.

### 2.4 Authentication (Login) Flow
1. User submits credentials (`email` and `password`).
2. Server validates the req.body if the credential meet the requirement/criteria using middleware with joi
3. Server retrieves the user record from the database.
4. Server checks if `is_verified` is `true`. If not, throw a `403 Forbidden` error ("Please verify your email before logging in").
5. Server compares the hashed password against the submitted password.
6. Upon match, Server generates two JWTs:
   - **Access Token:** Short lifespan (e.g., 15 minutes), sent in the JSON response.
   - **Refresh Token:** Long lifespan (e.g., 7 days), attached as an `httpOnly` secure cookie and store in DB in hashed form.
7. Client stores the Access Token in memory for subsequent requests.
8. return the user object and access token 

### 2.5 Authorization & Session Maintenance
1. Client attaches the Access Token to the `Authorization` header for protected routes.
2. Server validates the Access Token and grants access to the resource.
3. **If Access Token expires:** Client calls the refresh endpoint; Server validates the `httpOnly` Refresh Token cookie and issues a new Access Token.

### 2.6 Refresh flow
1. when the access token is expired, then wee will send a req on /refresh route
2. In controller we will retrive the refresh token from the cookie in req object
3. verify if the token is created using our JWT secret
4. find the user from the id we have passed in the payload of the token If user not found throw error
5. now check if the refreshToken is same as the one in DB (hash it before checking)
6. if token is same then generate new access and refresh token
7. save refresh token in DB (hashed token)
8. save the refresh token in the cookie
9. save DB chnages and return to user with userObj, access token

### 2.7 Forgot password flow
1. user enter email and then send a POST req 
2. Validations on the req.body that the email  meet the requirement/criterias (in route layer)
3. find user by email in DB
4. create resetPassword token (raw and hashed)
5. set the hashed token and the token expiry in the DB and save the changes of DB
6. set up a 'resetPasswordUrl' with raw token
   `http://localhost:4000/reset-password/${rawToken}`
7. send a mail to the user with the resetPasswordUrl
8. return a success message that email is sent
9. User clicks the link received in their email (`http://localhost:4000/reset-password/${rawToken}`).
10. Client routing captures the `:token` from the URL and displays a form asking for a `newPassword`.
11. User submits the new password, which sends a `POST` request to `/api/auth/reset-password/:token` with the new password in the body.
12. Server validates the incoming `req.body` to ensure the new password meets security requirements (using Joi middleware).
13. Server hashes the raw token extracted from the `req.params.token`.
14. Server searches the database for a user who has that exact hashed token saved in their record AND checks if the token expiration time is still greater than `Date.now()`.
15. If no user is found or the time has expired, server throws a `400 Bad Request` error ("Invalid or expired token").
16. If the token is valid, server securely hashes the `newPassword` (using Bcrypt).
17. Server updates the user's `password_hash` with the new hashed password.
18. Server explicitly sets the reset token and reset token expiry fields in the user's database record to `undefined` or `null` to prevent the token from being used again.
19. Server saves the database changes.
20. Server returns a `200 OK` success message ("Password reset successfully"), and the frontend redirects the user to the Login page.

### 2.8 logout password flow
1. user send a blank body request but a access token in the searer token
   section inside authorization section (in postman)
   the token is stored in this format ("Bearer TOKENVALUE")
2. we will hit the 'authenticate' middleware
3. there we will extract the bearer token (access token)
   which is stored in the form ("Bearer TOKENVALUE")

4. verify the accessToken using our verificationAccessToken function
   created in the utils
5. get the user by the id we send in the payload of the token
   if no user found throw error
6. update the req.user field withthe extracted user
   so that the next function know which user to target
   and call next()
7. now in service extract the user with the userId from DB (we get it from user we updated in req.user)
   and update refresh token to null in user
   if user not found send error
8. Server clears the refreshToken cookie from the client's browser.
9. return a success message that user is logged-out

---

## 3. Technical Architecture

| Component | Technology                                                                                  |
| :--- |:--------------------------------------------------------------------------------------------|
| **Frontend** | React, Tailwind                                                                             |
| **Backend** | Node.js with Express                                                                        |
| **Database** | MongoDB (via Mongoose)                                                                      |
| **Security/Auth** | `bcrypt` (password hashing), `jsonwebtoken` (JWT generation), `ZOD` (credential validation) |
| **Email Service** | `nodemailer` (sending verification & password reset mails), SMTP provider (e.g., Mailtrap for dev, SendGrid/Resend for prod) |

---

## 4. Data Model / Schema

### Entity: `Users`
This schema tracks user credentials and active sessions.

| Field                         | Type                            | Attributes | Description                        |
|:------------------------------|:--------------------------------| :--- |:-----------------------------------|
| `id`                          | Unique identifier for the user. |
| `name`                        | User name                       |
| `email`                       | String                          | Unique, Not Null | Used for login and identification. |
| `password_hash`               | String                          | Not Null | Cryptographically hashed password. |
| `is_verified`                 | Boolean                         | Default: false | Whether the user has verified their email. |
| `verification_token_hash`     | String                          | Nullable | Hashed email verification token. |
| `verification_token_expiry`   | Date                            | Nullable | Expiry time for the verification token. |
| `refresh_token_hash`          | String                          | Nullable | Tracks the current active session. |
| `reset_token_hash`            | String                          | Nullable | Hashed password reset token. |
| `reset_token_expiry`          | Date                            | Nullable | Expiry time for the reset token. |
| `created_at`                  | Timestamp                       | Auto-generated | Record creation date.              |
| `updated_at`                  | Timestamp                       | Auto-generated | Record updation date.              |

---

## 5. API Specifications (The Contract)

### 5.1 Register User
- **Endpoint:** `POST /api/auth/register`
- **Description:** Creates a new user account and sends a verification email.
- **Request Body:** 
  ```json
  {
    "name" : "user"
    "email": "user@example.com",
    "password": "securepassword123"
  }

### 5.2 Verify Email
- **Endpoint:** `POST /api/auth/verify-email/:token`
- **Description:** Verifies the email verification token and marks the user as verified.
- **Request Parameters:** `token` (in the URL).
- **Request Body:** none

### 5.3 Resend Verification Email
- **Endpoint:** `POST /api/auth/resend-verification`
- **Description:** Resends the verification mail if the token expired or mail was lost.
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }

### 5.4 Login User
- **Endpoint:** `POST /api/auth/login`
- **Description:** logging in the user account (only allowed if email is verified).
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }

### 5.5 refresh 
- **Endpoint:** `POST /api/auth/refresh`
- **Description:** when the access token is expired, then wee will send a req on /refresh route.
- **Request Body:**
  ```refresh token from cookie

### 5.6 Forgot password
- **Endpoint:** `POST /api/auth/forgot-password`
- **Description:** when the user forgets the password then they can reset it using this.
- **Request Body:**
  ```email

### 5.7 logout password
- **Endpoint:** `POST /api/auth/logout`
- **Description:** when the user want to logout from the website.
- **Request Body:**
  ```access token as bearer token

### 5.8 Reset Password
- **Endpoint:** `POST /api/auth/reset-password/:token`
- **Description:** Verifies the reset token and updates the user's password.
- **Request Parameters:** `token` (in the URL).
- **Request Body:**
  ```json
  {
    "newPassword": "newsecurepassword123"
  }