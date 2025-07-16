import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, CheckCircle, FileText, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

interface PlagiarismResultsProps {
  submissionId: number;
  results: PlagiarismResult | null;
  onCheckPlagiarism: (submissionId: number) => void;
  isLoading: boolean;
}

interface PlagiarismResult {
  submissionId: number;
  similarityScore: number;
  matchedSources: MatchedSource[];
  suspiciousPatterns: SuspiciousPattern[];
  analysisResults: AnalysisResult;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface MatchedSource {
  sourceId: number;
  similarity: number;
  matchedText: string;
  sourceText: string;
  studentId: string;
  courseName: string;
  assignmentTitle: string;
  submissionDate: Date;
}

interface SuspiciousPattern {
  type: 'repetitive_structure' | 'unusual_vocabulary' | 'inconsistent_style' | 'common_phrases';
  confidence: number;
  description: string;
  textSegment: string;
  startIndex: number;
  endIndex: number;
}

interface AnalysisResult {
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

export default function PlagiarismResults({ 
  submissionId, 
  results, 
  onCheckPlagiarism, 
  isLoading 
}: PlagiarismResultsProps) {
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());
  const [expandedPatterns, setExpandedPatterns] = useState<Set<number>>(new Set());

  const toggleSourceExpansion = (sourceId: number) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(sourceId)) {
      newExpanded.delete(sourceId);
    } else {
      newExpanded.add(sourceId);
    }
    setExpandedSources(newExpanded);
  };

  const togglePatternExpansion = (patternIndex: number) => {
    const newExpanded = new Set(expandedPatterns);
    if (newExpanded.has(patternIndex)) {
      newExpanded.delete(patternIndex);
    } else {
      newExpanded.add(patternIndex);
    }
    setExpandedPatterns(newExpanded);
  };

  const getSeverityColor = (score: number) => {
    if (score >= 80) return 'destructive';
    if (score >= 60) return 'destructive';
    if (score >= 40) return 'default';
    if (score >= 20) return 'secondary';
    return 'secondary';
  };

  const getSeverityText = (score: number) => {
    if (score >= 80) return 'Very High';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Moderate';
    if (score >= 20) return 'Low';
    return 'Very Low';
  };

  const getPatternTypeIcon = (type: string) => {
    switch (type) {
      case 'repetitive_structure':
        return <FileText className="w-4 h-4" />;
      case 'unusual_vocabulary':
        return <Eye className="w-4 h-4" />;
      case 'inconsistent_style':
        return <AlertTriangle className="w-4 h-4" />;
      case 'common_phrases':
        return <FileText className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (!results) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Plagiarism Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              No plagiarism check has been performed for this submission.
            </p>
            <Button 
              onClick={() => onCheckPlagiarism(submissionId)}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Check for Plagiarism
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.status === 'processing') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plagiarism Detection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Processing plagiarism check...</span>
            </div>
            <Progress value={50} className="w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.status === 'failed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plagiarism Detection</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Plagiarism check failed. Please try again.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => onCheckPlagiarism(submissionId)} variant="outline">
              Retry Check
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Plagiarism Detection Results
            </span>
            <Badge variant={getSeverityColor(results.similarityScore)}>
              {getSeverityText(results.similarityScore)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Similarity Score</span>
              <span className="text-2xl font-bold">{results.similarityScore.toFixed(1)}%</span>
            </div>
            <Progress value={results.similarityScore} className="w-full" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{results.matchedSources.length}</div>
                <div className="text-sm text-muted-foreground">Similar Sources</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{results.suspiciousPatterns.length}</div>
                <div className="text-sm text-muted-foreground">Suspicious Patterns</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{results.analysisResults.wordCount}</div>
                <div className="text-sm text-muted-foreground">Word Count</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.analysisResults.readabilityScore.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Readability</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis */}
      <Tabs defaultValue="sources" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="sources">
            Similar Sources ({results.matchedSources.length})
          </TabsTrigger>
          <TabsTrigger value="patterns">
            Suspicious Patterns ({results.suspiciousPatterns.length})
          </TabsTrigger>
          <TabsTrigger value="analysis">
            Text Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4">
          {results.matchedSources.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Similar Sources Found</h3>
                  <p className="text-muted-foreground">
                    This submission appears to be original with no significant similarities to other submissions.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.matchedSources.map((source) => (
                <Card key={source.sourceId}>
                  <CardHeader>
                    <Collapsible>
                      <CollapsibleTrigger
                        className="flex items-center justify-between w-full"
                        onClick={() => toggleSourceExpansion(source.sourceId)}
                      >
                        <div className="flex items-center gap-4">
                          <Badge variant={getSeverityColor(source.similarity)}>
                            {source.similarity.toFixed(1)}% Match
                          </Badge>
                          <span className="font-medium">Student: {source.studentId}</span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(source.submissionDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {expandedSources.has(source.sourceId) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="mt-4">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Current Submission</h4>
                              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-sm">
                                "{source.matchedText}"
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Similar Source</h4>
                              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md text-sm">
                                "{source.sourceText}"
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <strong>Course:</strong> {source.courseName} | 
                            <strong> Assignment:</strong> {source.assignmentTitle}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          {results.suspiciousPatterns.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Suspicious Patterns Detected</h3>
                  <p className="text-muted-foreground">
                    The writing style appears consistent and natural.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.suspiciousPatterns.map((pattern, index) => (
                <Card key={index}>
                  <CardHeader>
                    <Collapsible>
                      <CollapsibleTrigger
                        className="flex items-center justify-between w-full"
                        onClick={() => togglePatternExpansion(index)}
                      >
                        <div className="flex items-center gap-4">
                          {getPatternTypeIcon(pattern.type)}
                          <span className="font-medium">{pattern.type.replace('_', ' ')}</span>
                          <Badge variant={getSeverityColor(pattern.confidence * 100)}>
                            {(pattern.confidence * 100).toFixed(1)}% Confidence
                          </Badge>
                        </div>
                        {expandedPatterns.has(index) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="mt-4">
                        <div className="space-y-3">
                          <p className="text-sm">{pattern.description}</p>
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
                            <h4 className="font-medium mb-2">Example:</h4>
                            <p className="text-sm">{pattern.textSegment}</p>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Text Analysis Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Text Length</span>
                    <span className="text-sm">{results.analysisResults.textLength} characters</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Word Count</span>
                    <span className="text-sm">{results.analysisResults.wordCount} words</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Unique Words</span>
                    <span className="text-sm">{results.analysisResults.uniqueWords}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Average Word Length</span>
                    <span className="text-sm">{results.analysisResults.averageWordLength.toFixed(1)} chars</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Sentence Count</span>
                    <span className="text-sm">{results.analysisResults.sentenceCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Average Sentence Length</span>
                    <span className="text-sm">{results.analysisResults.averageSentenceLength.toFixed(1)} words</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Readability Score</span>
                    <span className="text-sm">{results.analysisResults.readabilityScore.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Lexical Diversity</span>
                    <span className="text-sm">{(results.analysisResults.lexicalDiversity * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Analysis completed</span>
                  <span>{format(new Date(results.analysisResults.processedAt), 'MMM d, yyyy h:mm a')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}