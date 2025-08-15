# EHR-System-for-PIES-Fitness-Yoga

## Overview
A full-stack Electronic Health Record (EHR) platform built for [**PIES Fitness Yoga**](https://www.piesfitnessyoga.com/), designed to help yoga therapists securely manage client records, track session histories, and complete therapy documentation efficiently.  

This project was developed as part of the **CS 5394 – Capstone Project** for the [**Virginia Tech Master of Engineering in Computer Science**](https://iac.vt.edu/masters-degrees/meng-cs.html) program. The system leverages **Spring Boot** on the backend and **Next.js** on the frontend to provide a responsive, secure, and role-based user experience.  

> **Note:** While HIPAA-aligned security practices (JWT authentication, encrypted connections, role-based access control) were implemented, full HIPAA compliance was not pursued due to constraints related to hosting, legal requirements, and audit readiness.

---

## License
This project is licensed under the [Creative Commons Attribution (CC BY 4.0) License](https://creativecommons.org/licenses/by/4.0/).

You are free to:
- **Share** — copy and redistribute the material in any medium or format  
- **Adapt** — remix, transform, and build upon the material for any purpose, even commercially  

Under the following terms:
- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.

---

## Features
- **Role-Based Access Control** – Secure therapist/admin authentication with JWT.
- **Comprehensive Forms** – Patient intake, SOAP notes, and self-assessments with conditional fields and dynamic autofill.
- **Search & Filter Tools** – Locate sessions by client name, date, or session type.
- **Data Handling** – Checkbox groups, digital signature capture, and DTO-based backend mapping.
- **Backend API** – REST endpoints for all core data entities, fully documented via Swagger/OpenAPI.
- **Responsive Frontend** – Built with Next.js, React, and Tailwind for mobile-ready access.

---

## Architecture
- frontend/ → Next.js + Tailwind CSS + react-hook-form UI
- backend/ → Spring Boot 3.5.x API + MySQL + JWT auth + Flyway migrations
- database/ → MySQL 8 in Docker with schema managed by Flyway


**Backend Tech Stack:**
- Java 17, Spring Boot, Spring Data JPA, Hibernate 6
- MySQL 8, Docker, Flyway migrations
- Spring Security 6, JWT
- springdoc-openapi (Swagger UI)

**Frontend Tech Stack:**
- Next.js (React)
- Tailwind CSS
- react-hook-form
- Axios for API calls

---

## Setup & Usage
For detailed instructions, see:
- [Backend README](./backend/README.md) – API setup, Docker instructions, database config.
- [Frontend README](./frontend/README.md) – Running the Next.js development server and building for production.

**Quick Start (Docker Compose for backend):**
```bash
cd backend
cp .env.example .env
docker compose up --build -d
```

**Quick Start (Frontend):**
```bash
cd frontend
npm install
npm run dev
```
---
## Development Timeline
- Sprint 1: Backend scaffolding, DB schema, initial UI mockups.
- Sprint 2: Backend–frontend integration for intake form, JWT authentication.
- Sprint 3: Full SOAP notes integration, data autofill from intake, bug fixes.
- Sprint 4+: Search/filter, session history, additional UI refinement.

## Future Work
- Full HIPAA-compliant deployment (cloud hosting, encryption at rest, access logging).
- Tablet-optimized UI for therapist mobility.
- Anatomy map integration.
- PDF/CSV export of session data.
- Therapist quick notes outside SOAP workflow.

---

## Authors

- **Devon Boldt** – [VTDevon](https://github.com/VTDevon)  
  Frontend development support, implemented additional UI features, and contributed to documentation.

- **Brett Noneman** – [BrettNon](https://github.com/BrettNon)  
  Primary frontend developer, responsible for building the React/Next.js interface, integrating Tailwind CSS, and implementing form logic.

- **Peyton Wiecking** – [wieckingcp23](https://github.com/wieckingcp23)  
  Full-stack integration lead, coordinated backend–frontend communication, handled API debugging, and created project documentation.

- **James Yeh** – [jamesyeh-vt](https://github.com/jamesyeh-vt)  
  Primary backend developer, designed and implemented the Spring Boot API, managed database schema and migrations, and configured security/authentication.

---
## Client

**[PIES Fitness Yoga](https://www.piesfitnessyoga.com/)**  
PIES Fitness Yoga Studio offers diverse fitness and wellness programs designed to meet the needs of every individual, regardless of fitness level or experience. From gentle yoga for flexibility and relaxation to high-energy cardio and kickboxing classes, PIES provides a wide range of options to help clients achieve their physical, mental, and spiritual wellness goals. Classes are offered seven days a week, with multiple locations and evening schedules to accommodate busy lifestyles.  

The studio emphasizes a holistic approach, conditioning the body to foster clarity of mind and spiritual growth. Whether starting with beginner-friendly yoga or progressing to advanced combination classes, PIES creates a welcoming environment for personal transformation.  

**Founder/Owner:** *Marsha Banks-Harold*  
**Project Sponsor:** *[Dr. Tessema Mindaye Mengistu](https://scholar.google.com/citations?user=x9JJf_AAAAAJ&hl=en)* — Took over as project sponsor during Sprint 4.
