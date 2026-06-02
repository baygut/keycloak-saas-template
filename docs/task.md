# Technical Assignment - React Developer

## Project Overview

We are developing a new Frontend Framework that provides a modular, customizable, secure, and high-performance structure tailored for our enterprise needs.

This assignment aims to assess your ability to work with SSR/CSR optimizations, authentication and authorization mechanisms, and observability solutions within our framework.

## Problem Statement

Our current frontend framework faces challenges in:

**SSR & CSR Optimization** – Reducing hydration time, improving lazy loading, and defining an effective pre-rendering strategy.

**Authentication & Authorization** – Integrating Keycloak for authentication, session management, protected routes, and role/group-based authorization.

**Observability and Error Tracking** – Ensuring robust tracing, logging, error handling, and performance monitoring.

## Detailed Scenario

**Admin Dashboard with Multiple Resources** - Create an admin dashboard that includes at least two distinct protected resources: `admin_restricted` and `user_restricted`.

**Keycloak Authentication** - Users must authenticate through Keycloak before accessing the dashboard. The application should handle login, logout, session management, token handling, and expired sessions.

**Role/Group-Based Authorization** - Access to resources should be controlled using Keycloak roles or groups.

- Users with the `admin` role can access `admin_restricted` resources.
- Users with the `user` role can access `user_restricted` resources.
- Users without the required role should be redirected or shown a forbidden state.

**Backend/BFF Authorization Validation** - Frontend checks may be used for UI visibility, but sensitive authorization decisions must also be validated through a backend or BFF layer.

**Optional Fine-Grained Access Control** - As a bonus, OpenFGA can be integrated to demonstrate resource-level authorization beyond Keycloak roles, such as ownership-based access, temporary access, or permission revocation.

## Requirements

Optimize SSR & CSR transitions by implementing:

- Lazy loading and progressive hydration techniques.
- Server-side rendering (SSR) and static site generation (SSG) strategies.

Integrate Keycloak for authentication and authorization:

- Implement login/logout flow.
- Handle access tokens and expired sessions.
- Protect dashboard routes.
- Read user roles or groups from Keycloak claims.
- Implement role/group-based access control.
- Validate protected API access on the backend or BFF layer.

Implement Observability and Error Handling:

- Provide structured logging for frontend events.
- Handle API, authentication, and authorization errors.
- Add error boundaries.
- Add basic performance or route transition monitoring.
- OpenTelemetry can be used, but it is not mandatory.

Bonus: Integrate OpenFGA for fine-grained authorization:

- Define a simple authorization model.
- Demonstrate resource-level permission checks.
- Support ownership-based, temporary, or revoked access scenarios.
- Keep Keycloak responsible for authentication and OpenFGA responsible for fine-grained authorization.

## Expected Deliverables

A repository containing your implementation, including:

- Optimized SSR/CSR handling.
- Keycloak authentication and authorization integration.
- Protected `admin_restricted` and `user_restricted` resources.
- Backend or BFF-side authorization validation.
- Logging and observability setup.
- Documentation explaining:
  - Your approach to SSR/CSR optimizations.
  - Your Keycloak authentication and authorization model.
  - Your observability and error handling mechanisms.
  - Any assumptions or trade-offs.
- Test cases validating authentication, authorization, rendering behavior, and error handling.

Bonus deliverables:

- OpenFGA authorization model.
- Resource-level permission checks.
- Temporary access or permission revocation example.

## Evaluation Criteria

- Effectiveness of SSR & CSR optimization strategies.
- Correctness of Keycloak authentication and authorization integration.
- Secure backend/BFF-side authorization validation.
- Clarity and completeness of documentation.
- Code quality: readability, modularity, maintainability.
- Adequacy of test coverage and functionality verification.
- Bonus: OpenFGA integration for fine-grained authorization.

## Submission Guidelines

Please provide a GitHub repository link with your complete solution, including all code, documentation, setup instructions, and test cases.

## Duration

You have 5 days to complete this assignment.

If you have any questions, please reach out to us at `muhammed@keymate.io` and `eren@keymate.io`.
