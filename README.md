# KlinikHub

**A Modern Clinic Management Platform**

KlinikHub is a clinic management platform designed to streamline healthcare operations and improve the experience of both clinic staff and patients.

The project brings together three applications in a single repository: a backend API, a clinic administration dashboard, and a patient-facing web application.

---

## Overview

KlinikHub provides an integrated environment for managing clinic operations, appointments, patients, doctors, and healthcare services.

### Applications

| Application | Description |
|---|---|
| **Klinik Server** | Backend API responsible for application data, business logic, authentication, and core services. |
| **Klinik Dashboard** | Administration interface for managing clinic operations, appointments, patients, doctors, services, and settings. |
| **Klinik Patient** | Patient-facing application for exploring clinic services and accessing appointment-related features. |

---

## Project Structure

```text
kilinik-hub/
│
├── klinik-server/
│   ├── prisma/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
│
├── klinik-clients/
│   │
│   ├── klinik-dash/
│   │   ├── src/
│   │   ├── messages/
│   │   └── package.json
│   │
│   └── klinik-patient/
│       ├── src/
│       ├── messages/
│       └── package.json
│
└── README.md
```

---

## Key Features

### Clinic Dashboard
- Appointment management
- Patient management
- Doctor availability management
- Medical services and specialties management
- Clinic user management
- Clinic profile and settings
- Multilingual interface

### Patient Application
- Browse clinic services
- Explore available healthcare services
- Appointment booking experience
- Patient account and appointment management
- Multilingual interface

### Backend API
- RESTful API architecture
- Authentication and authorization
- Appointment and availability management
- Patient and clinic data management
- Database integration with Prisma ORM

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Backend | Node.js, TypeScript |
| Database ORM | Prisma |
| Styling | CSS |
| Internationalization | next-intl |
| Deployment Support | Docker |

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- Git
- Docker (optional, depending on your setup)

### Clone the Repository

```bash
git clone https://github.com/ho3ein81/kilinik-hub.git
cd kilinik-hub
```

### Environment Configuration

Each application may require its own environment variables.

Use the provided example files as a reference:

- `klinik-server/.env.example`
- `klinik-clients/klinik-dash/.env.local.example`
- `klinik-clients/klinik-patient/.env.local.example`

Create the required environment files and configure them before running the applications.

### Installation

Each application has its own dependencies and setup process.

Navigate to the relevant application directory and install its dependencies:

```bash
npm install
```

For application-specific scripts, configuration, and development instructions, refer to the corresponding `package.json` and README files.

---

## Repository

**GitHub:** [ho3ein81/kilinik-hub](https://github.com/ho3ein81/kilinik-hub)

## License

No license has been specified yet. All rights are reserved unless a license is added to this repository.

---

**KlinikHub — Bringing clinic operations together.**
