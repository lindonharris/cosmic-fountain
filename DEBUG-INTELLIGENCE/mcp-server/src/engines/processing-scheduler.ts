/**
 * Strategic Processing Scheduler
 * Manages when to use Claude API for maximum value within $25/month budget
 * Implements intelligent queuing and priority-based processing
 */

export interface QueuedError {
  id: string;
  error_context: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  queued_at: Date;
  estimated_cost: number;
  retry_count: number;
}

export interface QueueResult {
  position: number;
  estimated_time: string;
  cost_estimate: number;
}

export interface ProcessingSchedule {
  monday: string;
  wednesday: string;
  friday: string;
  daily: string;
}

/**
 * Strategic Processing Scheduler
 * Optimizes Claude API usage for maximum debugging intelligence per dollar
 */
export class StrategicProcessingScheduler {
  private errorQueue: Map<string, QueuedError> = new Map();
  private processingSchedule: ProcessingSchedule;
  private dailyBudgetLimit: number = 0.83; // $25/month ÷ 30 days
  private priorityWeights = {
    'critical': 100,
    'high': 75,
    'medium': 50,
    'low': 25
  };

  constructor() {
    this.processingSchedule = {
      monday: 'batch_process_weekend_errors',      // 8 calls, $0.40
      wednesday: 'cross_repo_pattern_analysis',    // 6 calls, $0.30  
      friday: 'weekly_synthesis_and_reports',      // 5 calls, $0.25
      daily: 'critical_errors_only'               // 1-2 calls, $0.05-0.10
    };
    
    this.initializeScheduler();
  }

  /**
   * Initialize scheduler with daily processing routine
   */
  private async initializeScheduler(): Promise<void> {
    // Set up daily processing intervals
    this.scheduleProcessingWindows();
    
    // Start background queue processor
    this.startQueueProcessor();
  }

  /**
   * Queue error for strategic Claude analysis
   */
  async queueForClaudeAnalysis(errorContext: any): Promise<QueueResult> {
    const errorId = this.generateErrorId(errorContext);
    const priority = this.determinePriority(errorContext);
    const estimatedCost = this.estimateProcessingCost(errorContext);

    const queuedError: QueuedError = {
      id: errorId,
      error_context: errorContext,
      priority: priority,
      queued_at: new Date(),
      estimated_cost: estimatedCost,
      retry_count: 0
    };

    this.errorQueue.set(errorId, queuedError);

    // Calculate queue position based on priority
    const position = this.calculateQueuePosition(queuedError);
    const estimatedTime = this.estimateProcessingTime(position, priority);

    return {
      position: position,
      estimated_time: estimatedTime,
      cost_estimate: estimatedCost
    };
  }

  /**
   * Check daily budget availability
   */
  async checkDailyBudget(): Promise<{
    can_proceed: boolean;
    remaining_budget: number;
    calls_made_today: number;
  }> {
    const today = new Date().toDateString();
    const todaySpending = await this.calculateTodaySpending();
    const todayCalls = await this.getTodayCallCount();
    
    const remainingBudget = Math.max(0, this.dailyBudgetLimit - todaySpending);
    const canProceed = remainingBudget > 0.05; // Minimum cost per call

    return {
      can_proceed: canProceed,
      remaining_budget: remainingBudget,
      calls_made_today: todayCalls
    };
  }

  /**
   * Process queue based on strategic schedule
   */
  private async processQueue(): Promise<void> {
    const dayOfWeek = this.getCurrentDaySchedule();
    const budgetStatus = await this.checkDailyBudget();

    if (!budgetStatus.can_proceed) {
      console.log('Daily budget exhausted, deferring non-critical errors');
      return;
    }

    switch (dayOfWeek) {
      case 'monday':
        await this.processWeekendErrorBatch(budgetStatus.remaining_budget);
        break;
      case 'wednesday':
        await this.processCrossRepoAnalysis(budgetStatus.remaining_budget);
        break;
      case 'friday':
        await this.processWeeklySynthesis(budgetStatus.remaining_budget);
        break;
      default:
        await this.processCriticalErrors(budgetStatus.remaining_budget);
        break;
    }
  }

  /**
   * Monday: Process weekend error accumulation
   */
  private async processWeekendErrorBatch(remainingBudget: number): Promise<void> {
    console.log('Monday: Processing weekend error batch');
    
    const weekendErrors = Array.from(this.errorQueue.values())
      .filter(error => this.isWeekendError(error))
      .sort((a, b) => this.priorityWeights[b.priority] - this.priorityWeights[a.priority]);

    const budgetForBatch = Math.min(remainingBudget, 0.40); // $0.40 budget for Monday
    let totalCost = 0;
    const errorBatch = [];

    for (const error of weekendErrors) {
      if (totalCost + error.estimated_cost <= budgetForBatch) {
        errorBatch.push(error);
        totalCost += error.estimated_cost;
        this.errorQueue.delete(error.id);
      }
    }

    if (errorBatch.length > 0) {
      await this.processBatchWithClaude(errorBatch, 'weekend_batch');
    }
  }

  /**
   * Wednesday: Cross-repository pattern analysis
   */
  private async processCrossRepoAnalysis(remainingBudget: number): Promise<void> {
    console.log('Wednesday: Cross-repo pattern analysis');
    
    const crossRepoErrors = Array.from(this.errorQueue.values())
      .filter(error => this.hasCrossRepoRelevance(error))
      .slice(0, 6); // Limit to 6 errors for budget control

    if (crossRepoErrors.length > 0) {
      await this.processBatchWithClaude(crossRepoErrors, 'cross_repo_analysis');
      crossRepoErrors.forEach(error => this.errorQueue.delete(error.id));
    }
  }

  /**
   * Friday: Weekly synthesis and reporting
   */
  private async processWeeklySynthesis(remainingBudget: number): Promise<void> {
    console.log('Friday: Weekly synthesis and reports');
    
    // Select most impactful errors for synthesis
    const synthesisErrors = Array.from(this.errorQueue.values())
      .filter(error => this.isHighImpact(error))
      .slice(0, 5); // 5 errors for comprehensive synthesis

    if (synthesisErrors.length > 0) {
      await this.processBatchWithClaude(synthesisErrors, 'weekly_synthesis');
      synthesisErrors.forEach(error => this.errorQueue.delete(error.id));
    }
  }

  /**
   * Daily: Process only critical errors
   */
  private async processCriticalErrors(remainingBudget: number): Promise<void> {
    const criticalErrors = Array.from(this.errorQueue.values())
      .filter(error => error.priority === 'critical')
      .sort((a, b) => a.queued_at.getTime() - b.queued_at.getTime()); // FIFO for critical

    const budgetForCritical = Math.min(remainingBudget, 0.10); // Max $0.10 for daily critical errors
    let processedCost = 0;

    for (const error of criticalErrors) {
      if (processedCost + error.estimated_cost <= budgetForCritical) {
        await this.processBatchWithClaude([error], 'critical_error');
        this.errorQueue.delete(error.id);
        processedCost += error.estimated_cost;
      }
    }
  }

  /**
   * Process batch with Claude API
   */
  private async processBatchWithClaude(
    errorBatch: QueuedError[],
    batchType: string
  ): Promise<void> {
    try {
      console.log(`Processing ${errorBatch.length} errors in ${batchType} batch`);
      
      // In production: would call Claude API through the interface
      // For now: simulate processing
      const totalCost = errorBatch.reduce((sum, error) => sum + error.estimated_cost, 0);
      
      console.log(`Batch processing complete. Cost: $${totalCost.toFixed(3)}`);
      
      // Update processing statistics
      await this.recordBatchProcessing(batchType, errorBatch.length, totalCost);
      
    } catch (error) {
      console.error(`Failed to process ${batchType} batch:`, error);
      
      // Re-queue errors with incremented retry count
      errorBatch.forEach(queuedError => {
        queuedError.retry_count++;
        if (queuedError.retry_count < 3) {
          this.errorQueue.set(queuedError.id, queuedError);
        }
      });
    }
  }

  /**
   * Determine error priority based on context
   */
  private determinePriority(errorContext: any): 'low' | 'medium' | 'high' | 'critical' {
    // Critical: Production errors, security issues
    if (this.isProductionError(errorContext) || this.isSecurityError(errorContext)) {
      return 'critical';
    }
    
    // High: Build failures, API errors
    if (this.isBuildError(errorContext) || this.isAPIError(errorContext)) {
      return 'high';
    }
    
    // Medium: Development errors, test failures
    if (this.isDevelopmentError(errorContext) || this.isTestError(errorContext)) {
      return 'medium';
    }
    
    // Low: Minor issues, warnings
    return 'low';
  }

  /**
   * Helper methods for error classification
   */
  private isProductionError(errorContext: any): boolean {
    return errorContext.environment_info?.environment === 'production' ||
           errorContext.error_message.toLowerCase().includes('production');
  }

  private isSecurityError(errorContext: any): boolean {
    const securityKeywords = ['permission denied', 'unauthorized', 'authentication', 'security'];
    return securityKeywords.some(keyword => 
      errorContext.error_message.toLowerCase().includes(keyword)
    );
  }

  private isBuildError(errorContext: any): boolean {
    return errorContext.error_message.toLowerCase().includes('build') ||
           errorContext.error_message.toLowerCase().includes('compilation');
  }

  private isAPIError(errorContext: any): boolean {
    return errorContext.error_message.toLowerCase().includes('api') ||
           errorContext.error_message.toLowerCase().includes('http') ||
           errorContext.error_message.toLowerCase().includes('request');
  }

  private isDevelopmentError(errorContext: any): boolean {
    return errorContext.environment_info?.environment === 'development';
  }

  private isTestError(errorContext: any): boolean {
    return errorContext.error_message.toLowerCase().includes('test') ||
           errorContext.stack_trace?.toLowerCase().includes('test');
  }

  private isWeekendError(error: QueuedError): boolean {
    const day = error.queued_at.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  }

  private hasCrossRepoRelevance(error: QueuedError): boolean {
    // Check if error might affect multiple repositories
    const crossRepoIndicators = ['docker', 'network', 'database', 'api', 'auth'];
    return crossRepoIndicators.some(indicator =>
      error.error_context.error_message.toLowerCase().includes(indicator)
    );
  }

  private isHighImpact(error: QueuedError): boolean {
    return error.priority === 'critical' || error.priority === 'high';
  }

  private calculateQueuePosition(error: QueuedError): number {
    const sameOrHigherPriority = Array.from(this.errorQueue.values())
      .filter(queued => 
        this.priorityWeights[queued.priority] >= this.priorityWeights[error.priority]
      );
    
    return sameOrHigherPriority.length;
  }

  private estimateProcessingTime(position: number, priority: string): string {
    const baseTime = position * 30; // 30 minutes per position in queue
    
    // Priority modifiers
    const multipliers = {
      'critical': 0.1,  // Process immediately
      'high': 0.5,      // Process within 2-4 hours
      'medium': 1.0,    // Standard queue time
      'low': 2.0        // Double queue time
    };
    
    const estimatedMinutes = Math.round(baseTime * multipliers[priority as keyof typeof multipliers]);
    
    if (estimatedMinutes < 60) {
      return `${estimatedMinutes} minutes`;
    } else if (estimatedMinutes < 1440) {
      return `${Math.round(estimatedMinutes / 60)} hours`;
    } else {
      return `${Math.round(estimatedMinutes / 1440)} days`;
    }
  }

  private estimateProcessingCost(errorContext: any): number {
    // Base cost per error analysis
    let baseCost = 0.05;
    
    // Adjust based on complexity
    if (errorContext.stack_trace && errorContext.stack_trace.length > 1000) {
      baseCost += 0.02; // Complex errors cost more
    }
    
    if (errorContext.environment_info && Object.keys(errorContext.environment_info).length > 5) {
      baseCost += 0.01; // Rich context costs more
    }
    
    return baseCost;
  }

  private generateErrorId(errorContext: any): string {
    const content = `${errorContext.error_message}_${errorContext.repo_context}_${Date.now()}`;
    return 'error_' + Buffer.from(content).toString('base64').substring(0, 12);
  }

  private getCurrentDaySchedule(): string {
    const day = new Date().getDay();
    switch (day) {
      case 1: return 'monday';
      case 3: return 'wednesday';
      case 5: return 'friday';
      default: return 'daily';
    }
  }

  private scheduleProcessingWindows(): void {
    // Process queue every hour during business hours
    setInterval(() => {
      this.processQueue().catch(console.error);
    }, 60 * 60 * 1000); // Every hour
  }

  private startQueueProcessor(): void {
    // Start immediate processing for critical errors
    setInterval(() => {
      this.processCriticalErrors(this.dailyBudgetLimit).catch(console.error);
    }, 15 * 60 * 1000); // Every 15 minutes
  }

  private async calculateTodaySpending(): Promise<number> {
    // In production: would query usage tracking database
    // For now: return estimated daily spending
    return 0.25; // Placeholder
  }

  private async getTodayCallCount(): Promise<number> {
    // In production: would query usage tracking database
    // For now: return estimated daily calls
    return 5; // Placeholder
  }

  private async recordBatchProcessing(
    batchType: string,
    errorCount: number,
    totalCost: number
  ): Promise<void> {
    // In production: would record to analytics database
    console.log(`Recorded: ${batchType} processed ${errorCount} errors for $${totalCost.toFixed(3)}`);
  }

  /**
   * Get queue status for monitoring
   */
  getQueueStatus(): {
    total_queued: number;
    by_priority: Record<string, number>;
    oldest_error_age: string;
    estimated_processing_time: string;
  } {
    const queuedErrors = Array.from(this.errorQueue.values());
    const byPriority: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    queuedErrors.forEach(error => {
      byPriority[error.priority]++;
    });

    const oldestError = queuedErrors.reduce((oldest, current) => 
      current.queued_at < oldest.queued_at ? current : oldest,
      queuedErrors[0]
    );

    const oldestAge = oldestError ? 
      Math.round((Date.now() - oldestError.queued_at.getTime()) / (1000 * 60)) + ' minutes' :
      'No queued errors';

    return {
      total_queued: queuedErrors.length,
      by_priority: byPriority,
      oldest_error_age: oldestAge,
      estimated_processing_time: this.estimateProcessingTime(queuedErrors.length, 'medium')
    };
  }
}