import React, { useState, useEffect, useMemo } from 'react';
import { User, AppView, Sale, Product, PermissionKey } from './types';
import { storageService } from './services/storageService';
import { DashboardView } from './components/DashboardView';
import { PosView } from './components/PosView';
import { ProductsView } from './components/ProductsView';
import { CategoriesView } from './components/CategoriesView';
import { CustomersView } from './components/CustomersView';
import { SalesHistoryView } from './components/SalesHistoryView';
import { ReportsView } from './components/ReportsView';
import { StockView } from './components/StockView';
import { UsersView } from './components/UsersView';
import { JavaArchitectureView } from './components/JavaArchitectureView';
import { AuditBackupView } from './components/AuditBackupView';
import { InvoiceModal } from './components/InvoiceModal';
import { LoginModal } from './components/LoginModal';

import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Users,
  Receipt,
  BarChart3,
  Boxes,
  ShieldCheck,
  Bell,
  LogOut,
  UserCheck,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Clock,
  Shield,
  ShieldAlert,
  History,
  HardDrive,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(() => storageService.getCurrentUser());
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [activeInvoice, setActiveInvoice] = useState<Sale | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [sessionStartTime] = useState<string>(() => {
    const raw = storageService.getSessionStart();
    const date = new Date(raw);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  // Data states for global badges & live sync
  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts());
  const [sales, setSales] = useState<Sale[]>(() => storageService.getSales());
  const [customers, setCustomers] = useState(() => storageService.getCustomers());
  const [stockLogs, setStockLogs] = useState(() => storageService.getStockLogs());

  const refreshGlobalData = () => {
    setProducts(storageService.getProducts());
    setSales(storageService.getSales());
    setCustomers(storageService.getCustomers());
    setStockLogs(storageService.getStockLogs());
  };

  // Check low stock count
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock <= p.minStockAlert).length;
  }, [products]);

  // Listen for permission rule changes across sessions
  const [permissionsVersion, setPermissionsVersion] = useState(0);

  useEffect(() => {
    const unsub = storageService.onPermissionsChange(() => {
      setPermissionsVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  const handleSaleCompleted = (sale: Sale) => {
    refreshGlobalData();
    setActiveInvoice(sale);
  };

  const navItems = useMemo(() => [
    { id: 'dashboard' as AppView, label: 'Dashboard', icon: LayoutDashboard, permissionKey: 'viewDashboard' as PermissionKey },
    { id: 'pos' as AppView, label: 'POS Terminal', icon: ShoppingCart, permissionKey: 'viewPos' as PermissionKey, highlight: true },
    { id: 'products' as AppView, label: 'Products', icon: Package, permissionKey: 'viewProducts' as PermissionKey },
    { id: 'categories' as AppView, label: 'Categories', icon: Tags, permissionKey: 'viewCategories' as PermissionKey },
    { id: 'stock' as AppView, label: 'Stock Mgmt', icon: Boxes, permissionKey: 'viewStock' as PermissionKey, badge: lowStockCount > 0 ? lowStockCount : undefined },
    { id: 'customers' as AppView, label: 'Customers', icon: Users, permissionKey: 'viewCustomers' as PermissionKey },
    { id: 'sales_history' as AppView, label: 'Sales History', icon: Receipt, permissionKey: 'viewSalesHistory' as PermissionKey },
    { id: 'reports' as AppView, label: 'Reports', icon: BarChart3, permissionKey: 'viewReports' as PermissionKey },
    { id: 'users' as AppView, label: 'User Roles & Rules', icon: ShieldCheck, permissionKey: 'viewUsers' as PermissionKey },
    { id: 'audit_logs' as AppView, label: 'Audit & Backup', icon: History, permissionKey: 'viewAuditLogs' as PermissionKey },
  ], [lowStockCount, permissionsVersion]);

  const handleSwitchUser = (user: User) => {
    storageService.setCurrentUser(user);
    setCurrentUser(user);
    // Check if the switched user has permission for the active view
    const currentNav = navItems.find((n) => n.id === currentView);
    if (currentNav?.permissionKey && !storageService.hasPermission(user, currentNav.permissionKey)) {
      // Find first view allowed for this user
      const firstAllowed = navItems.find((n) => !n.permissionKey || storageService.hasPermission(user, n.permissionKey));
      setCurrentView(firstAllowed ? firstAllowed.id : 'pos');
    }
  };

  const handleLogout = () => {
    setIsLoginModalOpen(true);
  };

  const handleResetData = () => {
    if (confirm('Reset demo database to fresh initial inventory, products, and sales records?')) {
      storageService.resetAllData();
      setCurrentUser(storageService.getCurrentUser());
      refreshGlobalData();
      setCurrentView('dashboard');
    }
  };

  return (
    <div id="app-root" className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans antialiased">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <button
                id="brand-home-btn"
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center gap-2.5 text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md group-hover:bg-indigo-700 transition-colors">
                  A
                </div>
                <div>
                  <div className="text-base font-bold tracking-tight text-slate-900 leading-tight">
                    Apex<span className="text-indigo-600">POS</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium leading-none">
                    Sales & Inventory Suite
                  </div>
                </div>
              </button>

            </div>

            {/* Right Controls: User Profile, Session, Alerts */}
            <div className="flex items-center gap-3">
              {/* Low stock alert badge */}
              {lowStockCount > 0 && (
                <button
                  id="header-low-stock-alert"
                  onClick={() => setCurrentView('stock')}
                  className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>{lowStockCount} Low Stock</span>
                </button>
              )}

              {/* Session timer badge */}
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Session: {sessionStartTime}</span>
              </div>

              {/* Audit & Backup Quick Access */}
              <button
                id="header-audit-backup-btn"
                onClick={() => setCurrentView('audit_logs')}
                className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                  currentView === 'audit_logs'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title="View Login/Logout History, Audit Trail & Database Backup"
              >
                <History className="w-3.5 h-3.5 text-indigo-600" />
                <span>Audit & Backup</span>
              </button>

              {/* User Dropdown / Switcher */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left"
                  title="Click to switch role or log in"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide">
                      {currentUser.role}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  id="quick-logout-btn"
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                  title="Logout / Switch Account"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Horizontal Bar */}
        <div className="bg-slate-50 border-t border-slate-200/60 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center space-x-1 py-1.5">
              {navItems.map((item) => {
                const isAllowed = !item.permissionKey || storageService.hasPermission(currentUser, item.permissionKey);
                const isActive = currentView === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => {
                      if (isAllowed) {
                        setCurrentView(item.id);
                        refreshGlobalData();
                      } else {
                        alert(`Access Restricted: Your role (${currentUser.role}) does not have permission to access ${item.label}. Permissions can be configured in User Roles & Rules.`);
                      }
                    }}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? item.special
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-indigo-600 text-white shadow-xs'
                        : isAllowed
                        ? item.special
                          ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                          : item.highlight
                          ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        : 'text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive
                            ? 'bg-white text-indigo-600'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="flex-1" />

              <button
                id="reset-demo-data-btn"
                onClick={handleResetData}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-md transition-colors"
                title="Reset sample inventory, customers, and sales"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                Reset Data
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'dashboard' && (
          <DashboardView
            currentUser={currentUser}
            products={products}
            sales={sales}
            customers={customers}
            stockLogs={stockLogs}
            onNavigate={(view) => setCurrentView(view)}
            onViewInvoice={(sale) => setActiveInvoice(sale)}
          />
        )}

        {currentView === 'pos' && (
          <PosView
            currentUser={currentUser}
            onSaleCompleted={handleSaleCompleted}
          />
        )}

        {currentView === 'products' && (
          <ProductsView
            currentUser={currentUser}
            onNavigateToStock={() => setCurrentView('stock')}
          />
        )}

        {currentView === 'categories' && (
          <CategoriesView currentUser={currentUser} />
        )}

        {currentView === 'stock' && (
          <StockView currentUser={currentUser} />
        )}

        {currentView === 'customers' && (
          <CustomersView
            currentUser={currentUser}
            onViewInvoice={(sale) => setActiveInvoice(sale)}
          />
        )}

        {currentView === 'sales_history' && (
          <SalesHistoryView
            currentUser={currentUser}
            onViewInvoice={(sale) => setActiveInvoice(sale)}
            onNavigateToPos={() => setCurrentView('pos')}
          />
        )}

        {currentView === 'reports' && (
          <ReportsView currentUser={currentUser} />
        )}

        {currentView === 'users' && (
          <UsersView
            currentUser={currentUser}
            onSwitchUser={handleSwitchUser}
            onPermissionsUpdated={refreshGlobalData}
          />
        )}

        {currentView === 'audit_logs' && (
          <AuditBackupView
            currentUser={currentUser}
            onDataRestored={() => {
              refreshGlobalData();
              setCurrentUser(storageService.getCurrentUser());
            }}
          />
        )}

        {currentView === 'java_architecture' && (
          <JavaArchitectureView />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">ApexPOS & Inventory Enterprise</span>
            <span>•</span>
            <span>Active Account: {currentUser.name} ({currentUser.role})</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>MySQL 8.0 • Java Servlet 4.0 • JSP & JSTL • Tomcat</span>
          </div>
        </div>
      </footer>

      {/* Invoice Modal (Active whenever a sale is completed or clicked) */}
      <InvoiceModal
        sale={activeInvoice}
        onClose={() => setActiveInvoice(null)}
      />

      {/* Login & Role Switcher Modal */}
      <LoginModal
        currentUser={currentUser}
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleSwitchUser}
        onOpenAuditLogs={() => setCurrentView('audit_logs')}
      />
    </div>
  );
}
