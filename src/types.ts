export interface ClientInfo {
  clientName: string;
  address: string;
  phone: string;
  email: string;
  projectSite: string;
  proposalNumber: string;
  proposalDate: string;
  salesRep: string;
}

export interface ScopeItem {
  id: string;
  text: string;
}

export interface ScopeCategory {
  id: string;
  name: string;
  description?: string;
  items: ScopeItem[];
  isConfirmed: boolean;
}

export interface LegalTerms {
  agreementText: string;
  dueAtSigning?: string;
  dueAtStart?: string;
  dueUponCompletion?: string;
  warrantyInfo: string;
  contractorTitle: string;
  clientTitle: string;
}

export type HeaderFontId = 'arial' | 'times' | 'georgia' | 'verdana' | 'trebuchet' | 'courier';

/** How the company block at the top of the printed proposal looks. Saved per company profile. */
export interface HeaderStyle {
  nameFont: HeaderFontId;
  nameSizePt: number;
  nameBold: boolean;
  nameItalic: boolean;
  detailSizePt: number;
  detailBold: boolean;
  logoHeightPx: number;
}

export interface CompanyConfig {
  companyName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  licenseNumber: string;
  logoUrl: string;
  /** Optional. When missing, the standard look is used (see lib/headerStyle.ts). */
  headerStyle?: HeaderStyle;
}

export interface Proposal {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'confirmed' | 'completed';
  clientInfo: ClientInfo;
  categories: ScopeCategory[];
  legalTerms: LegalTerms;
  companyConfig: CompanyConfig;
  totalEstimate?: string;
  notes?: string;
}

export type ViewMode =
  | 'home'
  | 'wizard'
  | 'preview'
  | 'history'
  | 'import'
  | 'estimate'
  | 'settings'
  | 'howto';
