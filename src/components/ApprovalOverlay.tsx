interface ApprovalOverlayProps {
  status: 'waiting' | 'approved' | 'denied' | 'timeout';
  onCancel?: () => void;
}

export function ApprovalOverlay({ status, onCancel }: ApprovalOverlayProps) {
  if (status === 'waiting') {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
        <div className="flex justify-center mb-2">
          <div className="h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm font-semibold text-amber-800">Waiting for Field Agent approval</p>
        <p className="text-xs text-amber-600 mt-1">Approve this action on your Flash ID app (Agents tab)</p>
        {onCancel && (
          <button onClick={onCancel} className="mt-3 text-xs text-amber-500 hover:text-amber-700 font-medium">
            Cancel
          </button>
        )}
      </div>
    );
  }

  if (status === 'approved') {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
        <p className="text-sm font-semibold text-green-800">Approved — action executed</p>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
        <p className="text-sm font-semibold text-red-800">Denied — action cancelled</p>
      </div>
    );
  }

  if (status === 'timeout') {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
        <p className="text-sm font-semibold text-slate-600">Timed out — no response received</p>
      </div>
    );
  }

  return null;
}
