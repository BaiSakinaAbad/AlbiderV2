# Albider

**A QR-Based Student Pick-up Management System** Developed for **New Era University - College of Computer Studies** (Free Elective 2: Technopreneurship).

---

## About the Project
**Albider** is a centralized, digital QR-based management system designed to secure and streamline the student dismissal process. It replaces traditional manual logbooks and easily forged physical fetching cards with a fast, role-based digital interface. 

By bridging the communication gap between classroom faculty and gate security, Albider ensures that only verified parents and authorized guardians can complete the pick-up process, effectively reducing campus security vulnerabilities and minimizing gate congestion.

---

## Key Features
* **Dynamic QR Code Protocol:** Generates unique QR codes for verified parents/guardians to ensure fraud-resistant pick-ups.
* **Role-Based Access Control (RBAC):** Tailored dashboards and functionalities for Superadmins, Faculty, and Security Personnel.
* **Real-Time Status Tracking:** Live syncing of student statuses (e.g., "Waiting for Pick-up" vs. "Picked Up").
* **Fast-Scan Security Interface:** Tablet/Mobile-optimized interface featuring a large "Start Scanning" UI for rapid gate dispatching.
* **Comprehensive Audit Trail:** Automated system logs and scan history for emergency tracing and accountability.

---

## User Roles
1. **Superadmin (NEU Admin):** Oversees the entire system, manages staff accounts, and views real-time data analytics and complete audit logs.
2. **Faculty:** Manages their specific classroom rosters, monitors which students are waiting, and generates/distributes QR codes to parents.
3. **Security:** Utilizes a streamlined interface at the campus gates to scan parent QR codes and verify identities instantly.

---

## System Architecture & Workflows

Albider operates on a centralized database that syncs in real-time across three distinct user roles. Below is the breakdown of features per user:

### 1. Superadmin (Institutional Admin)
* **System Overview:** High-level dashboard showing total students, fetched students, and those currently waiting.
* **User Management:** Full CRUD (Create, Read, Update, Delete) access to manage Faculty and Security personnel accounts.
* **Audit Logs:** Access to system-wide activity logs for security and accountability.

### 2. Faculty (Teachers/Advisers)
* **Classroom Dashboard:** Class-specific overview of student statuses.
* **Student Management:** Ability to add, edit, or remove student and guardian records.
* **QR Code Generation:** Assigns unique QR codes to authorized guardians, with options to view and download the QR codes for distribution.

### 3. Security (Gate Personnel)
* **Live Dashboard:** Real-time monitoring of today's pick-up statuses.
* **QR Scanner:** Primary interface to scan a guardian's QR code, validate their identity, and instantly update the student's status to "Picked Up".
* **Scan History:** A digital log of all fetched records for the current day.