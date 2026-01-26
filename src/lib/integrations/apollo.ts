// Apollo.io API Integration for Contact Enrichment
// Docs: https://apolloio.github.io/apollo-api-docs/

export interface ApolloPersonMatch {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  linkedin_url: string | null;
  title: string | null;
  email: string | null;
  email_status: string | null;
  photo_url: string | null;
  twitter_url: string | null;
  github_url: string | null;
  facebook_url: string | null;
  headline: string | null;
  organization_id: string | null;
  employment_history: Array<{
    organization_name: string;
    title: string;
    start_date: string | null;
    end_date: string | null;
    current: boolean;
  }>;
  organization: {
    id: string;
    name: string;
    website_url: string | null;
    linkedin_url: string | null;
    primary_domain: string | null;
    estimated_num_employees: number | null;
    industry: string | null;
  } | null;
  phone_numbers: Array<{
    raw_number: string;
    sanitized_number: string;
    type: string;
  }>;
  city: string | null;
  state: string | null;
  country: string | null;
  seniority: string | null;
  departments: string[];
}

export interface ApolloSearchResponse {
  people: ApolloPersonMatch[];
  pagination: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
}

export interface ApolloEnrichResponse {
  person: ApolloPersonMatch | null;
}

export interface EnrichmentResult {
  success: boolean;
  email?: string | null;
  phone?: string | null;
  linkedInUrl?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  seniority?: string | null;
  photoUrl?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  companyName?: string | null;
  companyWebsite?: string | null;
  companySize?: number | null;
  companyIndustry?: string | null;
  rawData?: ApolloPersonMatch;
  error?: string;
}

// Apollo API uses /api/v1 prefix (not just /v1)
const APOLLO_API_BASE = 'https://api.apollo.io/api/v1';

function getApiKey(): string {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    throw new Error('APOLLO_API_KEY environment variable is not set');
  }
  return apiKey;
}

// Common headers for Apollo API requests
function getHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Api-Key': getApiKey(),
  };
}

/**
 * Search for a person by name and company domain
 */
export async function searchPerson(
  firstName: string,
  lastName: string,
  companyDomain?: string
): Promise<ApolloPersonMatch[]> {
  const body: Record<string, unknown> = {
    q_keywords: `${firstName} ${lastName}`,
    per_page: 5,
    // Request contact details
    reveal_personal_emails: true,
    reveal_phone_number: true,
  };

  if (companyDomain) {
    body.q_organization_domains = companyDomain;
  }

  const response = await fetch(`${APOLLO_API_BASE}/mixed_people/search`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Apollo API error: ${response.status} - ${errorText}`);
  }

  const data: ApolloSearchResponse = await response.json();
  return data.people || [];
}

/**
 * Enrich a person by email
 */
export async function enrichByEmail(email: string): Promise<EnrichmentResult> {
  const response = await fetch(`${APOLLO_API_BASE}/people/match`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      email: email,
      // Request contact details (requires credits on paid plans)
      reveal_personal_emails: true,
      reveal_phone_number: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      error: `Apollo API error: ${response.status} - ${errorText}`,
    };
  }

  const data: ApolloEnrichResponse = await response.json();

  if (!data.person) {
    return {
      success: false,
      error: 'No person found with this email',
    };
  }

  return mapPersonToEnrichmentResult(data.person);
}

/**
 * Enrich a person by name and company
 */
export async function enrichByNameAndCompany(
  firstName: string,
  lastName: string,
  companyName?: string,
  companyDomain?: string
): Promise<EnrichmentResult> {
  const body: Record<string, unknown> = {
    first_name: firstName,
    last_name: lastName,
    // Request contact details (requires credits on paid plans)
    reveal_personal_emails: true,
    reveal_phone_number: true,
  };

  if (companyName) {
    body.organization_name = companyName;
  }

  if (companyDomain) {
    body.domain = companyDomain;
  }

  const response = await fetch(`${APOLLO_API_BASE}/people/match`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      error: `Apollo API error: ${response.status} - ${errorText}`,
    };
  }

  const data: ApolloEnrichResponse = await response.json();

  if (!data.person) {
    return {
      success: false,
      error: 'No person found matching these criteria',
    };
  }

  return mapPersonToEnrichmentResult(data.person);
}

/**
 * Enrich a person by LinkedIn URL
 */
export async function enrichByLinkedIn(linkedInUrl: string): Promise<EnrichmentResult> {
  const response = await fetch(`${APOLLO_API_BASE}/people/match`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      linkedin_url: linkedInUrl,
      // Request contact details (requires credits on paid plans)
      reveal_personal_emails: true,
      reveal_phone_number: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      error: `Apollo API error: ${response.status} - ${errorText}`,
    };
  }

  const data: ApolloEnrichResponse = await response.json();

  if (!data.person) {
    return {
      success: false,
      error: 'No person found with this LinkedIn URL',
    };
  }

  return mapPersonToEnrichmentResult(data.person);
}

/**
 * Smart enrich - tries multiple methods to find the person
 */
export async function smartEnrich(params: {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  linkedInUrl?: string;
  companyName?: string;
  companyDomain?: string;
}): Promise<EnrichmentResult> {
  // Parse full name if first/last not provided
  let firstName = params.firstName;
  let lastName = params.lastName;

  if (!firstName && !lastName && params.fullName) {
    const nameParts = params.fullName.trim().split(/\s+/);
    firstName = nameParts[0];
    lastName = nameParts.slice(1).join(' ') || undefined;
  }

  // Try LinkedIn first if available (most reliable)
  if (params.linkedInUrl) {
    const result = await enrichByLinkedIn(params.linkedInUrl);
    if (result.success) return result;
  }

  // Try email if available
  if (params.email) {
    const result = await enrichByEmail(params.email);
    if (result.success) return result;
  }

  // Try name + company
  if (firstName && lastName) {
    const result = await enrichByNameAndCompany(
      firstName,
      lastName,
      params.companyName,
      params.companyDomain
    );
    if (result.success) return result;
  }

  // If only first name, try search
  if (firstName) {
    try {
      const people = await searchPerson(
        firstName,
        lastName || '',
        params.companyDomain
      );
      if (people.length > 0) {
        return mapPersonToEnrichmentResult(people[0]);
      }
    } catch {
      // Search failed, continue
    }
  }

  return {
    success: false,
    error: 'Could not find person with provided information',
  };
}

function mapPersonToEnrichmentResult(person: ApolloPersonMatch): EnrichmentResult {
  const primaryPhone = person.phone_numbers?.[0];

  return {
    success: true,
    email: person.email,
    phone: primaryPhone?.sanitized_number || primaryPhone?.raw_number || null,
    linkedInUrl: person.linkedin_url,
    jobTitle: person.title,
    department: person.departments?.[0] || null,
    seniority: mapApolloSeniority(person.seniority),
    photoUrl: person.photo_url,
    city: person.city,
    state: person.state,
    country: person.country,
    companyName: person.organization?.name || null,
    companyWebsite: person.organization?.website_url || null,
    companySize: person.organization?.estimated_num_employees || null,
    companyIndustry: person.organization?.industry || null,
    rawData: person,
  };
}

function mapApolloSeniority(apolloSeniority: string | null): string | null {
  if (!apolloSeniority) return null;

  const mapping: Record<string, string> = {
    'owner': 'C_LEVEL',
    'founder': 'C_LEVEL',
    'c_suite': 'C_LEVEL',
    'partner': 'C_LEVEL',
    'vp': 'VP',
    'director': 'DIRECTOR',
    'manager': 'MANAGER',
    'senior': 'SENIOR',
    'entry': 'INDIVIDUAL_CONTRIBUTOR',
    'intern': 'INDIVIDUAL_CONTRIBUTOR',
  };

  return mapping[apolloSeniority.toLowerCase()] || null;
}

/**
 * Check if Apollo API is configured
 */
export function isApolloConfigured(): boolean {
  return !!process.env.APOLLO_API_KEY;
}
