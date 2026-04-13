import { useState, useEffect, useCallback } from 'react';
import { onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db, getFieldAgentForAction, createApprovalRequest } from '../lib/firestore';
import { auth } from '../lib/firebase';

type ApprovalStatus = 'idle' | 'checking' | 'waiting' | 'approved' | 'denied' | 'timeout';

/**
 * Hook that guards an action with a Field Agent approval flow.
 *
 * Usage:
 *   const { executeWithGuard, status, reset } = useFieldAgentGuard('add_tenant');
 *   executeWithGuard('Add Tenant: Acme Corp', () => { saveTenant(); });
 */
export function useFieldAgentGuard(action: string) {
  const [status, setStatus] = useState<ApprovalStatus>('idle');
  const [pendingApprovalId, setPendingApprovalId] = useState<string | null>(null);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);
  const [timeoutMs, setTimeoutMs] = useState(120000);

  // Listen for approval status changes
  useEffect(() => {
    if (!pendingApprovalId) return;
    const unsub = onSnapshot(doc(db, 'admin_approvals', pendingApprovalId), (snap) => {
      const data = snap.data();
      if (!data) return;
      if (data.status === 'approved') {
        setStatus('approved');
        // Execute the pending action
        if (pendingCallback) pendingCallback();
        // Cleanup
        deleteDoc(doc(db, 'admin_approvals', pendingApprovalId));
        setTimeout(() => {
          setPendingApprovalId(null);
          setPendingCallback(null);
          setStatus('idle');
        }, 2000);
      } else if (data.status === 'denied') {
        setStatus('denied');
        deleteDoc(doc(db, 'admin_approvals', pendingApprovalId));
        setTimeout(() => {
          setPendingApprovalId(null);
          setPendingCallback(null);
          setStatus('idle');
        }, 2000);
      }
    });
    // Timeout based on agent config (0 = no timeout)
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        if (status === 'waiting') {
          setStatus('timeout');
          if (pendingApprovalId) deleteDoc(doc(db, 'admin_approvals', pendingApprovalId));
          setTimeout(() => {
            setPendingApprovalId(null);
            setPendingCallback(null);
            setStatus('idle');
          }, 2000);
        }
      }, timeoutMs);
    }
    return () => { unsub(); if (timer) clearTimeout(timer); };
  }, [pendingApprovalId, timeoutMs]);

  const executeWithGuard = useCallback(async (
    details: string,
    callback: () => void,
    page?: string,
    actionLabel?: string,
  ) => {
    setStatus('checking');
    const agent = await getFieldAgentForAction(action);

    if (!agent || !agent.enabled) {
      // No field agent — execute immediately
      setStatus('idle');
      callback();
      return;
    }

    // Field agent active — create approval request
    const agentTimeout = agent.timeoutSeconds || 120;
    setTimeoutMs(agentTimeout * 1000);
    const user = auth.currentUser;
    const approvalId = await createApprovalRequest({
      type: 'field_agent',
      action,
      actionLabel: actionLabel || agent.actionLabel,
      page: page || agent.page,
      siteName: agent.siteName || 'Flash ID Super Admin',
      scope: agent.scope || '',
      details,
      requestedBy: user?.email || '',
      requestedByUid: user?.uid || '',
      notifyEmails: agent.notifyEmails || [],
      timeoutSeconds: agentTimeout,
    });

    setPendingApprovalId(approvalId);
    setPendingCallback(() => callback);
    setStatus('waiting');
  }, [action]);

  const reset = useCallback(() => {
    if (pendingApprovalId) {
      deleteDoc(doc(db, 'admin_approvals', pendingApprovalId));
    }
    setPendingApprovalId(null);
    setPendingCallback(null);
    setStatus('idle');
  }, [pendingApprovalId]);

  return { executeWithGuard, status, reset };
}
