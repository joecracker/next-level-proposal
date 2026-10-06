import { CompanyConfig, LegalTerms, ScopeCategory, Proposal } from '../types';

export const DEFAULT_COMPANY_CONFIG: CompanyConfig = {
  companyName: "",
  tagline: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  licenseNumber: "",
  logoUrl: "",
};

export const DEFAULT_LEGAL_TERMS: LegalTerms = {
  agreementText: `Payment Note: Any adjustments to the contract price are to be applied toward the final balance, unless otherwise noted with a change order. Unforeseen carpentry, electrical, plumbing, heating, and cooling will be discussed with homeowner and a change order signed. Work will be figured at time and material.`,
  dueAtSigning: "",
  dueAtStart: "",
  dueUponCompletion: "",
  warrantyInfo: "All work performed by the contractor comes with a state-licensed craftsmanship guarantee.",
  contractorTitle: "Contractor / Company Representative",
  clientTitle: "Homeowner / Client",
};

/**
 * The sections of the printed proposal, in the order they print.
 * Names are sentence case — the printed sheet adds the trailing colon.
 * This order is the one Tim asked for: Carpentry before Plumbing and Electrical.
 */
export const DEFAULT_CATEGORIES: ScopeCategory[] = [
  {
    id: "cat-1",
    name: "Material description",
    description: "Key materials, lumber specs, products, and finish selections",
    isConfirmed: false,
    items: []
  },
  {
    id: "cat-2",
    name: "Demolition",
    description: "Tear-down, debris containment, and site prep",
    isConfirmed: false,
    items: []
  },
  {
    id: "cat-3",
    name: "Carpentry",
    description: "Structural framing, trim, crown molding, doors, and cabinet installation",
    isConfirmed: false,
    items: []
  },
  {
    id: "cat-4",
    name: "Plumbing",
    description: "Supply lines, drainage, valves, and fixture hookups",
    isConfirmed: false,
    items: []
  },
  {
    id: "cat-5",
    name: "Electrical",
    description: "Wiring, breakers, switches, outlets, and lighting fixtures",
    isConfirmed: false,
    items: []
  },
  {
    id: "cat-6",
    name: "Allowances figured in price of job to be adjusted upon selection",
    description: "Pre-budgeted fixture, tile, or item allowances included in contract quote",
    isConfirmed: false,
    items: []
  },
  {
    id: "cat-7",
    name: "Homeowner to supply",
    description: "Materials, appliances, or fixtures provided directly by the property owner",
    isConfirmed: false,
    items: []
  }
];

/** The old ALL-CAPS section names, mapped to the sentence-case names above. */
const LEGACY_CATEGORY_NAMES: Record<string, string> = {
  'MATERIAL DESCRIPTION': 'Material description',
  'DEMOLITION': 'Demolition',
  'CARPENTRY': 'Carpentry',
  'PLUMBING': 'Plumbing',
  'ELECTRICAL': 'Electrical',
  'ALLOWANCES FIGURED IN PRICE OF JOB': 'Allowances figured in price of job to be adjusted upon selection',
  'HOMEOWNER TO SUPPLY': 'Homeowner to supply',
};

/**
 * Brings an already-saved proposal's sections onto the current names and order.
 * Sections Tim named himself are left alone and kept after the standard ones.
 */
export const normalizeCategories = (categories: ScopeCategory[] | undefined): ScopeCategory[] => {
  const renamed = (categories || []).map((cat) =>
    LEGACY_CATEGORY_NAMES[cat.name] ? { ...cat, name: LEGACY_CATEGORY_NAMES[cat.name] } : cat
  );
  const order = DEFAULT_CATEGORIES.map((cat) => cat.name);
  const standard = renamed.filter((cat) => order.includes(cat.name));
  const custom = renamed.filter((cat) => !order.includes(cat.name));
  standard.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
  return [...standard, ...custom];
};

export const SAMPLE_PROPOSAL: Proposal = {
  id: "prop-new-001",
  title: "New Construction Contract",
  createdAt: new Date().toISOString().split('T')[0],
  updatedAt: new Date().toISOString().split('T')[0],
  status: "draft",
  clientInfo: {
    clientName: "",
    address: "",
    phone: "",
    email: "",
    projectSite: "",
    proposalNumber: "",
    proposalDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    salesRep: ""
  },
  categories: DEFAULT_CATEGORIES,
  legalTerms: DEFAULT_LEGAL_TERMS,
  companyConfig: DEFAULT_COMPANY_CONFIG,
  totalEstimate: "",
  notes: ""
};

