# DHANYA - Spring Boot 3 Backend REST API & H2 Database

🌾 **National CMR 67% Digital Reconciliation & Subsidy Clearance System**

---

## 🏗️ Architecture & Modules

This Spring Boot application provides:
1. **REST Endpoints** for Authentication, Procurement Streaming, Dispute Resolution, and Statutory Approvals.
2. **Spring Data JPA & Hibernate** mapping for Entities (`MillProfile`, `CmrRecord`, `FarmerAccount`, `AuditLog`).
3. **Embedded H2 In-Memory Database** with pre-seeded data via `schema.sql` & `data.sql`.
4. **H2 Web Console** at `http://localhost:5000/h2-console` (JDBC URL: `jdbc:h2:mem:dhanyadb`, User: `sa`, Password: empty).
5. **CORS Configuration** for seamless Angular frontend integration on `http://localhost:4200`.

---

## 🚀 How to Run the Spring Boot Backend

### Using Maven:
```bash
cd D:\DHANYA\backend
mvn clean spring-boot:run
```

### Using Jar (Package & Run):
```bash
mvn clean package
java -jar target/dhanya-backend-1.0.0.jar
```

---

## 📊 Database Tables & Sample SQL Queries

1. **View All Reconciled CMR Batches:**
   ```sql
   SELECT * FROM DHANYA_CMR_RECORDS;
   ```

2. **View Multi-Mill Profiles:**
   ```sql
   SELECT * FROM MILL_PROFILES;
   ```

3. **Check Farmer DBT Accounts:**
   ```sql
   SELECT * FROM FARMER_ACCOUNTS;
   ```

4. **Review Security Audit Trail:**
   ```sql
   SELECT * FROM AUDIT_LOGS ORDER BY TIMESTAMP DESC;
   ```
