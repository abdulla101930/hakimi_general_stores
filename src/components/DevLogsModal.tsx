import { useEffect, useState } from 'react';
import { fetchRemoteAuditLogs, clearLocalAuditLogs } from '../lib/audit';
import type { AuditLogEntry } from '../lib/audit';
import { useApp } from '../context/AppContext';
import { X, RefreshCw, Trash2, Download, Terminal, Search, ShieldCheck, Wrench } from 'lucide-react';

interface DevLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DevLogsModal({ isOpen, onClose }: DevLogsModalProps) {
  const { isMaintenanceMode, toggleMaintenanceMode } = useApp();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    const remoteLogs = await fetchRemoteAuditLogs();
    setLogs(remoteLogs);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear local audit logs?')) {
      clearLocalAuditLogs();
      setLogs([]);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `hakimi_audit_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredLogs = logs.filter((log) => {
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    const detailsStr = log.details ? JSON.stringify(log.details).toLowerCase() : '';
    const matchesSearch =
      searchQuery.trim() === '' ||
      (log.action && log.action.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.actor && log.actor.toLowerCase().includes(searchQuery.toLowerCase())) ||
      detailsStr.includes(searchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const getActionBadgeColor = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'PRODUCT_ADDED':
        return '#10b981';
      case 'PRODUCT_UPDATED':
        return '#3b82f6';
      case 'PRODUCT_DELETED':
        return '#ef4444';
      case 'ORDER_STATUS_CHANGED':
        return '#f59e0b';
      case 'DELIVERY_THRESHOLD_UPDATED':
      case 'DELIVERY_SETTINGS_UPDATED':
        return '#8b5cf6';
      case 'MAINTENANCE_MODE_TOGGLED':
        return '#06b6d4';
      case 'OWNER_LOGIN':
        return '#ec4899';
      default:
        return '#6b7280';
    }
  };

  const renderLogSummary = (log: AuditLogEntry) => {
    const d = (log.details || {}) as Record<string, any>;
    switch (log.action) {
      case 'PRODUCT_ADDED':
        return `Added "${d.name || 'product'}" (₹${d.price ?? 0}) to ${d.mainCategory || 'Catalog'}`;
      case 'PRODUCT_UPDATED':
        return `Updated product: ${d.name || d.id || 'unknown'}`;
      case 'PRODUCT_DELETED':
        return `Deleted product: "${d.name || d.id || 'unknown'}"`;
      case 'ORDER_STATUS_CHANGED':
        return `Order ${d.orderId || ''} status changed from "${d.oldStatus || 'unknown'}" ➔ "${d.newStatus || ''}"`;
      case 'DELIVERY_THRESHOLD_UPDATED':
        return `Free delivery threshold changed to ₹${d.newThreshold ?? 0}`;
      case 'DELIVERY_SETTINGS_UPDATED':
        return `Delivery settings updated: ${JSON.stringify(d)}`;
      case 'MAINTENANCE_MODE_TOGGLED':
        return `Store maintenance mode ${d.enabled ? 'ENABLED 🔴' : 'DISABLED 🟢'}`;
      case 'OWNER_LOGIN':
        return `Merchant signed in from ${d.phone || 'phone'}`;
      default:
        return `Action: ${log.action}`;
    }
  };

  return (
    <div className="devlogs-overlay">
      <div className="devlogs-panel">
        <div className="devlogs-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Terminal size={20} color="#38bdf8" />
            <h3>Developer Audit Console (Owner Activity Log)</h3>
            <span className="devlogs-confidential">CONFIDENTIAL / DEV ONLY</span>
          </div>
          <button onClick={onClose} className="devlogs-close-btn">
            <X size={18} />
          </button>
        </div>

        <div className="devlogs-maintenance-bar" style={{ backgroundColor: isMaintenanceMode ? '#450a0a' : '#0f172a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wrench size={18} color={isMaintenanceMode ? '#f87171' : '#38bdf8'} />
            <div>
              <div className="devlogs-maint-title">Developer Control: Store Maintenance Mode</div>
              <div className="devlogs-maint-status" style={{ color: isMaintenanceMode ? '#fca5a5' : '#94a3b8' }}>
                Status: {isMaintenanceMode ? '🔴 ACTIVE — Non-owners see Maintenance Page' : '🟢 INACTIVE — Store is online & taking orders'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => toggleMaintenanceMode()}
            className="devlogs-maint-toggle"
            style={{
              backgroundColor: isMaintenanceMode ? '#ef4444' : '#2563eb',
              boxShadow: isMaintenanceMode ? '0 0 12px rgba(239, 68, 68, 0.5)' : 'none'
            }}
          >
            {isMaintenanceMode ? 'TURN OFF MAINTENANCE' : 'TURN ON MAINTENANCE'}
          </button>
        </div>

        <div className="devlogs-toolbar">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Filter:</span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="devlogs-select"
            >
              <option value="ALL">All Actions</option>
              <option value="PRODUCT_ADDED">Product Added</option>
              <option value="PRODUCT_UPDATED">Product Updated</option>
              <option value="PRODUCT_DELETED">Product Deleted</option>
              <option value="ORDER_STATUS_CHANGED">Order Status Changed</option>
              <option value="DELIVERY_THRESHOLD_UPDATED">Threshold Updated</option>
              <option value="DELIVERY_SETTINGS_UPDATED">Delivery Settings Updated</option>
              <option value="MAINTENANCE_MODE_TOGGLED">Maintenance Toggled</option>
              <option value="OWNER_LOGIN">Owner Login</option>
            </select>
          </div>

          <div className="devlogs-search-box">
            <Search size={14} color="#94a3b8" style={{ marginRight: '6px' }} />
            <input
              type="text"
              placeholder="Search log payload..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="devlogs-search-input"
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={loadLogs} disabled={loading} className="devlogs-tool-btn devlogs-refresh-btn">
              <RefreshCw size={12} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
            <button onClick={handleExportJSON} className="devlogs-tool-btn devlogs-export-btn">
              <Download size={12} />
              <span>Export JSON</span>
            </button>
            <button onClick={handleClear} className="devlogs-tool-btn devlogs-clear-btn">
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        <div className="devlogs-feed">
          {filteredLogs.length === 0 ? (
            <div className="devlogs-empty">
              No audit logs recorded matching your filter. Perform owner actions (add/edit/delete products, update orders) to see live logs!
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const badgeColor = getActionBadgeColor(log.action);

              return (
                <div key={log.id} className="devlogs-item">
                  <div className="devlogs-item-header" onClick={() => setExpandedLogId(isExpanded ? null : log.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="devlogs-badge" style={{ color: badgeColor, borderColor: `${badgeColor}44`, backgroundColor: `${badgeColor}22` }}>
                        {log.action}
                      </span>
                      <span className="devlogs-actor">Actor: {log.actor}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="devlogs-timestamp">{log.timestamp}</span>
                      <span className="devlogs-expand-hint">{isExpanded ? '▲ Hide Details' : '▼ View Payload'}</span>
                    </div>
                  </div>

                  <div className="devlogs-summary">
                    {renderLogSummary(log)}
                  </div>

                  {isExpanded && <div className="devlogs-json">{JSON.stringify(log.details || {}, null, 2)}</div>}
                </div>
              );
            })
          )}
        </div>

        <div className="devlogs-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={14} color="#10b981" />
            <span>
              Developer Log Overlay active. Shortcut: <strong>Ctrl + Shift + L</strong> or console{' '}
              <strong>window.showDevLogs()</strong>
            </span>
          </div>
          <span>Total Logs: {logs.length}</span>
        </div>
      </div>
    </div>
  );
}
