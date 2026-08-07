import React, { useState, useEffect } from 'react';
import { fetchRemoteAuditLogs, clearLocalAuditLogs } from '../utils/auditLogger';
import type { AuditLogEntry } from '../utils/auditLogger';
import { X, RefreshCw, Trash2, Download, Terminal, Search, ShieldCheck } from 'lucide-react';

interface DevLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevLogsModal: React.FC<DevLogsModalProps> = ({ isOpen, onClose }) => {
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
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear local audit logs?")) {
      clearLocalAuditLogs();
      setLogs([]);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `hakimi_audit_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredLogs = logs.filter(log => {
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    const matchesSearch = searchQuery.trim() === '' || 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const getActionBadgeColor = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'PRODUCT_ADDED': return '#10b981'; // Green
      case 'PRODUCT_UPDATED': return '#3b82f6'; // Blue
      case 'PRODUCT_DELETED': return '#ef4444'; // Red
      case 'ORDER_STATUS_CHANGED': return '#f59e0b'; // Amber
      case 'DELIVERY_THRESHOLD_UPDATED': return '#8b5cf6'; // Purple
      case 'OWNER_LOGIN': return '#ec4899'; // Pink
      default: return '#6b7280';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      boxSizing: 'border-box',
      fontFamily: 'Consolas, Monaco, "Courier New", monospace'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        borderRadius: '16px',
        border: '1px solid #334155',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Terminal size={20} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.5px' }}>
              Developer Audit Console (Owner Activity Log)
            </h3>
            <span style={{
              backgroundColor: '#0369a1',
              color: '#e0f2fe',
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '12px',
              fontWeight: 700
            }}>
              CONFIDENTIAL / DEV ONLY
            </span>
          </div>
          
          <button 
            onClick={onClose}
            style={{
              background: '#334155',
              border: 'none',
              color: '#94a3b8',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div style={{
          padding: '12px 20px',
          backgroundColor: '#0f172a',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Action Filter */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Filter:</span>
            <select 
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              style={{
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '12px',
                outline: 'none'
              }}
            >
              <option value="ALL">All Actions</option>
              <option value="PRODUCT_ADDED">Product Added</option>
              <option value="PRODUCT_UPDATED">Product Updated</option>
              <option value="PRODUCT_DELETED">Product Deleted</option>
              <option value="ORDER_STATUS_CHANGED">Order Status Changed</option>
              <option value="DELIVERY_THRESHOLD_UPDATED">Threshold Updated</option>
              <option value="OWNER_LOGIN">Owner Login</option>
            </select>
          </div>

          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', padding: '4px 10px', borderRadius: '6px', border: '1px solid #334155', flex: 1, maxWidth: '300px' }}>
            <Search size={14} color="#94a3b8" style={{ marginRight: '6px' }} />
            <input 
              type="text" 
              placeholder="Search log payload..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '12px',
                outline: 'none',
                width: '100%'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={loadLogs} 
              disabled={loading}
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#38bdf8',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RefreshCw size={12} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>

            <button 
              onClick={handleExportJSON}
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#10b981',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Download size={12} />
              <span>Export JSON</span>
            </button>

            <button 
              onClick={handleClear}
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#ef4444',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Logs Feed Container */}
        <div style={{
          flex: 1,
          padding: '16px 20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          backgroundColor: '#090d16'
        }}>
          {filteredLogs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              No audit logs recorded matching your filter. Perform owner actions (add/edit/delete products, update orders) to see live logs!
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const badgeColor = getActionBadgeColor(log.action);

              return (
                <div 
                  key={log.id}
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  <div 
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        backgroundColor: `${badgeColor}22`,
                        color: badgeColor,
                        border: `1px solid ${badgeColor}44`,
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {log.action}
                      </span>
                      <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                        Actor: {log.actor}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {log.timestamp}
                      </span>
                      <span style={{ fontSize: '10px', color: '#38bdf8' }}>
                        {isExpanded ? '▲ Hide Details' : '▼ View Payload'}
                      </span>
                    </div>
                  </div>

                  {/* Summary string */}
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                    {log.action === 'PRODUCT_ADDED' && `Added "${log.details.name}" (₹${log.details.price}) to ${log.details.mainCategory || 'Catalog'}`}
                    {log.action === 'PRODUCT_UPDATED' && `Updated product ID: ${log.details.id || log.details.name}`}
                    {log.action === 'PRODUCT_DELETED' && `Deleted product: "${log.details.name || log.details.id}"`}
                    {log.action === 'ORDER_STATUS_CHANGED' && `Order ${log.details.orderId} status changed from "${log.details.oldStatus || 'unknown'}" ➔ "${log.details.newStatus}"`}
                    {log.action === 'DELIVERY_THRESHOLD_UPDATED' && `Free delivery threshold changed to ₹${log.details.newThreshold}`}
                    {log.action === 'OWNER_LOGIN' && `Merchant signed in from ${log.details.phone}`}
                  </div>

                  {/* Expanded JSON payload */}
                  {isExpanded && (
                    <div style={{
                      marginTop: '10px',
                      padding: '10px',
                      backgroundColor: '#0f172a',
                      borderRadius: '6px',
                      border: '1px solid #334155',
                      fontSize: '11px',
                      color: '#a5f3fc',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all'
                    }}>
                      {JSON.stringify(log.details, null, 2)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div style={{
          padding: '10px 20px',
          backgroundColor: '#1e293b',
          borderTop: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={14} color="#10b981" />
            <span>Developer Log Overlay active. Shortcut: <strong>Ctrl + Shift + L</strong> or console <strong>window.showDevLogs()</strong></span>
          </div>
          <span>Total Logs: {logs.length}</span>
        </div>
      </div>
    </div>
  );
};
