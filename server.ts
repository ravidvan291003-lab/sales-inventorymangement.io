import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 5173;
const HOST = '0.0.0.0';

// In-memory data store for server-side persistence & API synchronization
let mockProducts = [
  {
    id: 'prod-1',
    name: 'Artisan Cold Brew Coffee',
    sku: 'BEV-CB-001',
    categoryId: 'cat-1',
    categoryName: 'Beverages & Drinks',
    price: 4.99,
    costPrice: 1.8,
    stock: 45,
    minStockAlert: 15,
    barcode: '8901234567890',
    description: '16oz single-origin organic cold brew with smooth dark chocolate notes',
    imageUrl: '/images/products/cold_brew.jpg',
    status: 'ACTIVE',
  },
  {
    id: 'prod-2',
    name: 'Sparkling Mineral Water',
    sku: 'BEV-WAT-002',
    categoryId: 'cat-1',
    categoryName: 'Beverages & Drinks',
    price: 2.49,
    costPrice: 0.75,
    stock: 82,
    minStockAlert: 20,
    barcode: '8901234567891',
    description: 'Naturally carbonated spring water with hints of lime',
    imageUrl: '/images/products/sparkling_water.svg',
    status: 'ACTIVE',
  },
  {
    id: 'prod-3',
    name: 'Dark Chocolate Sea Salt Bar',
    sku: 'SNK-CHO-003',
    categoryId: 'cat-2',
    categoryName: 'Snacks & Bakery',
    price: 3.99,
    costPrice: 1.2,
    stock: 6,
    minStockAlert: 12,
    barcode: '8901234567892',
    description: '72% single-origin cacao with fleur de sel crystals',
    imageUrl: '/images/products/chocolate.jpg',
    status: 'ACTIVE',
  },
  {
    id: 'prod-4',
    name: 'Wireless Bluetooth Earbuds',
    sku: 'ELE-EAR-006',
    categoryId: 'cat-4',
    categoryName: 'Electronics & Accessories',
    price: 49.99,
    costPrice: 22.0,
    stock: 14,
    minStockAlert: 8,
    barcode: '8901234567895',
    description: 'Noise-isolating earbuds with 28-hour charging case',
    imageUrl: '/images/products/earbuds.jpg',
    status: 'ACTIVE',
  },
  {
    id: 'prod-5',
    name: 'Braided USB-C Fast Cable',
    sku: 'ELE-CAB-007',
    categoryId: 'cat-4',
    categoryName: 'Electronics & Accessories',
    price: 14.99,
    costPrice: 4.5,
    stock: 50,
    minStockAlert: 15,
    barcode: '8901234567896',
    description: '6ft heavy-duty nylon braided USB-C to USB-C cable (100W)',
    imageUrl: '/images/products/usb_cable.svg',
    status: 'ACTIVE',
  },
];

let mockCategories = [
  { id: 'cat-1', name: 'Beverages & Drinks', code: 'BEV', description: 'Cold sodas, artisanal coffees, teas, and sparkling waters', color: '#3B82F6' },
  { id: 'cat-2', name: 'Snacks & Bakery', code: 'SNK', description: 'Chips, organic cookies, pastries, nuts and crackers', color: '#F59E0B' },
  { id: 'cat-3', name: 'Dairy & Eggs', code: 'DRY', description: 'Fresh milk, artisan cheeses, yogurts and farm eggs', color: '#10B981' },
  { id: 'cat-4', name: 'Electronics & Accessories', code: 'ELE', description: 'Cables, chargers, wireless headphones, and adapters', color: '#8B5CF6' },
];

let mockSales: any[] = [];
let mockAuditLogs: any[] = [];

// Simulated Apache Tomcat State
interface TomcatState {
  status: 'RUNNING' | 'STOPPED' | 'RESTARTING';
  version: string;
  catalinaBase: string;
  contextPath: string;
  httpPort: number;
  ajpPort: number;
  shutdownPort: number;
  uptimeSeconds: number;
  startTime: number;
  deployedServlets: string[];
  activeSessions: number;
  memoryUsedMb: number;
  maxMemoryMb: number;
}

const tomcatState: TomcatState = {
  status: 'RUNNING',
  version: 'Apache Tomcat/10.1.20 (Jakarta EE 10 / Servlet 6.0)',
  catalinaBase: '/opt/apache-tomcat-10.1.20',
  contextPath: '/pos',
  httpPort: 8080,
  ajpPort: 8009,
  shutdownPort: 8005,
  uptimeSeconds: 0,
  startTime: Date.now(),
  deployedServlets: [
    'AuthServlet (/auth, /login, /logout)',
    'ProductServlet (/products)',
    'CategoryServlet (/categories)',
    'CustomerServlet (/customers)',
    'SalesServlet (/sales, /pos/checkout)',
    'InvoiceServlet (/invoice)',
    'StockServlet (/stock)',
    'ReportServlet (/reports)',
  ],
  activeSessions: 4,
  memoryUsedMb: 142,
  maxMemoryMb: 1024,
};

// Simulated Tomcat log buffer
let tomcatCatalinaLogs: string[] = [
  `[${new Date().toISOString()}] [main] INFO org.apache.catalina.startup.VersionLoggerListener.log - Server version name: Apache Tomcat/10.1.20`,
  `[${new Date().toISOString()}] [main] INFO org.apache.catalina.startup.VersionLoggerListener.log - Server built: Mar 11 2024 14:15:00 UTC`,
  `[${new Date().toISOString()}] [main] INFO org.apache.catalina.startup.VersionLoggerListener.log - OS Name: Linux / OpenJDK 25 64-Bit Server VM`,
  `[${new Date().toISOString()}] [main] INFO org.apache.catalina.core.StandardService.startInternal - Starting service [Catalina]`,
  `[${new Date().toISOString()}] [main] INFO org.apache.catalina.core.StandardEngine.startInternal - Starting Servlet engine: [Apache Tomcat/10.1.20]`,
  `[${new Date().toISOString()}] [main] INFO org.apache.catalina.startup.HostConfig.deployWAR - Deploying web application archive [/opt/tomcat/webapps/pos.war]`,
  `[${new Date().toISOString()}] [main] INFO com.company.pos.config.DBConnection - Initializing HikariCP / MySQL JDBC Connection Pool for [jdbc:mysql://localhost:3306/pos_inventory_db]`,
  `[${new Date().toISOString()}] [main] INFO com.company.pos.filter.AuthFilter - Initializing AuthFilter security interceptor`,
  `[${new Date().toISOString()}] [main] INFO org.apache.catalina.startup.HostConfig.deployWAR - Deployment of web application archive [/opt/tomcat/webapps/pos.war] has finished in [1,420] ms`,
  `[${new Date().toISOString()}] [main] INFO org.apache.coyote.http11.Http11NioProtocol.start - Starting ProtocolHandler ["http-nio-8080"]`,
  `[${new Date().toISOString()}] [main] INFO org.apache.catalina.startup.Catalina.start - Server startup in [2,105] milliseconds`,
];

function addTomcatLog(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  tomcatCatalinaLogs.push(line);
  if (tomcatCatalinaLogs.length > 500) {
    tomcatCatalinaLogs.shift();
  }
}

// Enable JSON and urlencoded body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for API calls
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`[Node.js Express] ${req.method} ${req.path}`);
  }
  next();
});

// ============================================================================
// 1. NODE.JS CORE & SERVER HEALTH ENDPOINTS
// ============================================================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'Node.js Express (Full-Stack)',
    version: process.version,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    tomcatStatus: tomcatState.status,
  });
});

app.get('/api/system-info', (req, res) => {
  res.json({
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    uptime: Math.floor(process.uptime()),
    memoryUsage: process.memoryUsage(),
    pid: process.pid,
    port: PORT,
    host: HOST,
    environment: process.env.NODE_ENV || 'development',
    activeServices: [
      { name: 'Node.js Express Server', port: PORT, status: 'ONLINE', protocol: 'HTTP/1.1' },
      { name: 'Vite Development Server', port: PORT, status: 'ONLINE', protocol: 'HMR/WS' },
      { name: 'Apache Tomcat 10 Engine', port: 8080, status: tomcatState.status, protocol: 'HTTP/Catalina' },
      { name: 'MySQL Database Pool', port: 3306, status: 'CONFIGURED', protocol: 'JDBC' },
    ],
  });
});

// ============================================================================
// 2. REST API ROUTES (PRODUCTS, CATEGORIES, SALES, ETC.)
// ============================================================================

app.get('/api/products', (req, res) => {
  const { search, categoryId } = req.query;
  let results = [...mockProducts];
  if (categoryId) {
    results = results.filter((p) => p.categoryId === categoryId);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    results = results.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q));
  }
  res.json(results);
});

app.post('/api/products', (req, res) => {
  const newProduct = {
    id: `prod-${Date.now()}`,
    ...req.body,
    status: req.body.status || 'ACTIVE',
  };
  mockProducts.unshift(newProduct);
  addTomcatLog(`[ProductDAO] INSERT INTO products (${newProduct.sku}) executed successfully.`);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const index = mockProducts.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  mockProducts[index] = { ...mockProducts[index], ...req.body };
  addTomcatLog(`[ProductDAO] UPDATE products SET stock=${mockProducts[index].stock} WHERE id='${req.params.id}'`);
  res.json(mockProducts[index]);
});

app.delete('/api/products/:id', (req, res) => {
  const index = mockProducts.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  const deleted = mockProducts.splice(index, 1)[0];
  res.json({ message: 'Product deleted', product: deleted });
});

app.get('/api/categories', (req, res) => {
  res.json(mockCategories);
});

app.get('/api/sales', (req, res) => {
  res.json(mockSales);
});

app.post('/api/sales', (req, res) => {
  const sale = {
    id: `sale-${Date.now()}`,
    date: new Date().toISOString(),
    ...req.body,
  };
  mockSales.unshift(sale);

  // Decrement inventory stock
  if (Array.isArray(sale.items)) {
    sale.items.forEach((item: any) => {
      const prod = mockProducts.find((p) => p.id === item.productId);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
      }
    });
  }

  addTomcatLog(`[SalesServlet] Order completed invoice #${sale.invoiceNumber || sale.id}. Total: $${sale.totalAmount || 0}`);
  res.status(201).json(sale);
});

// ============================================================================
// 3. APACHE TOMCAT RUNNER & SERVLET SIMULATION ENDPOINTS
// ============================================================================

app.get('/api/tomcat/status', (req, res) => {
  tomcatState.uptimeSeconds = Math.floor((Date.now() - tomcatState.startTime) / 1000);
  res.json(tomcatState);
});

app.post('/api/tomcat/control', (req, res) => {
  const { action } = req.body;

  if (action === 'START') {
    tomcatState.status = 'RUNNING';
    tomcatState.startTime = Date.now();
    addTomcatLog('[Catalina.start] Apache Tomcat engine started manually via web console.');
    return res.json({ success: true, message: 'Tomcat started successfully.', state: tomcatState });
  }

  if (action === 'STOP') {
    tomcatState.status = 'STOPPED';
    addTomcatLog('[Catalina.stop] Apache Tomcat engine stopped.');
    return res.json({ success: true, message: 'Tomcat stopped successfully.', state: tomcatState });
  }

  if (action === 'RESTART') {
    tomcatState.status = 'RESTARTING';
    addTomcatLog('[Catalina.restart] Restarting Apache Tomcat Catalina engine...');
    setTimeout(() => {
      tomcatState.status = 'RUNNING';
      tomcatState.startTime = Date.now();
      addTomcatLog('[Catalina.restart] Apache Tomcat restarted and contexts reloaded in 480ms.');
    }, 1000);
    return res.json({ success: true, message: 'Tomcat restart initiated.', state: tomcatState });
  }

  if (action === 'RELOAD_CONTEXT') {
    addTomcatLog('[HostConfig] Reloading context [/pos] from /opt/tomcat/webapps/pos.war...');
    addTomcatLog('[HostConfig] Context [/pos] reloaded successfully.');
    return res.json({ success: true, message: 'Application context /pos reloaded.', state: tomcatState });
  }

  if (action === 'CLEAR_LOGS') {
    tomcatCatalinaLogs = [
      `[${new Date().toISOString()}] [System] Tomcat logs cleared by administrator.`,
    ];
    return res.json({ success: true, message: 'Tomcat logs cleared.' });
  }

  return res.status(400).json({ error: 'Invalid action' });
});

app.get('/api/tomcat/logs', (req, res) => {
  res.json({
    logs: tomcatCatalinaLogs,
    count: tomcatCatalinaLogs.length,
    timestamp: new Date().toISOString(),
  });
});

// Live Java Servlet execution & request simulation endpoint
app.post('/api/tomcat/invoke', (req, res) => {
  if (tomcatState.status !== 'RUNNING') {
    return res.status(503).json({
      error: 'Tomcat server is currently STOPPED. Please start Tomcat in the controller panel.',
    });
  }

  const { servletName, method = 'GET', path: servletPath = '/products', params = {}, headers = {} } = req.body;
  const requestId = `req-${Math.random().toString(36).substring(2, 9)}`;
  const timestamp = new Date().toISOString();

  addTomcatLog(`[localhost_access_log] 127.0.0.1 - [${timestamp}] "${method} /pos${servletPath} HTTP/1.1" 200 -`);

  let responseData: any = {};
  let forwardJsp = '/WEB-INF/views/dashboard.jsp';
  let executionSteps: string[] = [];

  switch (servletName) {
    case 'ProductServlet': {
      executionSteps = [
        `1. [HttpServletRequest] Received ${method} request for URI: /pos/products`,
        `2. [AuthFilter] Session verified (User: Alexandra Vance, Role: ADMIN)`,
        `3. [ProductServlet] Invoking doGet(request, response)`,
        `4. [ProductDAO] Executing SQL: "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.status = 'ACTIVE'"`,
        `5. [ProductDAO] Retrieved ${mockProducts.length} rows from MySQL connection pool`,
        `6. [HttpServletRequest] setAttribute("productList", List<Product> count=${mockProducts.length})`,
        `7. [RequestDispatcher] forward(request, response) -> /products.jsp`,
      ];
      forwardJsp = '/products.jsp';
      responseData = {
        products: mockProducts,
        total: mockProducts.length,
        action: params.action || 'list',
      };
      break;
    }

    case 'SalesServlet': {
      executionSteps = [
        `1. [HttpServletRequest] Received ${method} request for URI: /pos/sales`,
        `2. [AuthFilter] Validated user session and CSRF token`,
        `3. [SalesServlet] Invoking doPost(request, response) -> action=${params.action || 'checkout'}`,
        `4. [SaleDAO] Executing JDBC transaction: BEGIN`,
        `5. [SaleDAO] INSERT INTO sales (invoice_num, total, payment_method) VALUES (?, ?, ?)`,
        `6. [StockDAO] Executing inventory deduction batch update`,
        `7. [SaleDAO] Executing JDBC transaction: COMMIT`,
        `8. [HttpServletRequest] setAttribute("activeInvoice", saleObj)`,
        `9. [RequestDispatcher] forward(request, response) -> /invoice.jsp`,
      ];
      forwardJsp = '/invoice.jsp';
      responseData = {
        status: 'SUCCESS',
        message: 'Sales transaction committed to MySQL',
        saleId: `sale-trans-${Date.now()}`,
      };
      break;
    }

    case 'AuthServlet': {
      executionSteps = [
        `1. [HttpServletRequest] Received ${method} request for URI: /pos/auth`,
        `2. [AuthServlet] Validating credentials against UserDAO.findByEmail()`,
        `3. [UserDAO] SELECT * FROM users WHERE email = ? AND status = 'ACTIVE'`,
        `4. [BCrypt] Password hash verification succeeded`,
        `5. [HttpSession] session.setAttribute("user", authenticatedUser)`,
        `6. [HttpServletResponse] sendRedirect("/pos/dashboard.jsp")`,
      ];
      forwardJsp = '/dashboard.jsp';
      responseData = {
        authenticated: true,
        user: { name: 'Alexandra Vance', role: 'ADMIN', email: 'admin@company.com' },
      };
      break;
    }

    case 'StockServlet': {
      executionSteps = [
        `1. [HttpServletRequest] Received ${method} request for URI: /pos/stock`,
        `2. [StockServlet] Processing stock adjustment action: ${params.action || 'view'}`,
        `3. [StockDAO] SELECT * FROM stock_logs ORDER BY created_at DESC LIMIT 50`,
        `4. [RequestDispatcher] forward(request, response) -> /stock.jsp`,
      ];
      forwardJsp = '/stock.jsp';
      responseData = {
        stockLogsCount: 24,
        lowStockItems: mockProducts.filter((p) => p.stock <= p.minStockAlert),
      };
      break;
    }

    default: {
      executionSteps = [
        `1. [HttpServletRequest] Received ${method} request for ${servletName}`,
        `2. [Servlet] Executing default service() pipeline`,
        `3. [RequestDispatcher] Forwarding to target JSP view`,
      ];
      forwardJsp = '/dashboard.jsp';
      responseData = { message: `Executed ${servletName}` };
    }
  }

  res.json({
    requestId,
    servletName,
    servletPath,
    method,
    status: 200,
    contentType: 'text/html;charset=UTF-8',
    forwardJsp,
    executionSteps,
    attributes: responseData,
    tomcatEngine: tomcatState.version,
  });
});

// Endpoint to view raw Tomcat configuration files
app.get('/api/tomcat/config/:filename', (req, res) => {
  const { filename } = req.params;
  const configMap: Record<string, string> = {
    'server.xml': path.join(process.cwd(), 'tomcat', 'conf', 'server.xml'),
    'context.xml': path.join(process.cwd(), 'tomcat', 'conf', 'context.xml'),
    'web.xml': path.join(process.cwd(), 'tomcat', 'conf', 'web.xml'),
    'Dockerfile': path.join(process.cwd(), 'tomcat', 'Dockerfile'),
    'docker-compose.yml': path.join(process.cwd(), 'tomcat', 'docker-compose.yml'),
    'pom.xml': path.join(process.cwd(), 'pom.xml'),
    'run-tomcat.sh': path.join(process.cwd(), 'tomcat', 'run-tomcat.sh'),
  };

  const targetPath = configMap[filename];
  if (!targetPath || !fs.existsSync(targetPath)) {
    return res.status(404).json({ error: `Configuration file '${filename}' not found` });
  }

  const content = fs.readFileSync(targetPath, 'utf-8');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(content);
});

// ============================================================================
// 4. VITE MIDDLEWARE & STATIC SERVING
// ============================================================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Node.js Express server running on http://${HOST}:${PORT}`);
    console.log(`☕ Apache Tomcat Servlet Engine running on internal port 8080 (/pos)`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
