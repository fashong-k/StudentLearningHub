import crypto from 'crypto';
import { db } from './db';
import { plagiarismChecks, plagiarismDatabase, submissions } from '@shared/schema';
import { eq, and, ne, sql } from 'drizzle-orm';

export interface PlagiarismResult {
  submissionId: number;
  similarityScore: number;
  matchedSources: MatchedSource[];
  suspiciousPatterns: SuspiciousPattern[];
  analysisResults: AnalysisResult;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface MatchedSource {
  sourceId: number;
  similarity: number;
  matchedText: string;
  sourceText: string;
  studentId: string;
  courseName: string;
  assignmentTitle: string;
  submissionDate: Date;
}

export interface SuspiciousPattern {
  type: 'repetitive_structure' | 'unusual_vocabulary' | 'inconsistent_style' | 'common_phrases';
  confidence: number;
  description: string;
  textSegment: string;
  startIndex: number;
  endIndex: number;
}

export interface AnalysisResult {
  overallScore: number;
  textLength: number;
  wordCount: number;
  uniqueWords: number;
  averageWordLength: number;
  sentenceCount: number;
  averageSentenceLength: number;
  readabilityScore: number;
  lexicalDiversity: number;
  processedAt: Date;
}

export class PlagiarismDetectionService {
  private static readonly SIMILARITY_THRESHOLD = 0.15; // 15% similarity threshold
  private static readonly SUSPICIOUS_THRESHOLD = 0.80; // 80% confidence for suspicious patterns
  private static readonly MIN_MATCH_LENGTH = 50; // Minimum character length for matches

  /**
   * Analyzes text for plagiarism by comparing against stored submissions
   */
  async analyzeSubmission(submissionId: number, text: string, checkedBy: string): Promise<PlagiarismResult> {
    try {
      // Create initial plagiarism check record
      const [plagiarismCheck] = await db
        .insert(plagiarismChecks)
        .values({
          submissionId,
          originalText: text,
          status: 'processing',
          checkedBy,
        })
        .returning();

      // Get submission details
      const submission = await db.query.submissions.findFirst({
        where: eq(submissions.id, submissionId),
        with: {
          assignment: {
            with: {
              course: true,
            },
          },
          student: true,
        },
      });

      if (!submission) {
        throw new Error('Submission not found');
      }

      // Perform plagiarism analysis
      const analysisResults = await this.performTextAnalysis(text);
      const matchedSources = await this.findSimilarSubmissions(
        text,
        submission.assignment.courseId,
        submission.assignment.id,
        submission.studentId
      );
      const suspiciousPatterns = await this.detectSuspiciousPatterns(text);
      const similarityScore = this.calculateOverallSimilarity(matchedSources, suspiciousPatterns);

      // Update plagiarism check with results
      await db
        .update(plagiarismChecks)
        .set({
          similarityScore: similarityScore.toString(),
          matchedSources: matchedSources,
          suspiciousPatterns: suspiciousPatterns,
          analysisResults: analysisResults,
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(plagiarismChecks.id, plagiarismCheck.id));

      // Store submission in plagiarism database for future comparisons
      await this.storeSubmissionForComparison(submission, text);

      return {
        submissionId,
        similarityScore,
        matchedSources,
        suspiciousPatterns,
        analysisResults,
        status: 'completed',
      };
    } catch (error) {
      console.error('Plagiarism analysis failed:', error);
      
      // Update status to failed
      await db
        .update(plagiarismChecks)
        .set({
          status: 'failed',
          analysisResults: { error: error.message },
          updatedAt: new Date(),
        })
        .where(eq(plagiarismChecks.submissionId, submissionId));

      throw error;
    }
  }

  /**
   * Performs comprehensive text analysis
   */
  private async performTextAnalysis(text: string): Promise<AnalysisResult> {
    const words = this.extractWords(text);
    const sentences = this.extractSentences(text);
    const uniqueWords = new Set(words.map(word => word.toLowerCase()));

    return {
      overallScore: 0, // Will be calculated later
      textLength: text.length,
      wordCount: words.length,
      uniqueWords: uniqueWords.size,
      averageWordLength: words.reduce((sum, word) => sum + word.length, 0) / words.length,
      sentenceCount: sentences.length,
      averageSentenceLength: words.length / sentences.length,
      readabilityScore: this.calculateReadabilityScore(words, sentences),
      lexicalDiversity: uniqueWords.size / words.length,
      processedAt: new Date(),
    };
  }

  /**
   * Finds similar submissions by comparing text content
   */
  private async findSimilarSubmissions(
    text: string,
    courseId: number,
    assignmentId: number,
    studentId: string
  ): Promise<MatchedSource[]> {
    // Get all submissions for comparison (excluding current student's submission)
    const similarSubmissions = await db
      .select()
      .from(plagiarismDatabase)
      .where(
        and(
          eq(plagiarismDatabase.courseId, courseId),
          eq(plagiarismDatabase.assignmentId, assignmentId),
          ne(plagiarismDatabase.studentId, studentId),
          eq(plagiarismDatabase.isActive, true)
        )
      );

    const matchedSources: MatchedSource[] = [];

    for (const submission of similarSubmissions) {
      const similarity = this.calculateTextSimilarity(text, submission.textContent);
      
      if (similarity >= this.SIMILARITY_THRESHOLD) {
        const matchedText = this.findMatchingSegments(text, submission.textContent);
        
        matchedSources.push({
          sourceId: submission.id,
          similarity: similarity * 100, // Convert to percentage
          matchedText: matchedText.query,
          sourceText: matchedText.source,
          studentId: submission.studentId,
          courseName: 'Course', // Will be populated from relations
          assignmentTitle: 'Assignment', // Will be populated from relations
          submissionDate: submission.submittedAt,
        });
      }
    }

    return matchedSources.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Detects suspicious patterns in text
   */
  private async detectSuspiciousPatterns(text: string): Promise<SuspiciousPattern[]> {
    const patterns: SuspiciousPattern[] = [];
    
    // Check for repetitive structure
    const repetitivePatterns = this.detectRepetitiveStructure(text);
    patterns.push(...repetitivePatterns);

    // Check for unusual vocabulary
    const vocabularyPatterns = this.detectUnusualVocabulary(text);
    patterns.push(...vocabularyPatterns);

    // Check for inconsistent writing style
    const stylePatterns = this.detectInconsistentStyle(text);
    patterns.push(...stylePatterns);

    // Check for common phrases
    const commonPhrases = this.detectCommonPhrases(text);
    patterns.push(...commonPhrases);

    return patterns.filter(pattern => pattern.confidence >= this.SUSPICIOUS_THRESHOLD);
  }

  /**
   * Stores submission text for future plagiarism comparisons
   */
  private async storeSubmissionForComparison(submission: any, text: string): Promise<void> {
    const textFingerprint = this.generateTextFingerprint(text);
    const wordCount = this.extractWords(text).length;

    await db
      .insert(plagiarismDatabase)
      .values({
        submissionId: submission.id,
        courseId: submission.assignment.courseId,
        studentId: submission.studentId,
        assignmentId: submission.assignment.id,
        textContent: text,
        textFingerprint,
        wordCount,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: plagiarismDatabase.submissionId,
        set: {
          textContent: text,
          textFingerprint,
          wordCount,
          submittedAt: new Date(),
        },
      });
  }

  /**
   * Calculates overall similarity score based on matches and patterns
   */
  private calculateOverallSimilarity(
    matchedSources: MatchedSource[],
    suspiciousPatterns: SuspiciousPattern[]
  ): number {
    let score = 0;

    // Weight matched sources (60% of total score)
    if (matchedSources.length > 0) {
      const averageSourceSimilarity = matchedSources
        .slice(0, 3) // Consider top 3 matches
        .reduce((sum, source) => sum + source.similarity, 0) / Math.min(matchedSources.length, 3);
      score += averageSourceSimilarity * 0.6;
    }

    // Weight suspicious patterns (40% of total score)
    if (suspiciousPatterns.length > 0) {
      const averagePatternConfidence = suspiciousPatterns
        .reduce((sum, pattern) => sum + pattern.confidence, 0) / suspiciousPatterns.length;
      score += averagePatternConfidence * 100 * 0.4;
    }

    return Math.min(score, 100); // Cap at 100%
  }

  /**
   * Calculates text similarity using multiple algorithms
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple word overlap similarity
    const words1 = new Set(this.extractWords(text1.toLowerCase()));
    const words2 = new Set(this.extractWords(text2.toLowerCase()));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    const jaccardSimilarity = intersection.size / union.size;
    
    // N-gram similarity
    const ngramSimilarity = this.calculateNGramSimilarity(text1, text2, 3);
    
    // Combine similarities
    return (jaccardSimilarity * 0.5) + (ngramSimilarity * 0.5);
  }

  /**
   * Calculates N-gram similarity between two texts
   */
  private calculateNGramSimilarity(text1: string, text2: string, n: number): number {
    const ngrams1 = this.generateNGrams(text1, n);
    const ngrams2 = this.generateNGrams(text2, n);
    
    const set1 = new Set(ngrams1);
    const set2 = new Set(ngrams2);
    
    const intersection = new Set([...set1].filter(ngram => set2.has(ngram)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * Generates N-grams from text
   */
  private generateNGrams(text: string, n: number): string[] {
    const words = this.extractWords(text.toLowerCase());
    const ngrams: string[] = [];
    
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.push(words.slice(i, i + n).join(' '));
    }
    
    return ngrams;
  }

  /**
   * Finds matching text segments between two texts
   */
  private findMatchingSegments(text1: string, text2: string): { query: string; source: string } {
    const words1 = this.extractWords(text1);
    const words2 = this.extractWords(text2);
    
    let longestMatch = '';
    let longestMatchSource = '';
    
    for (let i = 0; i < words1.length; i++) {
      for (let j = 0; j < words2.length; j++) {
        let k = 0;
        while (
          i + k < words1.length &&
          j + k < words2.length &&
          words1[i + k].toLowerCase() === words2[j + k].toLowerCase()
        ) {
          k++;
        }
        
        if (k > 0) {
          const match = words1.slice(i, i + k).join(' ');
          const matchSource = words2.slice(j, j + k).join(' ');
          
          if (match.length > longestMatch.length && match.length >= this.MIN_MATCH_LENGTH) {
            longestMatch = match;
            longestMatchSource = matchSource;
          }
        }
      }
    }
    
    return { query: longestMatch, source: longestMatchSource };
  }

  /**
   * Detects repetitive structure patterns
   */
  private detectRepetitiveStructure(text: string): SuspiciousPattern[] {
    const patterns: SuspiciousPattern[] = [];
    const sentences = this.extractSentences(text);
    
    // Check for repeated sentence structures
    const structureMap = new Map<string, number>();
    
    sentences.forEach(sentence => {
      const structure = this.getSentenceStructure(sentence);
      structureMap.set(structure, (structureMap.get(structure) || 0) + 1);
    });
    
    structureMap.forEach((count, structure) => {
      if (count > 3) { // More than 3 similar structures
        patterns.push({
          type: 'repetitive_structure',
          confidence: Math.min(count / sentences.length, 1),
          description: `Repetitive sentence structure detected (${count} occurrences)`,
          textSegment: structure,
          startIndex: 0,
          endIndex: text.length,
        });
      }
    });
    
    return patterns;
  }

  /**
   * Detects unusual vocabulary patterns
   */
  private detectUnusualVocabulary(text: string): SuspiciousPattern[] {
    const patterns: SuspiciousPattern[] = [];
    const words = this.extractWords(text);
    
    // Check for unusually advanced vocabulary
    const advancedWords = words.filter(word => word.length > 12);
    const advancedRatio = advancedWords.length / words.length;
    
    if (advancedRatio > 0.1) { // More than 10% advanced words
      patterns.push({
        type: 'unusual_vocabulary',
        confidence: Math.min(advancedRatio * 2, 1),
        description: `High proportion of advanced vocabulary (${(advancedRatio * 100).toFixed(1)}%)`,
        textSegment: advancedWords.slice(0, 5).join(', '),
        startIndex: 0,
        endIndex: text.length,
      });
    }
    
    return patterns;
  }

  /**
   * Detects inconsistent writing style
   */
  private detectInconsistentStyle(text: string): SuspiciousPattern[] {
    const patterns: SuspiciousPattern[] = [];
    const sentences = this.extractSentences(text);
    
    // Check for inconsistent sentence lengths
    const lengths = sentences.map(s => s.length);
    const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev > avgLength * 0.5) { // High variance in sentence length
      patterns.push({
        type: 'inconsistent_style',
        confidence: Math.min(stdDev / avgLength, 1),
        description: `Inconsistent sentence lengths detected (std dev: ${stdDev.toFixed(1)})`,
        textSegment: `Shortest: ${Math.min(...lengths)} chars, Longest: ${Math.max(...lengths)} chars`,
        startIndex: 0,
        endIndex: text.length,
      });
    }
    
    return patterns;
  }

  /**
   * Detects common phrases that might indicate plagiarism
   */
  private detectCommonPhrases(text: string): SuspiciousPattern[] {
    const patterns: SuspiciousPattern[] = [];
    const commonPhrases = [
      'according to research',
      'studies have shown',
      'it is widely accepted',
      'research indicates',
      'scholars argue',
      'evidence suggests',
      'it can be concluded',
      'in conclusion',
      'furthermore',
      'nevertheless',
      'however',
      'moreover',
    ];
    
    let commonPhraseCount = 0;
    const foundPhrases: string[] = [];
    
    commonPhrases.forEach(phrase => {
      if (text.toLowerCase().includes(phrase)) {
        commonPhraseCount++;
        foundPhrases.push(phrase);
      }
    });
    
    if (commonPhraseCount > 5) { // More than 5 common phrases
      patterns.push({
        type: 'common_phrases',
        confidence: Math.min(commonPhraseCount / 10, 1),
        description: `High usage of common academic phrases (${commonPhraseCount} found)`,
        textSegment: foundPhrases.slice(0, 3).join(', '),
        startIndex: 0,
        endIndex: text.length,
      });
    }
    
    return patterns;
  }

  /**
   * Utility functions
   */
  private extractWords(text: string): string[] {
    return text.match(/\b\w+\b/g) || [];
  }

  private extractSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }

  private getSentenceStructure(sentence: string): string {
    const words = this.extractWords(sentence);
    return words.map(word => {
      if (word.length > 8) return 'LONG';
      if (word.length > 5) return 'MED';
      return 'SHORT';
    }).join('-');
  }

  private calculateReadabilityScore(words: string[], sentences: string[]): number {
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = words.reduce((sum, word) => sum + this.countSyllables(word), 0) / words.length;
    
    // Simplified Flesch Reading Ease score
    return 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  }

  private countSyllables(word: string): number {
    return word.toLowerCase().replace(/[^aeiouy]/g, '').length || 1;
  }

  private generateTextFingerprint(text: string): string {
    const normalizedText = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    return crypto.createHash('sha256').update(normalizedText).digest('hex');
  }

  /**
   * Gets plagiarism check results for a submission
   */
  async getPlagiarismResults(submissionId: number): Promise<PlagiarismResult | null> {
    const result = await db.query.plagiarismChecks.findFirst({
      where: eq(plagiarismChecks.submissionId, submissionId),
      with: {
        submission: {
          with: {
            student: true,
            assignment: true,
          },
        },
        checker: true,
      },
    });

    if (!result) return null;

    return {
      submissionId: result.submissionId,
      similarityScore: parseFloat(result.similarityScore || '0'),
      matchedSources: result.matchedSources as MatchedSource[],
      suspiciousPatterns: result.suspiciousPatterns as SuspiciousPattern[],
      analysisResults: result.analysisResults as AnalysisResult,
      status: result.status,
    };
  }

  /**
   * Gets all plagiarism checks for a course
   */
  async getCoursePlagiarismChecks(courseId: number): Promise<PlagiarismResult[]> {
    const results = await db.query.plagiarismChecks.findMany({
      with: {
        submission: {
          with: {
            assignment: true,
            student: true,
          },
        },
        checker: true,
      },
    });

    return results
      .filter(result => result.submission.assignment.courseId === courseId)
      .map(result => ({
        submissionId: result.submissionId,
        similarityScore: parseFloat(result.similarityScore || '0'),
        matchedSources: result.matchedSources as MatchedSource[],
        suspiciousPatterns: result.suspiciousPatterns as SuspiciousPattern[],
        analysisResults: result.analysisResults as AnalysisResult,
        status: result.status,
      }));
  }
}

export const plagiarismService = new PlagiarismDetectionService();