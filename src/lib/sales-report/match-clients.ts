// Client Matching Logic for Sales Report Import
// Matches deal names from PDF to existing clients in the database

import { prisma } from '@/lib/db';
import { ClientMatch } from '@/lib/types/sales-report';

/**
 * Find matching clients for a deal name
 * Uses multiple matching strategies in order of confidence
 */
export async function findMatchingClients(
  dealName: string,
  existingClientIds?: string[]
): Promise<ClientMatch[]> {
  // Normalize the deal name for matching
  const normalizedDealName = normalizeName(dealName);

  // Extract potential parent company (e.g., "Saatchi" from "Saatchi (Toyota)")
  const { baseName, endClient } = extractParentAndEndClient(dealName);

  // Fetch all clients (or filtered subset)
  const whereClause = existingClientIds?.length
    ? { id: { in: existingClientIds } }
    : {};

  const allClients = await prisma.client.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      vertical: true,
      dealOwner: true,
    },
  });

  const matches: ClientMatch[] = [];

  for (const client of allClients) {
    const normalizedClientName = normalizeName(client.name);

    // 1. Exact match
    if (normalizedClientName === normalizedDealName) {
      matches.push({
        clientId: client.id,
        clientName: client.name,
        confidence: 'exact',
        score: 100,
        reason: 'Exact name match',
      });
      continue;
    }

    // 2. Base name exact match (e.g., "Saatchi" matches "Saatchi (Toyota)")
    const clientBaseName = extractParentAndEndClient(client.name).baseName;
    if (clientBaseName === baseName && baseName.length > 2) {
      matches.push({
        clientId: client.id,
        clientName: client.name,
        confidence: 'partial',
        score: 85,
        reason: `Base name match: "${baseName}"`,
      });
      continue;
    }

    // 3. Contains match (one name contains the other)
    if (normalizedClientName.includes(normalizedDealName) ||
        normalizedDealName.includes(normalizedClientName)) {
      const shorterLength = Math.min(normalizedClientName.length, normalizedDealName.length);
      const score = Math.round((shorterLength / normalizedDealName.length) * 70);
      if (score >= 50) {
        matches.push({
          clientId: client.id,
          clientName: client.name,
          confidence: 'partial',
          score,
          reason: 'Partial name match',
        });
        continue;
      }
    }

    // 4. Fuzzy match using Levenshtein distance
    const distance = levenshteinDistance(normalizedClientName, normalizedDealName);
    const maxLength = Math.max(normalizedClientName.length, normalizedDealName.length);
    const similarity = 1 - (distance / maxLength);

    if (similarity >= 0.7) {
      const score = Math.round(similarity * 60);
      matches.push({
        clientId: client.id,
        clientName: client.name,
        confidence: 'fuzzy',
        score,
        reason: `Similar name (${Math.round(similarity * 100)}% match)`,
      });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  // Return top 5 matches
  return matches.slice(0, 5);
}

/**
 * Normalize a name for comparison
 * - Lowercase
 * - Remove common suffixes (Inc, LLC, etc.)
 * - Remove punctuation and extra whitespace
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*(inc\.?|llc\.?|ltd\.?|corp\.?|corporation|company|co\.?)\s*$/i, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract parent company and end client from deal names
 * E.g., "Saatchi (Toyota)" -> { baseName: "saatchi", endClient: "toyota" }
 * E.g., "Treefort Microdrama" -> { baseName: "treefort", endClient: null }
 */
function extractParentAndEndClient(dealName: string): {
  baseName: string;
  endClient: string | null;
} {
  // Pattern: "Agency (Client)" or "Agency - Client"
  const parenthesesMatch = dealName.match(/^(.+?)\s*\((.+?)\)\s*$/);
  if (parenthesesMatch) {
    return {
      baseName: normalizeName(parenthesesMatch[1]),
      endClient: normalizeName(parenthesesMatch[2]),
    };
  }

  const dashMatch = dealName.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (dashMatch) {
    return {
      baseName: normalizeName(dashMatch[1]),
      endClient: normalizeName(dashMatch[2]),
    };
  }

  // Check for sub-deal patterns (e.g., "Treefort Microdrama" -> parent "Treefort")
  const words = dealName.split(/\s+/);
  if (words.length > 1) {
    // First word is likely the parent company
    return {
      baseName: normalizeName(words[0]),
      endClient: null,
    };
  }

  return {
    baseName: normalizeName(dealName),
    endClient: null,
  };
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Batch match multiple deals to clients
 * More efficient than calling findMatchingClients for each deal
 */
export async function batchMatchDeals(
  dealNames: string[]
): Promise<Map<string, ClientMatch[]>> {
  // Fetch all clients once
  const allClients = await prisma.client.findMany({
    select: {
      id: true,
      name: true,
      vertical: true,
      dealOwner: true,
    },
  });

  const results = new Map<string, ClientMatch[]>();

  for (const dealName of dealNames) {
    const matches: ClientMatch[] = [];
    const normalizedDealName = normalizeName(dealName);
    const { baseName } = extractParentAndEndClient(dealName);

    for (const client of allClients) {
      const normalizedClientName = normalizeName(client.name);

      // Exact match
      if (normalizedClientName === normalizedDealName) {
        matches.push({
          clientId: client.id,
          clientName: client.name,
          confidence: 'exact',
          score: 100,
          reason: 'Exact name match',
        });
        continue;
      }

      // Base name match
      const clientBaseName = extractParentAndEndClient(client.name).baseName;
      if (clientBaseName === baseName && baseName.length > 2) {
        matches.push({
          clientId: client.id,
          clientName: client.name,
          confidence: 'partial',
          score: 85,
          reason: `Base name match: "${baseName}"`,
        });
        continue;
      }

      // Contains match
      if (normalizedClientName.includes(normalizedDealName) ||
          normalizedDealName.includes(normalizedClientName)) {
        const shorterLength = Math.min(normalizedClientName.length, normalizedDealName.length);
        const score = Math.round((shorterLength / normalizedDealName.length) * 70);
        if (score >= 50) {
          matches.push({
            clientId: client.id,
            clientName: client.name,
            confidence: 'partial',
            score,
            reason: 'Partial name match',
          });
          continue;
        }
      }

      // Fuzzy match
      const distance = levenshteinDistance(normalizedClientName, normalizedDealName);
      const maxLength = Math.max(normalizedClientName.length, normalizedDealName.length);
      const similarity = 1 - (distance / maxLength);

      if (similarity >= 0.7) {
        const score = Math.round(similarity * 60);
        matches.push({
          clientId: client.id,
          clientName: client.name,
          confidence: 'fuzzy',
          score,
          reason: `Similar name (${Math.round(similarity * 100)}% match)`,
        });
      }
    }

    // Sort and limit
    matches.sort((a, b) => b.score - a.score);
    results.set(dealName, matches.slice(0, 5));
  }

  return results;
}

/**
 * Determine suggested action for a deal based on matches
 */
export function getSuggestedAction(
  matches: ClientMatch[]
): 'use_match' | 'create_new' | 'review' {
  if (matches.length === 0) {
    return 'create_new';
  }

  const bestMatch = matches[0];

  // High confidence match - suggest using it
  if (bestMatch.confidence === 'exact' || bestMatch.score >= 85) {
    return 'use_match';
  }

  // Multiple potential matches or low confidence - needs review
  if (matches.length > 1 || bestMatch.score < 70) {
    return 'review';
  }

  // Single decent match - suggest using it
  return 'use_match';
}
