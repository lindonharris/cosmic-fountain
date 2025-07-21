/**
 * Cost-Optimized Claude Interface
 * Strategic API usage to stay under $25/month budget
 * Batch processing, intelligent scheduling, and budget monitoring
 */

import Anthropic from '@anthropic-ai/sdk';

export interface ClaudeAnalysisResult {
  patterns: any[];
  novel_insights: any[];
  cross_repo_correlations: any[];
  api_cost: number;
  processing_time: number;
  tokens_used: number;
}

export interface BatchAnalysisRequest {
  error_batch: any[];
  cross_repo_context: boolean;
  priority_level: 'low' | 'medium' | 'high' | 'critical';
}

export interface BudgetStatus {
  daily_usage: number;
  weekly_usage: number;
  monthly_usage: number;
  remaining_daily_budget: number;
  calls_made_today: number;
  estimated_monthly_cost: number;
}

/**
 * Cost-Optimized Claude Interface
 * Target: $25/month through strategic batching and budget control
 */
export class CostOptimizedClaudeInterface {
  private claude: Anthropic;
  private usageTracker: UsageTracker;
  private batchProcessor: BatchProcessor;
  
  // Budget constraints
  private readonly MONTHLY_BUDGET_USD = 25;
  private readonly DAILY_CALL_LIMIT = 17; // ~500 calls/month
  private readonly COST_PER_CALL_ESTIMATE = 0.05; // $0.05 average per call
  
  constructor() {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey && process.env.NODE_ENV !== 'test') {
      throw new Error('CLAUDE_API_KEY environment variable is required');
    }
    
    if (apiKey) {
      this.claude = new Anthropic({
        apiKey: apiKey
      });
    } else {
      // Test mode - use mock client
      this.claude = {} as Anthropic;
    }
    
    this.usageTracker = new UsageTracker();
    this.batchProcessor = new BatchProcessor();
  }

  /**
   * Strategic batch analysis with budget control
   */
  async analyzeBatchWithBudget(
    errorBatch: any[],
    crossRepoContext: boolean = true
  ): Promise<ClaudeAnalysisResult> {
    const startTime = Date.now();

    // Check budget before processing
    const budgetStatus = await this.usageTracker.checkDailyBudget();
    if (!budgetStatus.can_proceed) {
      throw new Error(`Daily budget exceeded. Used ${budgetStatus.calls_made_today}/${this.DAILY_CALL_LIMIT} calls`);
    }

    // Optimize batch size for cost efficiency
    const optimizedBatch = this.batchProcessor.optimizeForCostEfficiency(errorBatch);
    
    // Create cost-optimized prompt
    const batchPrompt = this.createBatchAnalysisPrompt(optimizedBatch, crossRepoContext);
    
    try {
      // Strategic model selection (Haiku for cost optimization)
      const response = await this.claude.messages.create({
        model: 'claude-3-haiku-20240307', // Most cost-effective model
        max_tokens: 4000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: batchPrompt
        }]
      });

      // Track usage for budget monitoring
      const tokensUsed = this.estimateTokenUsage(batchPrompt, response.content[0]);
      const callCost = this.calculateCallCost(tokensUsed);
      
      await this.usageTracker.recordUsage({
        tokens_used: tokensUsed,
        cost: callCost,
        model: 'claude-3-haiku-20240307',
        timestamp: new Date(),
        batch_size: optimizedBatch.length
      });

      // Parse structured response
      const analysisResult = this.parseStructuredResponse(response.content[0]);

      return {
        patterns: analysisResult.patterns || [],
        novel_insights: analysisResult.novel_insights || [],
        cross_repo_correlations: analysisResult.cross_repo_correlations || [],
        api_cost: callCost,
        processing_time: Date.now() - startTime,
        tokens_used: tokensUsed
      };

    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error(`Claude analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create cost-optimized batch analysis prompt
   */
  private createBatchAnalysisPrompt(errorBatch: any[], crossRepoContext: boolean): string {
    const prompt = `
BATCH ERROR ANALYSIS REQUEST
============================

Analyze ${errorBatch.length} error patterns for debugging intelligence.

ERRORS TO ANALYZE:
${errorBatch.map((error, index) => `
Error ${index + 1}:
- Message: ${error.error_message}
- Repository: ${error.repo_context}
- Stack Trace: ${error.stack_trace ? error.stack_trace.substring(0, 200) + '...' : 'Not provided'}
- Environment: ${JSON.stringify(error.environment_info || {})}
`).join('\n')}

ANALYSIS REQUIREMENTS:
1. Identify novel error patterns not commonly documented
2. Find root cause categories and prevention strategies
3. ${crossRepoContext ? 'Identify cross-repository correlation patterns' : 'Focus on individual error analysis'}
4. Provide confidence scores for each insight (0-100)
5. Suggest concrete fix implementations

OUTPUT FORMAT (JSON):
{
  "patterns": [
    {
      "pattern_id": "unique_identifier",
      "pattern_type": "category",
      "confidence": 85,
      "root_cause": "specific cause",
      "prevention_strategy": "how to prevent",
      "fix_template": "concrete fix steps",
      "transferability": "how applicable to other repos"
    }
  ],
  "novel_insights": [
    {
      "insight": "unique discovery",
      "confidence": 90,
      "applicable_repos": ["repo1", "repo2"],
      "implementation_steps": ["step1", "step2"]
    }
  ],
  ${crossRepoContext ? `"cross_repo_correlations": [
    {
      "correlation": "pattern that appears across repos",
      "frequency": "how often seen",
      "risk_assessment": "potential impact",
      "prevention_recommendation": "org-wide prevention strategy"
    }
  ],` : ''}
  "processing_notes": "any limitations or additional context"
}

Focus on actionable insights with high confidence scores. Prioritize patterns that can be cached for future zero-cost analysis.
`;

    return prompt;
  }

  /**
   * Parse structured response from Claude
   */
  private parseStructuredResponse(content: any): any {
    try {
      // Extract JSON from response text
      const textContent = typeof content === 'string' ? content : content.text;
      
      // Find JSON block in response
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const parsedResult = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsedResult.patterns) {
        parsedResult.patterns = [];
      }
      if (!parsedResult.novel_insights) {
        parsedResult.novel_insights = [];
      }

      return parsedResult;
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
      return {
        patterns: [],
        novel_insights: [],
        cross_repo_correlations: [],
        processing_notes: 'Failed to parse structured response'
      };
    }
  }

  /**
   * Estimate token usage for cost calculation
   */
  private estimateTokenUsage(prompt: string, response: any): number {
    // Rough estimation: 1 token ≈ 4 characters
    const promptTokens = Math.ceil(prompt.length / 4);
    const responseText = typeof response === 'string' ? response : response.text || '';
    const responseTokens = Math.ceil(responseText.length / 4);
    
    return promptTokens + responseTokens;
  }

  /**
   * Calculate cost for this API call
   */
  private calculateCallCost(tokensUsed: number): number {
    // Claude 3 Haiku pricing: $0.25 per 1M input tokens, $1.25 per 1M output tokens
    // Simplified estimation for budget tracking
    const inputTokens = tokensUsed * 0.7; // Assume 70% input
    const outputTokens = tokensUsed * 0.3; // Assume 30% output
    
    const inputCost = (inputTokens / 1000000) * 0.25;
    const outputCost = (outputTokens / 1000000) * 1.25;
    
    return inputCost + outputCost;
  }

  /**
   * Get current budget status
   */
  async getBudgetStatus(): Promise<BudgetStatus> {
    return await this.usageTracker.getBudgetStatus();
  }

  /**
   * Check if Claude usage is available within budget
   */
  async canUseClaude(priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<boolean> {
    const budgetStatus = await this.usageTracker.checkDailyBudget();
    
    // Always allow critical errors
    if (priority === 'critical') {
      return budgetStatus.calls_made_today < this.DAILY_CALL_LIMIT + 5; // Allow 5 emergency calls
    }
    
    // Check normal budget limits
    return budgetStatus.can_proceed;
  }
}

/**
 * Usage Tracker for Budget Monitoring
 */
class UsageTracker {
  private usageLog: any[] = [];
  private readonly DAILY_CALL_LIMIT = 17;
  
  async recordUsage(usage: {
    tokens_used: number;
    cost: number;
    model: string;
    timestamp: Date;
    batch_size: number;
  }): Promise<void> {
    this.usageLog.push(usage);
    
    // Persist usage data (in production, would use database)
    // For now, keeping in memory with periodic file backup
    await this.saveUsageLog();
  }

  async checkDailyBudget(): Promise<{ can_proceed: boolean; calls_made_today: number; remaining_budget: number }> {
    const today = new Date().toDateString();
    const todayUsage = this.usageLog.filter(log => 
      log.timestamp.toDateString() === today
    );
    
    const callsMadeToday = todayUsage.length;
    const costToday = todayUsage.reduce((sum, log) => sum + log.cost, 0);
    
    return {
      can_proceed: callsMadeToday < this.DAILY_CALL_LIMIT,
      calls_made_today: callsMadeToday,
      remaining_budget: Math.max(0, this.DAILY_CALL_LIMIT - callsMadeToday)
    };
  }

  async getBudgetStatus(): Promise<BudgetStatus> {
    const now = new Date();
    const today = now.toDateString();
    const thisWeek = this.getWeekStart(now);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const dailyUsage = this.usageLog.filter(log => 
      log.timestamp.toDateString() === today
    );
    
    const weeklyUsage = this.usageLog.filter(log => 
      log.timestamp >= thisWeek
    );
    
    const monthlyUsage = this.usageLog.filter(log => 
      log.timestamp >= thisMonth
    );

    const dailyCost = dailyUsage.reduce((sum, log) => sum + log.cost, 0);
    const weeklyCost = weeklyUsage.reduce((sum, log) => sum + log.cost, 0);
    const monthlyCost = monthlyUsage.reduce((sum, log) => sum + log.cost, 0);

    return {
      daily_usage: dailyCost,
      weekly_usage: weeklyCost,
      monthly_usage: monthlyCost,
      remaining_daily_budget: Math.max(0, (25 / 30) - dailyCost), // ~$0.83 per day
      calls_made_today: dailyUsage.length,
      estimated_monthly_cost: (monthlyCost / now.getDate()) * 30 // Projection
    };
  }

  private getWeekStart(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day;
    return new Date(date.setDate(diff));
  }

  private async saveUsageLog(): Promise<void> {
    // In production: save to persistent storage
    // For development: could save to local file
    try {
      const fs = await import('fs-extra');
      const path = await import('path');
      
      const logPath = path.join(process.cwd(), 'usage-log.json');
      await fs.writeJson(logPath, this.usageLog, { spaces: 2 });
    } catch (error) {
      console.warn('Could not save usage log:', error);
    }
  }
}

/**
 * Batch Processor for Cost Efficiency
 */
class BatchProcessor {
  private readonly OPTIMAL_BATCH_SIZE = 12; // Sweet spot for token usage vs cost
  private readonly MAX_BATCH_SIZE = 20;

  optimizeForCostEfficiency(errorBatch: any[]): any[] {
    // Remove duplicates to avoid wasted analysis
    const uniqueErrors = this.removeDuplicateErrors(errorBatch);
    
    // Limit batch size for optimal cost/performance
    const optimizedBatch = uniqueErrors.slice(0, this.OPTIMAL_BATCH_SIZE);
    
    // Prioritize novel/complex errors
    return this.prioritizeNovelErrors(optimizedBatch);
  }

  private removeDuplicateErrors(errors: any[]): any[] {
    const seen = new Set();
    return errors.filter(error => {
      const signature = `${error.error_message}_${error.repo_context}`;
      if (seen.has(signature)) {
        return false;
      }
      seen.add(signature);
      return true;
    });
  }

  private prioritizeNovelErrors(errors: any[]): any[] {
    // In production: would use ML to identify novel patterns
    // For now: simple heuristics
    return errors.sort((a, b) => {
      // Prioritize errors with longer stack traces (more complex)
      const aComplexity = (a.stack_trace || '').length;
      const bComplexity = (b.stack_trace || '').length;
      return bComplexity - aComplexity;
    });
  }
}