# KlinikHub

**A Modern Clinic Management Platform**

KlinikHub is a clinic management platform designed to streamline healthcare operations and improve the experience of both clinic staff and patients.

The project brings together three applications in a single repository: a backend API, a clinic administration dashboard, and a patient-facing web application.

My primary responsibility was developing the frontend applications from the ground up, contributing to frontend architecture decisions, and collaborating directly with the backend team to build an integrated and user-friendly platform.

---

## Overview

KlinikHub provides an integrated environment for managing clinic operations, appointments, patients, doctors, and healthcare services.

The platform consists of three interconnected applications:

### Applications

| Application | Description |
|---|---|
| **Klinik Server** | Backend API responsible for application data, business logic, authentication, and core services. |
| **Klinik Dashboard** | Administration interface for managing clinic operations, appointments, patients, doctors, services, and settings. |
| **Klinik Patient** | Patient-facing application for exploring clinic services and accessing appointment-related features. |

---

## My Role & Contributions

**Frontend Developer | Frontend Architecture & UI/UX**

I was responsible for developing the frontend applications from scratch, working closely with the backend development team throughout the project.

My involvement went beyond implementing user interfaces. I also contributed to frontend architecture decisions, application structure, and the overall user experience.

My main contributions included:

- **Frontend Architecture:** Contributed to defining the frontend architecture, project structure, component organization, and development approach.
- **Frontend Development:** Built the dashboard and patient-facing applications from the ground up using Next.js, React, and TypeScript.
- **Backend Collaboration:** Worked directly with backend developers to coordinate API requirements, data structures, authentication flows, and frontend-backend integration.
- **UI/UX Design Decisions:** Focused on creating interfaces that are visually appealing, logically structured, easy to navigate, and practical for everyday use.
- **Component Development:** Developed reusable UI components and maintained consistency across different sections of the applications.
- **Responsive Design:** Implemented responsive layouts to support different screen sizes and devices.
- **Application Usability:** Considered the needs of different user roles, aiming to make clinic management tasks and patient interactions more intuitive and efficient.

One of my main priorities was finding the right balance between visual quality, usability, and functionality — ensuring that the platform was not only attractive but also practical and easy to use in real-world healthcare environments.

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
- Organized administrative workflows

### Patient Application

- Browse clinic services
- Explore available healthcare services
- Appointment booking experience
- Patient account and appointment management
- Multilingual interface
- Responsive user experience

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
| Version Control | Git, GitHub |

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
