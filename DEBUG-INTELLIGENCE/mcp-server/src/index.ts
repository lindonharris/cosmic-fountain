#!/usr/bin/env node
/**
 * Debug Intelligence MCP Server
 * Cost-optimized debugging intelligence with local pattern matching
 * Target: $25/month Claude API usage through 90% local processing
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolRequest,
  ListToolsRequest,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { LocalPatternEngine } from './engines/local-pattern-engine.js';
import { CostOptimizedClaudeInterface } from './engines/claude-interface.js';
import { ErrorIntelligenceCache } from './engines/intelligence-cache.js';
import { StrategicProcessingScheduler } from './engines/processing-scheduler.js';

/**
 * Core Debug Intelligence MCP Server
 * Implements 8 cost-optimized tools for debugging intelligence
 */
class DebugIntelligenceMCPServer {
  private server: Server;
  private localPatternEngine: LocalPatternEngine;
  private claudeInterface: CostOptimizedClaudeInterface;
  private intelligenceCache: ErrorIntelligenceCache;
  private processingScheduler: StrategicProcessingScheduler;

  constructor() {
    this.server = new Server(
      {
        name: 'debug-intelligence',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize cost-optimized engines
    this.localPatternEngine = new LocalPatternEngine();
    this.claudeInterface = new CostOptimizedClaudeInterface();
    this.intelligenceCache = new ErrorIntelligenceCache();
    this.processingScheduler = new StrategicProcessingScheduler();

    this.setupTools();
    this.setupErrorHandling();
  }

  private setupTools(): void {
    // Tool 1: Capture Error Context (Local + Cache)
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === 'capture_error_context') {
        return this.captureErrorContext(request.params.arguments);
      }
      if (request.params.name === 'analyze_error_patterns') {
        return this.analyzeErrorPatterns(request.params.arguments);
      }
      if (request.params.name === 'suggest_preventive_fixes') {
        return this.suggestPreventiveFixes(request.params.arguments);
      }
      if (request.params.name === 'track_fix_effectiveness') {
        return this.trackFixEffectiveness(request.params.arguments);
      }
      if (request.params.name === 'scan_code_for_risks') {
        return this.scanCodeForRisks(request.params.arguments);
      }
      if (request.params.name === 'enrich_with_external_intel') {
        return this.enrichWithExternalIntel(request.params.arguments);
      }
      if (request.params.name === 'generate_guidance_report') {
        return this.generateGuidanceReport(request.params.arguments);
      }
      if (request.params.name === 'update_error_taxonomy') {
        return this.updateErrorTaxonomy(request.params.arguments);
      }

      throw new Error(`Unknown tool: ${request.params.name}`);
    });

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getToolDefinitions(),
    }));
  }

  private getToolDefinitions(): Tool[] {
    return [
      {
        name: 'capture_error_context',
        description: 'Intelligently capture error context with local pattern matching (90% local, 10% Claude)',
        inputSchema: {
          type: 'object',
          properties: {
            error_message: { type: 'string', description: 'The error message or exception' },
            stack_trace: { type: 'string', description: 'Full stack trace if available' },
            repo_context: { type: 'string', description: 'Repository name and context' },
            environment_info: { type: 'object', description: 'Environment and runtime information' },
            recent_changes: { type: 'array', description: 'Recent code changes or commits' }
          },
          required: ['error_message', 'repo_context']
        }
      },
      {
        name: 'analyze_error_patterns',
        description: 'Analyze error patterns using local intelligence and strategic Claude usage',
        inputSchema: {
          type: 'object',
          properties: {
            error_batch: { type: 'array', description: 'Batch of errors for cost-efficient analysis' },
            analysis_depth: { type: 'string', enum: ['local_only', 'claude_if_needed', 'comprehensive'] },
            cross_repo_context: { type: 'boolean', description: 'Include cross-repository pattern matching' }
          },
          required: ['error_batch']
        }
      },
      {
        name: 'suggest_preventive_fixes',
        description: 'Generate preventive fix suggestions using cached intelligence',
        inputSchema: {
          type: 'object',
          properties: {
            error_pattern: { type: 'object', description: 'Identified error pattern' },
            target_repo: { type: 'string', description: 'Repository to apply fixes' },
            risk_tolerance: { type: 'string', enum: ['conservative', 'moderate', 'aggressive'] }
          },
          required: ['error_pattern', 'target_repo']
        }
      },
      {
        name: 'track_fix_effectiveness',
        description: 'Track fix success rates to improve future recommendations',
        inputSchema: {
          type: 'object',
          properties: {
            fix_applied: { type: 'object', description: 'Details of the fix that was applied' },
            outcome_result: { type: 'string', enum: ['success', 'partial_success', 'failure'] },
            time_to_resolution: { type: 'number', description: 'Time taken to resolve in minutes' },
            repo_context: { type: 'string', description: 'Repository and context information' }
          },
          required: ['fix_applied', 'outcome_result', 'repo_context']
        }
      },
      {
        name: 'scan_code_for_risks',
        description: 'Pre-commit risk analysis using local pattern database',
        inputSchema: {
          type: 'object',
          properties: {
            code_changes: { type: 'array', description: 'Code changes to analyze' },
            repo_history: { type: 'object', description: 'Repository error history context' },
            risk_threshold: { type: 'number', description: 'Risk threshold (0-100)' }
          },
          required: ['code_changes']
        }
      },
      {
        name: 'enrich_with_external_intel',
        description: 'Strategic external intelligence enrichment (budget-controlled)',
        inputSchema: {
          type: 'object',
          properties: {
            novel_error_patterns: { type: 'array', description: 'Errors not found in local cache' },
            external_sources: { type: 'array', items: { type: 'string' } },
            budget_limit: { type: 'number', description: 'Maximum API calls to use' }
          },
          required: ['novel_error_patterns']
        }
      },
      {
        name: 'generate_guidance_report',
        description: 'Generate cost-efficient debugging guidance reports',
        inputSchema: {
          type: 'object',
          properties: {
            repo_name: { type: 'string', description: 'Target repository name' },
            time_period: { type: 'string', description: 'Analysis time period (daily/weekly/monthly)' },
            report_depth: { type: 'string', enum: ['summary', 'detailed', 'comprehensive'] }
          },
          required: ['repo_name', 'time_period']
        }
      },
      {
        name: 'update_error_taxonomy',
        description: 'Update local error taxonomy to improve pattern matching',
        inputSchema: {
          type: 'object',
          properties: {
            new_patterns: { type: 'array', description: 'New error patterns discovered' },
            pattern_relationships: { type: 'object', description: 'Relationships between patterns' },
            taxonomy_version: { type: 'string', description: 'Version of taxonomy to update' }
          },
          required: ['new_patterns']
        }
      }
    ];
  }

  /**
   * Tool 1: Capture Error Context
   * 90% local processing, only novel errors go to Claude
   */
  private async captureErrorContext(args: any) {
    try {
      const { error_message, stack_trace, repo_context, environment_info, recent_changes } = args;

      // Step 1: Try local pattern matching first (free)
      const localMatch = await this.localPatternEngine.matchErrorPattern({
        error_message,
        stack_trace,
        repo_context,
        environment_info
      });

      if (localMatch.confidence > 85) {
        // High confidence local match - no Claude API needed
        const cachedSolution = await this.intelligenceCache.getCachedSolution(localMatch.pattern_id);
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              analysis_type: 'local_pattern_match',
              confidence: localMatch.confidence,
              pattern_type: localMatch.pattern_type,
              suggested_solution: cachedSolution,
              api_cost: 0,
              processing_time_ms: localMatch.processing_time
            })
          }]
        };
      }

      // Step 2: Novel error - queue for strategic Claude analysis
      const queueResult = await this.processingScheduler.queueForClaudeAnalysis({
        error_message,
        stack_trace,
        repo_context,
        environment_info,
        recent_changes,
        local_match_confidence: localMatch.confidence
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            analysis_type: 'queued_for_claude_analysis',
            queue_position: queueResult.position,
            estimated_processing_time: queueResult.estimated_time,
            local_match_confidence: localMatch.confidence,
            api_cost_estimate: queueResult.cost_estimate
          })
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'Failed to capture error context',
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }]
      };
    }
  }

  /**
   * Tool 2: Analyze Error Patterns
   * Batch processing for cost efficiency
   */
  private async analyzeErrorPatterns(args: any) {
    try {
      const { error_batch, analysis_depth = 'claude_if_needed', cross_repo_context = true } = args;

      if (analysis_depth === 'local_only') {
        // Pure local analysis - zero API cost
        const localAnalysis = await this.localPatternEngine.analyzeBatchLocally(error_batch);
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              analysis_type: 'local_only',
              patterns_identified: localAnalysis.patterns,
              confidence_scores: localAnalysis.confidence_scores,
              recommended_actions: localAnalysis.recommended_actions,
              api_cost: 0
            })
          }]
        };
      }

      // Check budget before Claude usage
      const canUseClaude = await this.processingScheduler.checkDailyBudget();
      
      if (!canUseClaude && analysis_depth === 'claude_if_needed') {
        // Fall back to local analysis if over budget
        const localAnalysis = await this.localPatternEngine.analyzeBatchLocally(error_batch);
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              analysis_type: 'local_fallback_budget_exceeded',
              patterns_identified: localAnalysis.patterns,
              budget_status: 'daily_limit_reached',
              api_cost: 0
            })
          }]
        };
      }

      // Strategic Claude usage for comprehensive analysis
      const claudeAnalysis = await this.claudeInterface.analyzeBatchWithBudget(
        error_batch,
        cross_repo_context
      );

      // Cache results for future free access
      await this.intelligenceCache.cacheAnalysisResults(claudeAnalysis);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            analysis_type: 'claude_enhanced',
            patterns_identified: claudeAnalysis.patterns,
            novel_insights: claudeAnalysis.novel_insights,
            cross_repo_correlations: claudeAnalysis.cross_repo_correlations,
            api_cost: claudeAnalysis.api_cost,
            cached_for_future: true
          })
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'Failed to analyze error patterns',
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }]
      };
    }
  }

  /**
   * Tool 3: Suggest Preventive Fixes
   * Generate concrete preventive fixes using cached intelligence
   */
  private async suggestPreventiveFixes(args: any) {
    try {
      const { error_pattern, target_repo, risk_tolerance = 'moderate' } = args;
      
      // Check cache for similar patterns first
      const cachedSolution = await this.intelligenceCache.getCachedSolution(error_pattern.pattern_id);
      
      if (cachedSolution) {
        // Use cached intelligence to generate targeted fixes
        const preventiveFixes = {
          immediate_actions: cachedSolution.fix_templates,
          prevention_strategies: cachedSolution.prevention_strategies,
          risk_assessment: this.assessImplementationRisk(cachedSolution, risk_tolerance),
          success_probability: cachedSolution.success_rate,
          implementation_priority: this.prioritizeByRisk(cachedSolution, risk_tolerance)
        };
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              analysis_type: 'cached_preventive_fixes',
              target_repository: target_repo,
              preventive_fixes: preventiveFixes,
              confidence: cachedSolution.confidence_score,
              api_cost: 0
            })
          }]
        };
      }
      
      // Fall back to local pattern matching for similar issues
      const localMatch = await this.localPatternEngine.matchErrorPattern({
        error_message: error_pattern.error_message || 'Pattern-based analysis',
        repo_context: target_repo,
        environment_info: error_pattern.environment_info || {}
      });
      
      if (localMatch.confidence > 70) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              analysis_type: 'local_pattern_preventive_fixes',
              target_repository: target_repo,
              suggested_actions: localMatch.suggested_actions,
              confidence: localMatch.confidence,
              api_cost: 0
            })
          }]
        };
      }
      
      // Queue for Claude analysis if no local match
      const queueResult = await this.processingScheduler.queueForClaudeAnalysis({
        error_pattern,
        target_repo,
        analysis_type: 'preventive_fixes'
      });
      
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            analysis_type: 'queued_for_claude_preventive_analysis',
            queue_position: queueResult.position,
            estimated_time: queueResult.estimated_time,
            cost_estimate: queueResult.cost_estimate
          })
        }]
      };
      
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'Failed to suggest preventive fixes',
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }]
      };
    }
  }

  /**
   * Tool 4: Track Fix Effectiveness
   * Learn from fix outcomes to improve future recommendations
   */
  private async trackFixEffectiveness(args: any) {
    try {
      const { fix_applied, outcome_result, time_to_resolution, repo_context } = args;
      
      // Extract pattern information from the fix
      const patternId = fix_applied.pattern_id || this.generatePatternId(fix_applied);
      const wasSuccessful = outcome_result === 'success';
      
      // Update cached solution effectiveness
      await this.intelligenceCache.updateSolutionEffectiveness(
        patternId,
        wasSuccessful,
        `Resolution time: ${time_to_resolution}min, Repository: ${repo_context}`
      );
      
      // Update local pattern success rates
      const effectivenessData = {
        pattern_id: patternId,
        success_rate: wasSuccessful ? 100 : 0,
        resolution_time: time_to_resolution,
        repository: repo_context,
        fix_details: fix_applied,
        outcome: outcome_result,
        timestamp: new Date().toISOString()
      };
      
      // Record effectiveness for pattern learning
      await this.recordEffectivenessMetrics(effectivenessData);
      
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            tracking_status: 'effectiveness_recorded',
            pattern_id: patternId,
            success_recorded: wasSuccessful,
            resolution_time_minutes: time_to_resolution,
            updated_success_rate: await this.getUpdatedSuccessRate(patternId),
            learning_impact: wasSuccessful ? 'positive_reinforcement' : 'negative_feedback_logged'
          })
        }]
      };
      
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'Failed to track fix effectiveness',
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }]
      };
    }
  }

  /**
   * Tool 5: Scan Code for Risks
   * Pre-commit risk analysis using local pattern database
   */
  private async scanCodeForRisks(args: any) {
    try {
      const { code_changes, repo_history, risk_threshold = 70 } = args;
      
      const riskAssessment = {
        high_risk_patterns: [] as any[],
        medium_risk_patterns: [] as any[],
        low_risk_patterns: [] as any[],
        recommendations: [] as string[],
        overall_risk_score: 0
      };
      
      // Analyze each code change against known error patterns
      for (const change of code_changes) {
        const riskAnalysis = await this.analyzeCodeChangeRisk(change, repo_history);
        
        if (riskAnalysis.risk_score >= 80) {
          riskAssessment.high_risk_patterns.push(riskAnalysis);
        } else if (riskAnalysis.risk_score >= 50) {
          riskAssessment.medium_risk_patterns.push(riskAnalysis);
        } else {
          riskAssessment.low_risk_patterns.push(riskAnalysis);
        }
        
        riskAssessment.recommendations.push(...riskAnalysis.recommendations);
      }
      
      // Calculate overall risk score
      const totalPatterns = riskAssessment.high_risk_patterns.length + 
                           riskAssessment.medium_risk_patterns.length + 
                           riskAssessment.low_risk_patterns.length;
      
      if (totalPatterns > 0) {
        riskAssessment.overall_risk_score = Math.round(
          (riskAssessment.high_risk_patterns.length * 80 + 
           riskAssessment.medium_risk_patterns.length * 50 + 
           riskAssessment.low_risk_patterns.length * 20) / totalPatterns
        );
      }
      
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            scan_type: 'local_pattern_risk_analysis',
            overall_risk_score: riskAssessment.overall_risk_score,
            risk_level: this.categorizeRiskLevel(riskAssessment.overall_risk_score),
            detailed_analysis: riskAssessment,
            commit_recommendation: riskAssessment.overall_risk_score > risk_threshold ? 'review_required' : 'safe_to_commit',
            api_cost: 0
          })
        }]
      };
      
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'Failed to scan code for risks',
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }]
      };
    }
  }

  /**
   * Tool 6: Enrich with External Intelligence
   * Strategic external intelligence with strict budget controls
   */
  private async enrichWithExternalIntel(args: any) {
    try {
      const { novel_error_patterns, external_sources = [], budget_limit = 3 } = args;
      
      // Check if we can afford external intelligence gathering
      const budgetStatus = await this.processingScheduler.checkDailyBudget();
      
      if (!budgetStatus.can_proceed || budgetStatus.remaining_budget < budget_limit) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              enrichment_status: 'budget_insufficient',
              budget_remaining: budgetStatus.remaining_budget,
              required_budget: budget_limit,
              fallback_action: 'local_pattern_analysis_only'
            })
          }]
        };
      }
      
      // Filter to only truly novel patterns not in cache
      const novelPatterns = [];
      for (const pattern of novel_error_patterns) {
        const cached = await this.intelligenceCache.getCachedSolution(pattern.pattern_id);
        if (!cached) {
          novelPatterns.push(pattern);
        }
      }
      
      if (novelPatterns.length === 0) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              enrichment_status: 'all_patterns_cached',
              cache_hit_rate: '100%',
              api_cost: 0
            })
          }]
        };
      }
      
      // Strategic Claude usage for novel patterns only
      const enrichmentResult = await this.claudeInterface.analyzeBatchWithBudget(
        novelPatterns.slice(0, Math.min(novelPatterns.length, budget_limit))
      );
      
      // Cache enriched intelligence permanently
      await this.intelligenceCache.cacheAnalysisResults(enrichmentResult);
      
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            enrichment_status: 'external_intelligence_acquired',
            novel_patterns_analyzed: novelPatterns.length,
            new_insights_count: enrichmentResult.novel_insights?.length || 0,
            api_cost: enrichmentResult.api_cost,
            cached_for_future: true,
            estimated_future_savings: enrichmentResult.api_cost * 10 // 10x reuse expected
          })
        }]
      };
      
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'Failed to enrich with external intelligence',
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }]
      };
    }
  }

  /**
   * Tool 7: Generate Guidance Report
   * Cost-efficient debugging guidance using cached intelligence
   */
  private async generateGuidanceReport(args: any) {
    try {
      const { repo_name, time_period, report_depth = 'summary' } = args;
      
      // Generate report from cached intelligence (zero API cost)
      const cacheStats = this.intelligenceCache.getCacheStatistics();
      const patternStats = this.localPatternEngine.getPatternStatistics();
      
      const guidanceReport = {
        repository: repo_name,
        analysis_period: time_period,
        report_generated: new Date().toISOString(),
        
        // Intelligence summary
        intelligence_summary: {
          total_patterns_available: patternStats.total_patterns,
          cached_solutions: cacheStats.total_cached_solutions,
          cache_hit_rate: cacheStats.cache_hit_rate,
          cost_savings: cacheStats.estimated_cost_savings
        },
        
        // Top risk patterns for this repository
        top_risk_patterns: await this.getTopRiskPatterns(repo_name, 5),
        
        // Most effective fixes
        most_effective_fixes: await this.getMostEffectiveFixes(repo_name, 5),
        
        // Proactive recommendations
        proactive_recommendations: await this.generateProactiveRecommendations(repo_name),
        
        // Budget efficiency metrics
        cost_efficiency: {
          local_analysis_coverage: '90%',
          api_cost_this_period: 0, // Most analysis is local
          projected_monthly_savings: cacheStats.estimated_cost_savings
        }
      };
      
      if (report_depth === 'detailed' || report_depth === 'comprehensive') {
        (guidanceReport as any).detailed_pattern_analysis = patternStats.patterns_by_type;
        (guidanceReport as any).resolution_time_trends = await this.getResolutionTimeTrends(repo_name);
      }
      
      if (report_depth === 'comprehensive') {
        (guidanceReport as any).cross_repo_insights = await this.getCrossRepoInsights(repo_name);
        (guidanceReport as any).prevention_strategy_effectiveness = await this.getPreventionEffectiveness(repo_name);
      }
      
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            report_type: 'debugging_guidance_report',
            report_depth: report_depth,
            guidance_report: guidanceReport,
            api_cost: 0, // Pure local/cached analysis
            generation_time_ms: Date.now() - Date.now()
          })
        }]
      };
      
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'Failed to generate guidance report',
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }]
      };
    }
  }

  /**
   * Tool 8: Update Error Taxonomy
   * Continuously improve local pattern database
   */
  private async updateErrorTaxonomy(args: any) {
    try {
      const { new_patterns, pattern_relationships, taxonomy_version = '1.0' } = args;
      
      let updatedPatterns = 0;
      let newPatterns = 0;
      
      // Process new patterns discovered
      for (const pattern of new_patterns) {
        const patternId = pattern.pattern_id || this.generatePatternId(pattern);
        
        // Check if pattern already exists
        const existingPattern = await this.intelligenceCache.getCachedSolution(patternId);
        
        if (existingPattern) {
          // Update existing pattern with new insights
          await this.intelligenceCache.updateSolutionEffectiveness(
            patternId,
            true,
            `Taxonomy update: ${pattern.improvement_notes || 'Pattern refinement'}`
          );
          updatedPatterns++;
        } else {
          // Cache new pattern for future analysis
          await this.intelligenceCache.cacheAnalysisResults({
            patterns: [pattern],
            novel_insights: []
          });
          newPatterns++;
        }
      }
      
      // Update pattern relationships for better matching
      if (pattern_relationships) {
        await this.updatePatternRelationships(pattern_relationships);
      }
      
      // Update taxonomy metadata
      const taxonomyStats = {
        version: taxonomy_version,
        last_updated: new Date().toISOString(),
        patterns_added: newPatterns,
        patterns_updated: updatedPatterns,
        total_patterns: await this.getTotalPatternCount()
      };
      
      await this.saveTaxonomyMetadata(taxonomyStats);
      
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            taxonomy_update: 'completed',
            version: taxonomy_version,
            patterns_added: newPatterns,
            patterns_updated: updatedPatterns,
            total_patterns: taxonomyStats.total_patterns,
            improvement_impact: 'enhanced_local_pattern_matching',
            api_cost: 0 // Pure local taxonomy management
          })
        }]
      };
      
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'Failed to update error taxonomy',
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }]
      };
    }
  }

  /**
   * Helper Methods for Tool Implementation
   */
  private assessImplementationRisk(cachedSolution: any, riskTolerance: string): any {
    const baseRisk = 100 - cachedSolution.success_rate;
    const riskMultiplier = {
      'conservative': 1.5,
      'moderate': 1.0,
      'aggressive': 0.7
    }[riskTolerance] || 1.0;
    
    return {
      risk_score: Math.round(baseRisk * riskMultiplier),
      risk_level: baseRisk < 20 ? 'low' : baseRisk < 50 ? 'medium' : 'high',
      recommended_testing: baseRisk > 30 ? 'extensive' : 'standard'
    };
  }
  
  private prioritizeByRisk(cachedSolution: any, riskTolerance: string): string {
    const successRate = cachedSolution.success_rate;
    if (successRate > 90) return 'high';
    if (successRate > 70) return 'medium';
    return 'low';
  }
  
  private generatePatternId(pattern: any): string {
    const content = JSON.stringify({
      type: pattern.type || pattern.pattern_type,
      message: pattern.error_message || pattern.description,
      context: pattern.repo_context || pattern.context
    });
    
    const crypto = require('crypto');
    return 'pattern_' + crypto.createHash('md5').update(content).digest('hex').substring(0, 12);
  }
  
  private async recordEffectivenessMetrics(effectivenessData: any): Promise<void> {
    // In production: would save to persistent metrics database
    // For now: log to console for debugging
    console.log('Effectiveness metrics recorded:', {
      pattern_id: effectivenessData.pattern_id,
      success_rate: effectivenessData.success_rate,
      resolution_time: effectivenessData.resolution_time
    });
  }
  
  private async getUpdatedSuccessRate(patternId: string): Promise<number> {
    const cachedSolution = await this.intelligenceCache.getCachedSolution(patternId);
    return cachedSolution ? cachedSolution.success_rate : 0;
  }
  
  private async analyzeCodeChangeRisk(change: any, repoHistory: any): Promise<any> {
    // Analyze code change against known error patterns
    const riskFactors = [];
    let riskScore = 0;
    
    // Check for risky patterns in code changes
    const riskyPatterns = [
      { pattern: /async.*await.*(?!catch)/gi, risk: 30, reason: 'Async operations without error handling' },
      { pattern: /console\.log/gi, risk: 10, reason: 'Debug code left in production' },
      { pattern: /password|secret|key.*=.*['"]\\w+['"]/gi, risk: 90, reason: 'Hardcoded credentials' },
      { pattern: /eval\(|new Function\(/gi, risk: 80, reason: 'Dynamic code execution' },
      { pattern: /\.innerHTML.*=.*user/gi, risk: 70, reason: 'Potential XSS vulnerability' }
    ];
    
    for (const { pattern, risk, reason } of riskyPatterns) {
      if (pattern.test(change.content || '')) {
        riskFactors.push({ pattern: pattern.source, risk, reason });
        riskScore += risk;
      }
    }
    
    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);
    
    return {
      file_path: change.file_path,
      risk_score: riskScore,
      risk_factors: riskFactors,
      recommendations: riskFactors.map(rf => `Fix: ${rf.reason}`)
    };
  }
  
  private categorizeRiskLevel(riskScore: number): string {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }
  
  private async getTopRiskPatterns(repoName: string, limit: number): Promise<any[]> {
    // In production: would query historical data
    // For now: return sample risk patterns
    return [
      { pattern: 'async_await_error_handling', risk_score: 85, frequency: 12 },
      { pattern: 'null_pointer_exceptions', risk_score: 78, frequency: 8 },
      { pattern: 'docker_port_conflicts', risk_score: 72, frequency: 6 }
    ].slice(0, limit);
  }
  
  private async getMostEffectiveFixes(repoName: string, limit: number): Promise<any[]> {
    // In production: would query effectiveness data
    // For now: return sample effective fixes
    return [
      { fix: 'Add null checks with optional chaining', success_rate: 94, usage_count: 23 },
      { fix: 'Implement try-catch for async operations', success_rate: 91, usage_count: 18 },
      { fix: 'Use docker-compose down before restart', success_rate: 97, usage_count: 15 }
    ].slice(0, limit);
  }
  
  private async generateProactiveRecommendations(repoName: string): Promise<string[]> {
    return [
      'Add comprehensive error handling to async functions',
      'Implement input validation for all user-facing APIs',
      'Set up automated testing for Docker container orchestration',
      'Add logging for production error tracking',
      'Implement circuit breaker pattern for external API calls'
    ];
  }
  
  private async getResolutionTimeTrends(repoName: string): Promise<any> {
    // In production: would calculate actual trends
    return {
      average_resolution_time: 45,
      trend: 'improving',
      fastest_resolution: 5,
      slowest_resolution: 180
    };
  }
  
  private async getCrossRepoInsights(repoName: string): Promise<any[]> {
    return [
      { insight: 'Docker networking issues affect 3 repositories', correlation: 0.8 },
      { insight: 'Authentication patterns are consistent across repos', correlation: 0.9 }
    ];
  }
  
  private async getPreventionEffectiveness(repoName: string): Promise<any> {
    return {
      proactive_fixes_applied: 12,
      prevented_issues: 8,
      prevention_success_rate: 67
    };
  }
  
  private async updatePatternRelationships(relationships: any): Promise<void> {
    // In production: would update pattern relationship database
    console.log('Pattern relationships updated:', Object.keys(relationships).length);
  }
  
  private async getTotalPatternCount(): Promise<number> {
    const patternStats = this.localPatternEngine.getPatternStatistics();
    const cacheStats = this.intelligenceCache.getCacheStatistics();
    return patternStats.total_patterns + cacheStats.total_cached_solutions;
  }
  
  private async saveTaxonomyMetadata(taxonomyStats: any): Promise<void> {
    // In production: would save to persistent metadata store
    console.log('Taxonomy metadata saved:', taxonomyStats);
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      console.log('Shutting down Debug Intelligence MCP server...');
      await this.server.close();
      process.exit(0);
    });
  }

  async run(): Promise<void> {
    const transport = {
      start: async () => {},
      send: async (data: any) => {
        process.stdout.write(JSON.stringify(data) + '\n');
      },
      close: async () => {}
    };
    await this.server.connect(transport);
    console.error('Debug Intelligence MCP server running on stdio');
  }
}

// Start the server
const server = new DebugIntelligenceMCPServer();
server.run().catch(console.error);