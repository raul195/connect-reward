import Papa from "papaparse";
import { isValidEmail, isValidPhone } from "@/lib/validation";

// ── Types ──────────────────────────────────────────────────────────────────

export type MappableField =
  | "fullName"
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "address"
  | "city"
  | "state"
  | "zip"
  | "skip";

export interface ColumnMapping {
  [headerIndex: number]: MappableField;
}

export interface ParseResult {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface MappedRow {
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

// ── Header auto-detection ──────────────────────────────────────────────────

const HEADER_MAP: Record<string, MappableField> = {
  full_name: "fullName",
  "full name": "fullName",
  fullname: "fullName",
  name: "fullName",
  customer_name: "fullName",
  "customer name": "fullName",
  first_name: "firstName",
  "first name": "firstName",
  firstname: "firstName",
  fname: "firstName",
  last_name: "lastName",
  "last name": "lastName",
  lastname: "lastName",
  lname: "lastName",
  email: "email",
  email_address: "email",
  "email address": "email",
  "e-mail": "email",
  phone: "phone",
  phone_number: "phone",
  "phone number": "phone",
  mobile: "phone",
  address: "address",
  street_address: "address",
  "street address": "address",
  street: "address",
  city: "city",
  state: "state",
  zip: "zip",
  zip_code: "zip",
  "zip code": "zip",
  postal_code: "zip",
  "postal code": "zip",
  zipcode: "zip",
};

export function detectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<MappableField>();

  headers.forEach((header, index) => {
    const normalized = header.trim().toLowerCase();
    const field = HEADER_MAP[normalized];
    if (field && !used.has(field)) {
      mapping[index] = field;
      used.add(field);
    } else {
      mapping[index] = "skip";
    }
  });

  return mapping;
}

// ── CSV Parsing ────────────────────────────────────────────────────────────

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim(),
      complete(results) {
        const headers = results.meta.fields || [];
        const rows = results.data as Record<string, string>[];
        const errors = results.errors.map(
          (e) => `Row ${e.row !== undefined ? e.row + 1 : "?"}: ${e.message}`
        );
        resolve({ headers, rows, errors });
      },
      error(err: Error) {
        resolve({ headers: [], rows: [], errors: [err.message] });
      },
    });
  });
}

// ── Row mapping & validation ───────────────────────────────────────────────

export function applyMapping(
  row: Record<string, string>,
  headers: string[],
  mapping: ColumnMapping
): MappedRow {
  const result: MappedRow = {
    fullName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  };

  headers.forEach((header, index) => {
    const field = mapping[index];
    if (field && field !== "skip") {
      result[field] = (row[header] || "").trim();
    }
  });

  return result;
}

export function buildFullName(firstName: string, lastName: string, fullName?: string): string {
  // If fullName is provided, use it directly
  if (fullName?.trim()) return fullName.trim();
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex === -1) return { firstName: trimmed, lastName: "" };
  return {
    firstName: trimmed.slice(0, spaceIndex),
    lastName: trimmed.slice(spaceIndex + 1),
  };
}

export function validateRow(
  row: Record<string, string>,
  headers: string[],
  mapping: ColumnMapping
): ValidationResult {
  const mapped = applyMapping(row, headers, mapping);
  const errors: string[] = [];

  const fullName = buildFullName(mapped.firstName, mapped.lastName, mapped.fullName);
  if (!fullName) errors.push("Name is required");
  if (!mapped.email) errors.push("Email is required");
  else if (!isValidEmail(mapped.email)) errors.push("Invalid email format");
  if (!mapped.phone) errors.push("Phone is required");
  else if (!isValidPhone(mapped.phone.replace(/\D/g, "")))
    errors.push("Phone must be 10 digits");

  return { valid: errors.length === 0, errors };
}
