"use client";

// ============================================================
// PM TOOL REPO — src/components/EmployeePicker.tsx
//
// Drop-in replacement for the free-text "Assign to" input in the
// project edit window. Type to search real employees (from
// /api/employees), pick one, and you get back BOTH values:
//   ownerId = employeeId  -> what the Task Assigner page and the
//                            Employee Portal match on
//   owner   = display name
//
// Usage:
//   <EmployeePicker
//     value={{ ownerId: form.ownerId, owner: form.owner }}
//     onChange={({ ownerId, owner }) => setForm(f => ({ ...f, ownerId, owner }))}
//   />
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";

type Employee = { employeeId: string; name: string; department?: string };
type Value = { ownerId?: string; owner?: string };

export default function EmployeePicker({
  value,
  onChange,
  inputClassName = "w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-[13px] text-neutral-900 outline-none focus:border-[#4b44b3]",
  placeholder = "Search employee by name or ID",
}: {
  value: Value;
  onChange: (v: { ownerId: string; owner: string }) => void;
  inputClassName?: string;
  placeholder?: string;
}) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState("");
  const [text, setText] = useState(value.owner || "");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/employees", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { success?: boolean; employees?: Employee[]; message?: string }) => {
        if (d.success) setEmployees(d.employees || []);
        else setError(d.message || "Could not load employees");
      })
      .catch(() => setError("Could not reach the employees API"));
  }, []);

  // Keep the box in sync if the parent loads the record after mount.
  useEffect(() => setText(value.owner || ""), [value.owner]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const matches = useMemo(() => {
    const q = text.trim().toLowerCase();
    const list = q
      ? employees.filter((e) => (e.name + " " + e.employeeId + " " + (e.department || "")).toLowerCase().includes(q))
      : employees;
    return list.slice(0, 8);
  }, [employees, text]);

  const linked = !!value.ownerId && employees.some((e) => e.employeeId === value.ownerId);

  function pick(emp: Employee) {
    setText(emp.name);
    setOpen(false);
    onChange({ ownerId: emp.employeeId, owner: emp.name });
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        className={inputClassName}
        value={text}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          // Typing again unlinks the old employee until a new one is picked.
          onChange({ ownerId: "", owner: e.target.value });
        }}
        onBlur={() => {
          // Typed a full employee name without clicking? Link it anyway.
          const exact = employees.find((e) => e.name.trim().toLowerCase() === text.trim().toLowerCase());
          if (exact && value.ownerId !== exact.employeeId) pick(exact);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "Enter" && open && matches[0]) {
            e.preventDefault();
            pick(matches[0]);
          }
        }}
      />

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white p-1 shadow-xl"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-[12px] text-neutral-500">
              {error || "No employee matches that search."}
            </li>
          ) : (
            matches.map((emp) => (
              <li key={emp.employeeId}>
                <button
                  type="button"
                  role="option"
                  aria-selected={emp.employeeId === value.ownerId}
                  onClick={() => pick(emp)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[13px] text-neutral-900 hover:bg-neutral-100"
                >
                  <span className="truncate font-medium">{emp.name}</span>
                  <span className="shrink-0 text-[11px] text-neutral-500">
                    {emp.department || emp.employeeId}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      <p className={`mt-1 text-[11px] ${linked ? "text-emerald-600" : "text-amber-600"}`}>
        {linked
          ? `Linked to ${value.ownerId}. Saving updates the Task Assigner page.`
          : "Pick someone from the list so the task shows for them on the Task Assigner page and portal."}
      </p>
    </div>
  );
}