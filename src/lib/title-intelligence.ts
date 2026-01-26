// Title Intelligence Module
// Infer seniority and department from job titles using pattern matching

import type { SeniorityLevel, DepartmentType } from './constants/contact-intelligence';

// ============================================
// SENIORITY INFERENCE
// ============================================

// Patterns for seniority detection (order matters - more specific first)
const SENIORITY_PATTERNS: Array<{ level: SeniorityLevel; patterns: RegExp[] }> = [
  {
    level: 'C_LEVEL',
    patterns: [
      /^(ceo|cto|cmo|cfo|coo|cio|cso|cro|cpo|chief)/i,
      /\bchief\b/i,
      /^president/i,
      /\bpresident\b.*\bceo\b/i,
      /\bfounder\b/i,
      /\bco-founder\b/i,
      /\bowner\b/i,
      /\bpartner\b/i,
      /\bprincipal\b/i,
    ],
  },
  {
    level: 'VP',
    patterns: [
      /^(vp|svp|evp|avp)\b/i,
      /\bvice president\b/i,
      /\bvp\b/i,
      /^head of\b/i,
      /\bhead of\b/i,
      /\bglobal head\b/i,
      /\bgroup head\b/i,
    ],
  },
  {
    level: 'DIRECTOR',
    patterns: [
      /\bdirector\b/i,
      /\bexecutive director\b/i,
      /\bsenior director\b/i,
      /\bmanaging director\b/i,
      /\bassociate director\b/i,
      /\bgm\b/i,
      /\bgeneral manager\b/i,
    ],
  },
  {
    level: 'MANAGER',
    patterns: [
      /\bmanager\b/i,
      /\bsupervisor\b/i,
      /\blead\b/i,
      /\bteam lead\b/i,
      /\bsenior\s+(specialist|analyst|engineer|designer)/i,
      /\bprincipal\s+(specialist|analyst|engineer|designer)/i,
    ],
  },
];

/**
 * Infer seniority level from a job title
 */
export function inferSeniority(title: string | null | undefined): SeniorityLevel {
  if (!title) return 'INDIVIDUAL_CONTRIBUTOR';

  const normalizedTitle = title.trim().toLowerCase();

  for (const { level, patterns } of SENIORITY_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedTitle)) {
        return level;
      }
    }
  }

  return 'INDIVIDUAL_CONTRIBUTOR';
}

/**
 * Get seniority score (1-10) from title
 */
export function inferSeniorityScore(title: string | null | undefined): number {
  const seniority = inferSeniority(title);
  const scores: Record<SeniorityLevel, number> = {
    C_LEVEL: 10,
    VP: 8,
    DIRECTOR: 6,
    MANAGER: 4,
    INDIVIDUAL_CONTRIBUTOR: 2,
  };
  return scores[seniority];
}

// ============================================
// DEPARTMENT INFERENCE
// ============================================

const DEPARTMENT_PATTERNS: Array<{ dept: DepartmentType; patterns: RegExp[] }> = [
  {
    dept: 'MARKETING',
    patterns: [
      /\bmarketing\b/i,
      /\bbrand\b/i,
      /\bdigital\s+marketing\b/i,
      /\bgrowth\b/i,
      /\bdemand\s+gen/i,
      /\bcontent\b/i,
      /\bsocial\s+media\b/i,
      /\bcommunications\b/i,
      /\bpr\b/i,
      /\bpublic\s+relations\b/i,
    ],
  },
  {
    dept: 'CREATIVE',
    patterns: [
      /\bcreative\b/i,
      /\bdesign/i,
      /\bart\s+director\b/i,
      /\bux\b/i,
      /\bui\b/i,
      /\bcopywriter\b/i,
      /\bcopy\b/i,
      /\bvideo\b/i,
      /\bproduction\b/i,
      /\bstudio\b/i,
      /\bvisual\b/i,
    ],
  },
  {
    dept: 'EXECUTIVE',
    patterns: [
      /^(ceo|cto|cmo|cfo|coo|cio)/i,
      /\bchief\b/i,
      /\bpresident\b/i,
      /\bfounder\b/i,
      /\bowner\b/i,
      /\bboard\b/i,
    ],
  },
  {
    dept: 'PROCUREMENT',
    patterns: [
      /\bprocurement\b/i,
      /\bpurchasing\b/i,
      /\bsourcing\b/i,
      /\bvendor\b/i,
      /\bsupplier\b/i,
      /\bbuyer\b/i,
    ],
  },
  {
    dept: 'IT',
    patterns: [
      /\bit\b/i,
      /\btechnology\b/i,
      /\bengineering\b/i,
      /\bdeveloper\b/i,
      /\bsoftware\b/i,
      /\binfrastructure\b/i,
      /\bsecurity\b/i,
      /\bdata\b/i,
      /\banalytics\b/i,
    ],
  },
  {
    dept: 'OPERATIONS',
    patterns: [
      /\boperations\b/i,
      /\bops\b/i,
      /\bprocess\b/i,
      /\bproject\s+management\b/i,
      /\bprogram\b/i,
      /\bstrategy\b/i,
      /\bbusiness\s+development\b/i,
    ],
  },
  {
    dept: 'FINANCE',
    patterns: [
      /\bfinance\b/i,
      /\bfinancial\b/i,
      /\baccounting\b/i,
      /\bcontroller\b/i,
      /\btreasury\b/i,
      /\bbudget\b/i,
    ],
  },
  {
    dept: 'SALES',
    patterns: [
      /\bsales\b/i,
      /\baccount\s+executive\b/i,
      /\baccount\s+manager\b/i,
      /\bbusiness\s+development\b/i,
      /\bbd\b/i,
      /\brevenue\b/i,
    ],
  },
  {
    dept: 'LEGAL',
    patterns: [
      /\blegal\b/i,
      /\bcounsel\b/i,
      /\battorney\b/i,
      /\blawyer\b/i,
      /\bcompliance\b/i,
      /\bregulatory\b/i,
    ],
  },
];

/**
 * Infer department from a job title
 */
export function inferDepartment(title: string | null | undefined): DepartmentType {
  if (!title) return 'OTHER';

  const normalizedTitle = title.trim().toLowerCase();

  for (const { dept, patterns } of DEPARTMENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedTitle)) {
        return dept;
      }
    }
  }

  return 'OTHER';
}

// ============================================
// DECISION MAKER INFERENCE
// ============================================

/**
 * Infer if someone is likely a decision maker based on title
 */
export function isLikelyDecisionMaker(title: string | null | undefined): boolean {
  if (!title) return false;

  const seniority = inferSeniority(title);
  const department = inferDepartment(title);

  // C-Level and VPs are usually decision makers
  if (seniority === 'C_LEVEL' || seniority === 'VP') {
    return true;
  }

  // Directors in relevant departments
  if (seniority === 'DIRECTOR') {
    const relevantDepts: DepartmentType[] = ['MARKETING', 'CREATIVE', 'EXECUTIVE', 'OPERATIONS'];
    if (relevantDepts.includes(department)) {
      return true;
    }
  }

  // Specific titles that indicate decision making power
  const dmPatterns = [
    /\bhead\b/i,
    /\blead\b.*\bmarketing\b/i,
    /\blead\b.*\bcreative\b/i,
    /\bexecutive\b/i,
  ];

  const normalizedTitle = title.trim().toLowerCase();
  return dmPatterns.some(pattern => pattern.test(normalizedTitle));
}

/**
 * Suggest decision authority based on title analysis
 */
export function suggestDecisionAuthority(
  title: string | null | undefined
): 'DECISION_MAKER' | 'BUDGET_HOLDER' | 'INFLUENCER' | 'END_USER' | 'GATEKEEPER' | null {
  if (!title) return null;

  const seniority = inferSeniority(title);
  const department = inferDepartment(title);

  // C-Level are typically decision makers and budget holders
  if (seniority === 'C_LEVEL') {
    if (department === 'FINANCE') return 'BUDGET_HOLDER';
    return 'DECISION_MAKER';
  }

  // VPs are often decision makers or budget holders
  if (seniority === 'VP') {
    if (department === 'FINANCE' || department === 'PROCUREMENT') {
      return 'BUDGET_HOLDER';
    }
    if (department === 'MARKETING' || department === 'CREATIVE') {
      return 'DECISION_MAKER';
    }
    return 'INFLUENCER';
  }

  // Directors are usually influencers
  if (seniority === 'DIRECTOR') {
    return 'INFLUENCER';
  }

  // Procurement is often gatekeeper
  if (department === 'PROCUREMENT') {
    return 'GATEKEEPER';
  }

  // Creative/Marketing managers and ICs are end users
  if (department === 'CREATIVE' || department === 'MARKETING') {
    return 'END_USER';
  }

  return null;
}

// ============================================
// COMBINED ANALYSIS
// ============================================

export interface TitleAnalysis {
  originalTitle: string;
  seniority: SeniorityLevel;
  seniorityScore: number;
  department: DepartmentType;
  isLikelyDecisionMaker: boolean;
  suggestedAuthority: string | null;
}

/**
 * Perform full title analysis
 */
export function analyzeTitleIntelligence(title: string | null | undefined): TitleAnalysis | null {
  if (!title) return null;

  return {
    originalTitle: title,
    seniority: inferSeniority(title),
    seniorityScore: inferSeniorityScore(title),
    department: inferDepartment(title),
    isLikelyDecisionMaker: isLikelyDecisionMaker(title),
    suggestedAuthority: suggestDecisionAuthority(title),
  };
}

/**
 * Format a title for display (capitalize properly)
 */
export function formatTitle(title: string | null | undefined): string {
  if (!title) return '';

  // Handle common acronyms
  const acronyms = ['CEO', 'CTO', 'CMO', 'CFO', 'COO', 'CIO', 'VP', 'SVP', 'EVP', 'IT', 'UI', 'UX', 'PR'];

  return title
    .split(' ')
    .map(word => {
      const upper = word.toUpperCase();
      if (acronyms.includes(upper)) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
