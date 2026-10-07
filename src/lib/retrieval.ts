// Knowledge Retrieval Service
// Implements simple keyword/TF-IDF based retrieval for the prototype
// In production, replace with pgvector or a dedicated vector database

import type { RetrievedChunk, RetrievalResult, EquipmentType } from '@/types';
import { prisma } from './prisma';

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

function computeRelevance(chunkText: string, queryTokens: string[]): number {
  const chunkTokens = tokenize(chunkText);
  const chunkSet = new Set(chunkTokens);
  let matches = 0;
  for (const qt of queryTokens) {
    if (chunkSet.has(qt)) matches++;
    // Partial match
    else if (chunkTokens.some(ct => ct.includes(qt) || qt.includes(ct))) matches += 0.5;
  }
  return matches / Math.max(queryTokens.length, 1);
}

export async function retrieveRelevantChunks(params: {
  equipmentType?: EquipmentType;
  query: string;
  topK?: number;
}): Promise<RetrievalResult> {
  const { equipmentType, query, topK = 5 } = params;

  try {
    // Get all indexed chunks for this equipment type
    const whereClause: Record<string, unknown> = {
      document: {
        status: 'INDEXED',
      },
    };

    if (equipmentType) {
      whereClause.document = {
        status: 'INDEXED',
        OR: [
          { equipmentType },
          { equipmentType: null }, // General documents apply to all types
        ],
      };
    }

    const chunks = await prisma.knowledgeChunk.findMany({
      where: whereClause,
      include: {
        document: {
          select: {
            id: true,
            name: true,
            equipmentType: true,
          },
        },
      },
      take: 200, // Load a larger set to rank from
    });

    if (chunks.length === 0) {
      return { chunks: [], success: true };
    }

    // Score each chunk
    const queryTokens = tokenize(query);
    const scored = chunks.map(chunk => ({
      chunk,
      relevance: computeRelevance(chunk.text, queryTokens),
    }));

    // Sort by relevance descending, take top K
    scored.sort((a, b) => b.relevance - a.relevance);
    const top = scored.slice(0, topK).filter(s => s.relevance > 0);

    const results: RetrievedChunk[] = top.map(({ chunk, relevance }) => ({
      id: chunk.id,
      documentId: chunk.documentId,
      documentName: chunk.document.name,
      equipmentType: chunk.document.equipmentType as EquipmentType | undefined,
      text: chunk.text,
      pageNumber: chunk.pageNumber ?? undefined,
      section: chunk.section ?? undefined,
      relevance,
    }));

    return { chunks: results, success: true };
  } catch (error) {
    console.error('[RetrievalService] Error:', error);
    return {
      chunks: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown retrieval error',
    };
  }
}

// Process and index a text document into chunks
export async function indexDocumentChunks(
  documentId: string,
  text: string,
  chunkSize: number = 500,
  overlap: number = 100,
): Promise<void> {
  // Split by paragraphs first, then by size
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const chunks: Array<{ text: string; pageNumber?: number; section?: string }> = [];

  let currentChunk = '';
  let currentSection = '';
  let pageNumber = 1;

  for (const para of paragraphs) {
    // Detect page markers (e.g., "Page 42", "-- 42 --")
    const pageMatch = para.match(/\bpage\s+(\d+)\b/i) || para.match(/^--\s*(\d+)\s*--/);
    if (pageMatch) {
      pageNumber = parseInt(pageMatch[1]);
    }

    // Detect section headers (all caps or ### style)
    if (para.match(/^[A-Z][A-Z\s]{5,}:?$/) || para.match(/^#{1,4}\s/)) {
      currentSection = para.replace(/^#{1,4}\s/, '').trim();
    }

    if (currentChunk.length + para.length > chunkSize) {
      if (currentChunk.trim()) {
        chunks.push({
          text: currentChunk.trim(),
          pageNumber,
          section: currentSection || undefined,
        });
      }
      // Overlap: keep last overlap characters
      currentChunk = currentChunk.slice(-overlap) + '\n' + para;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      pageNumber,
      section: currentSection || undefined,
    });
  }

  // Store chunks in database
  await prisma.knowledgeChunk.deleteMany({ where: { documentId } });
  
  for (let i = 0; i < chunks.length; i++) {
    await prisma.knowledgeChunk.create({
      data: {
        documentId,
        text: chunks[i].text,
        pageNumber: chunks[i].pageNumber,
        section: chunks[i].section,
        chunkIndex: i,
      },
    });
  }
}
