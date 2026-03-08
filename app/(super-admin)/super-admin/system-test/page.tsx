"use client";

import { useState } from "react";

type FlowStatus = "untested" | "pass" | "fail";

interface FlowItem {
  id: string;
  label: string;
  status: FlowStatus;
}

interface IntegrityCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

const INITIAL_FLOWS: FlowItem[] = [
  { id: "signup", label: "Customer signup + welcome email sent", status: "untested" },
  { id: "referral-submit", label: "Customer submits referral → confirmation email sent", status: "untested" },
  { id: "referral-installed", label: "Admin updates referral to \"installed\" → points awarded → notification email sent", status: "untested" },
  { id: "redeem-reward", label: "Customer redeems reward → confirmation email sent", status: "untested" },
  { id: "business-onboard", label: "Business onboarding → first customer invitation sent", status: "untested" },
  { id: "leaderboard", label: "Leaderboard updates correctly after points awarded", status: "untested" },
  { id: "plan-limits", label: "Plan tier limits enforced (free plan customer cap)", status: "untested" },
];

function StatusIcon({ status }: { status: FlowStatus }) {
  if (status === "pass")
    return <span className="text-green-600 text-lg font-bold">✓</span>;
  if (status === "fail")
    return <span className="text-red-600 text-lg font-bold">✗</span>;
  return <span className="text-gray-400 text-lg">—</span>;
}

export default function SystemTestPage() {
  const [flows, setFlows] = useState<FlowItem[]>(INITIAL_FLOWS);
  const [integrityChecks, setIntegrityChecks] = useState<IntegrityCheck[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setFlowStatus(id: string, status: FlowStatus) {
    setFlows((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status } : f))
    );
  }

  async function runAutomatedChecks() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/system-test/run", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to run checks");
        setRunning(false);
        return;
      }
      const data = await res.json();
      setIntegrityChecks(data.integrityChecks ?? []);
    } catch {
      setError("Network error running checks");
    }
    setRunning(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">System Test Checklist</h1>

      {/* Manual flow checklist */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Manual Flow Checks</h2>
        <div className="space-y-3">
          {flows.map((flow) => (
            <div
              key={flow.id}
              className="flex items-center justify-between gap-4 rounded border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <StatusIcon status={flow.status} />
                <span className="text-sm">{flow.label}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFlowStatus(flow.id, "pass")}
                  className={`rounded px-3 py-1 text-xs font-medium transition ${
                    flow.status === "pass"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-green-100"
                  }`}
                >
                  Pass
                </button>
                <button
                  onClick={() => setFlowStatus(flow.id, "fail")}
                  className={`rounded px-3 py-1 text-xs font-medium transition ${
                    flow.status === "fail"
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-red-100"
                  }`}
                >
                  Fail
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Automated integrity checks */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Data Integrity Checks</h2>
          <button
            onClick={runAutomatedChecks}
            disabled={running}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {running ? "Running…" : "Run Automated Checks"}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {integrityChecks.length === 0 && !error && (
          <p className="text-sm text-gray-500">
            Click &quot;Run Automated Checks&quot; to verify data integrity.
          </p>
        )}

        {integrityChecks.length > 0 && (
          <div className="space-y-3">
            {integrityChecks.map((check) => (
              <div
                key={check.id}
                className="flex items-start gap-3 rounded border px-4 py-3"
              >
                <span
                  className={`mt-0.5 text-lg font-bold ${
                    check.passed ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {check.passed ? "✓" : "✗"}
                </span>
                <div>
                  <div className="text-sm font-medium">{check.label}</div>
                  <div className="text-xs text-gray-500">{check.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
