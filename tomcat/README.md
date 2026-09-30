# ApexPOS Server Infrastructure: Node.js & Apache Tomcat

This project provides dual-stack server capabilities:
1. **Node.js Express Server** (`server.ts`): High-performance modern backend and development server hosting REST APIs on port 5173.
2. **Apache Tomcat Application Server** (`tomcat/`): Jakarta EE / Java Servlet 5.0 / 6.0 & JSP container running with MySQL database pool.

---

## 1. Node.js Express Server (Port 5173)

### Development Mode
```bash
npm run dev
```
Starts `server.ts` using `tsx`. In development mode, it mounts Vite middleware for Hot Module Replacement and static asset serving, while simultaneously serving RESTful endpoints under `/api/*`.

### Production Build & Launch
```bash
npm run build
npm start
```
- `npm run build`: Compiles the frontend via Vite into `dist/` and bundles `server.ts` into a self-contained CommonJS artifact `dist/server.cjs` using `esbuild`.
- `npm start`: Runs `node dist/server.cjs` in production.

### Core REST Endpoints
- `GET /api/health` - Server health status and uptime
- `GET /api/system-info` - Node.js environment, memory metrics, and active service statuses
- `GET /api/products` - List products with optional search query
- `POST /api/products` - Create new inventory item
- `POST /api/sales` - Process sales order & decrement inventory
- `GET /api/tomcat/status` - Status of Tomcat Catalina engine
- `POST /api/tomcat/control` - Start, Stop, Restart, and Reload Tomcat
- `GET /api/tomcat/logs` - Live stream of `catalina.out` and access logs
- `POST /api/tomcat/invoke` - Execute live HTTP requests to Java Servlets

---

## 2. Apache Tomcat 10 Application Server (Port 8080)

### Architecture
- **Catalina Engine**: Deploys the POS WAR application under context path `/pos`.
- **Servlets**:
  - `AuthServlet`: `/auth`, `/login`, `/logout`
  - `ProductServlet`: `/products`
  - `CategoryServlet`: `/categories`
  - `CustomerServlet`: `/customers`
  - `SalesServlet`: `/sales`, `/pos/checkout`
  - `InvoiceServlet`: `/invoice`
  - `StockServlet`: `/stock`
  - `ReportServlet`: `/reports`
- **Filter**: `AuthFilter` protects `/pos/*`, `/dashboard/*`, etc.
- **Data Source**: JNDI Resource `jdbc/pos_inventory_db` configured in `conf/server.xml` and `conf/context.xml`.

### Running Tomcat with Docker Compose (Recommended)
```bash
cd tomcat
docker compose up -d
```
This boots:
1. `mysql-db`: MySQL 8.0 on port 3306 with database `pos_inventory_db`.
2. `tomcat-app`: Apache Tomcat 10.1 on port 8080.

Access Tomcat webapp at: `http://localhost:8080/pos`

### Building WAR File with Maven
```bash
mvn clean package
```
Generates `target/pos_inventory.war`.

### Running with Standalone Tomcat
1. Set `CATALINA_HOME` environment variable to your Tomcat directory:
   ```bash
   export CATALINA_HOME=/opt/apache-tomcat-10.1.20
   ```
2. Run the provided runner script:
   - On Linux/macOS: `./tomcat/run-tomcat.sh`
   - On Windows: `.\tomcat\run-tomcat.bat`
