/**
 * Error Intelligence Cache
 * Permanent storage for analyzed patterns to avoid repeat API costs
 * Once analyzed by Claude, never pay again for the same pattern
 */

import fs from 'fs-extra';
import * as path from 'path';
import { createHash } from 'crypto';

export interface CachedSolution {
  pattern_id: string;
  solution_text: string;
  confidence_score: number;
  success_rate: number;
  applicable_repos: string[];
  fix_templates: string[];
  prevention_strategies: string[];
  cached_date: string;
  usage_count: number;
  last_accessed: string;
}

export interface CacheStatistics {
  total_cached_solutions: number;
  cache_hit_rate: number;
  total_api_calls_saved: number;
  estimated_cost_savings: number;
}

/**
 * Permanent Intelligence Cache
 * Core component for achieving $25/month budget target
 */
export class ErrorIntelligenceCache {
  private cachePath: string;
  private solutionCache: Map<string, CachedSolution> = new Map();
  private cacheStats: CacheStatistics;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  constructor() {
    this.cachePath = path.join(process.cwd(), 'error-intelligence-cache');
    this.cacheStats = {
      total_cached_solutions: 0,
      cache_hit_rate: 0,
      total_api_calls_saved: 0,
      estimated_cost_savings: 0
    };
    
    this.initializeCache();
  }

  /**
   * Initialize cache from persistent storage
   */
  private async initializeCache(): Promise<void> {
    try {
      await fs.ensureDir(this.cachePath);
      
      // Load existing cache files
      const cacheFiles = await fs.readdir(this.cachePath);
      
      for (const file of cacheFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.cachePath, file);
          const cachedSolution = await fs.readJson(filePath);
          this.solutionCache.set(cachedSolution.pattern_id, cachedSolution);
        }
      }

      console.log(`Loaded ${this.solutionCache.size} cached solutions from disk`);
      this.updateCacheStatistics();
      
    } catch (error) {
      console.warn('Failed to initialize cache:', error);
      await fs.ensureDir(this.cachePath);
    }
  }

  /**
   * Get cached solution for error pattern
   * Returns solution without API call if available
   */
  async getCachedSolution(patternId: string): Promise<CachedSolution | null> {
    const cached = this.solutionCache.get(patternId);
    
    if (cached) {
      // Update access statistics
      cached.usage_count++;
      cached.last_accessed = new Date().toISOString();
      this.cacheHits++;
      
      // Persist updated statistics
      await this.saveSolutionToFile(cached);
      
      return cached;
    }
    
    this.cacheMisses++;
    return null;
  }

  /**
   * Cache analysis results from Claude
   * Permanent storage to avoid future API costs
   */
  async cacheAnalysisResults(analysisResult: any): Promise<void> {
    const { patterns, novel_insights } = analysisResult;
    
    // Cache each pattern discovered
    for (const pattern of patterns || []) {
      const cachedSolution: CachedSolution = {
        pattern_id: pattern.pattern_id || this.generatePatternId(pattern),
        solution_text: pattern.fix_template || 'General debugging guidance',
        confidence_score: pattern.confidence || 70,
        success_rate: 85, // Default success rate, will be updated based on feedback
        applicable_repos: pattern.applicable_repos || ['all'],
        fix_templates: Array.isArray(pattern.fix_template) ? pattern.fix_template : [pattern.fix_template],
        prevention_strategies: pattern.prevention_strategy ? [pattern.prevention_strategy] : [],
        cached_date: new Date().toISOString(),
        usage_count: 0,
        last_accessed: new Date().toISOString()
      };
      
      await this.cacheSolution(cachedSolution);
    }

    // Cache novel insights as special patterns
    for (const insight of novel_insights || []) {
      const cachedSolution: CachedSolution = {
        pattern_id: this.generatePatternId(insight),
        solution_text: insight.insight || 'Novel debugging insight',
        confidence_score: insight.confidence || 75,
        success_rate: 80,
        applicable_repos: insight.applicable_repos || ['all'],
        fix_templates: insight.implementation_steps || [],
        prevention_strategies: insight.prevention_recommendations || [],
        cached_date: new Date().toISOString(),
        usage_count: 0,
        last_accessed: new Date().toISOString()
      };
      
      await this.cacheSolution(cachedSolution);
    }

    this.updateCacheStatistics();
  }

  /**
   * Cache individual solution permanently
   */
  private async cacheSolution(solution: CachedSolution): Promise<void> {
    // Store in memory cache
    this.solutionCache.set(solution.pattern_id, solution);
    
    // Persist to disk for permanent storage
    await this.saveSolutionToFile(solution);
  }

  /**
   * Save solution to individual file for reliability
   */
  private async saveSolutionToFile(solution: CachedSolution): Promise<void> {
    try {
      const fileName = `${solution.pattern_id}.json`;
      const filePath = path.join(this.cachePath, fileName);
      await fs.writeJson(filePath, solution, { spaces: 2 });
    } catch (error) {
      console.warn(`Failed to save solution ${solution.pattern_id}:`, error);
    }
  }

  /**
   * Search cache for similar patterns
   * Fuzzy matching for partial hits
   */
  async searchSimilarPatterns(errorSignature: string, threshold: number = 70): Promise<CachedSolution[]> {
    const similarSolutions: CachedSolution[] = [];
    
    for (const solution of this.solutionCache.values()) {
      const similarity = this.calculateSimilarity(errorSignature, solution.pattern_id);
      
      if (similarity >= threshold) {
        similarSolutions.push(solution);
      }
    }
    
    // Sort by confidence and success rate
    return similarSolutions.sort((a, b) => 
      (b.confidence_score * b.success_rate) - (a.confidence_score * a.success_rate)
    );
  }

  /**
   * Update solution success rate based on user feedback
   */
  async updateSolutionEffectiveness(
    patternId: string, 
    wasSuccessful: boolean,
    feedback?: string
  ): Promise<void> {
    const solution = this.solutionCache.get(patternId);
    
    if (solution) {
      // Update success rate with weighted average
      const weight = 0.1; // How much to weight new feedback
      const newSuccessRate = wasSuccessful ? 100 : 0;
      solution.success_rate = (solution.success_rate * (1 - weight)) + (newSuccessRate * weight);
      
      // Update confidence based on feedback
      if (wasSuccessful) {
        solution.confidence_score = Math.min(100, solution.confidence_score + 2);
      } else {
        solution.confidence_score = Math.max(50, solution.confidence_score - 5);
      }
      
      solution.last_accessed = new Date().toISOString();
      
      await this.saveSolutionToFile(solution);
    }
  }

  /**
   * Get cache statistics for reporting
   */
  getCacheStatistics(): CacheStatistics {
    this.updateCacheStatistics();
    return this.cacheStats;
  }

  /**
   * Clean up old or low-performing cached solutions
   */
  async cleanupCache(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); // Remove solutions older than 90 days with low usage
    
    for (const [patternId, solution] of this.solutionCache) {
      const solutionDate = new Date(solution.cached_date);
      
      // Remove if old and rarely used, or if consistently failing
      const shouldRemove = (
        (solutionDate < cutoffDate && solution.usage_count < 3) ||
        (solution.success_rate < 30 && solution.usage_count > 5)
      );
      
      if (shouldRemove) {
        this.solutionCache.delete(patternId);
        
        // Remove from disk
        const filePath = path.join(this.cachePath, `${patternId}.json`);
        try {
          await fs.remove(filePath);
        } catch (error) {
          console.warn(`Failed to remove cached file ${patternId}:`, error);
        }
      }
    }
    
    this.updateCacheStatistics();
  }

  /**
   * Export cache for backup or transfer
   */
  async exportCache(): Promise<any> {
    const exportData = {
      cache_version: '1.0',
      export_date: new Date().toISOString(),
      total_solutions: this.solutionCache.size,
      solutions: Array.from(this.solutionCache.values()),
      statistics: this.cacheStats
    };
    
    const exportPath = path.join(this.cachePath, `cache-export-${Date.now()}.json`);
    await fs.writeJson(exportPath, exportData, { spaces: 2 });
    
    return exportPath;
  }

  private generatePatternId(pattern: any): string {
    // Create unique ID for pattern
    const content = JSON.stringify({
      type: pattern.pattern_type || pattern.type,
      message: pattern.root_cause || pattern.insight || pattern.error_message,
      context: pattern.repo_context || pattern.applicable_repos
    });
    
    return 'pattern_' + createHash('md5').update(content).digest('hex').substring(0, 12);
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple similarity calculation
    // In production: would use more sophisticated NLP similarity
    const words1 = str1.toLowerCase().split(/\W+/);
    const words2 = str2.toLowerCase().split(/\W+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const similarity = (commonWords.length * 2) / (words1.length + words2.length) * 100;
    
    return Math.round(similarity);
  }

  private updateCacheStatistics(): void {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;
    
    this.cacheStats = {
      total_cached_solutions: this.solutionCache.size,
      cache_hit_rate: Math.round(hitRate * 100) / 100,
      total_api_calls_saved: this.cacheHits,
      estimated_cost_savings: this.cacheHits * 0.05 // Assume $0.05 per API call saved
    };
  }
}