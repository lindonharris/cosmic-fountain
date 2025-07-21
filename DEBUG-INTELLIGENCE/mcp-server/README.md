# Debug Intelligence MCP Server

A cost-optimized debugging intelligence system built as a Model Context Protocol (MCP) server. Provides 8 powerful debugging tools with 90% local processing and strategic Claude API usage to stay under $25/month.

## 🎯 Key Features

- **Cost-Optimized**: 90% local processing, 10% Claude API usage
- **Smart Caching**: Never pay twice for the same error analysis
- **Local Pattern Engine**: Pre-built database of 50+ common error patterns
- **Strategic Scheduling**: Budget-aware processing with intelligent queuing
- **Cross-Repository Intelligence**: Learn patterns across multiple projects
- **Real-time Risk Assessment**: Pre-commit code risk analysis

## 🛠️ Available Tools

### 1. **capture_error_context**
Intelligently capture and analyze error context with local pattern matching first, Claude analysis for novel errors.

### 2. **analyze_error_patterns** 
Batch error analysis with cost-efficient processing and permanent caching.

### 3. **suggest_preventive_fixes**
Generate concrete preventive fixes using cached intelligence and local patterns.

### 4. **track_fix_effectiveness**
Learn from fix outcomes to improve future recommendations and success rates.

### 5. **scan_code_for_risks**
Pre-commit risk analysis using local pattern database to prevent common errors.

### 6. **enrich_with_external_intel**
Strategic external intelligence gathering with strict budget controls.

### 7. **generate_guidance_report**
Cost-efficient debugging guidance reports using cached intelligence.

### 8. **update_error_taxonomy**
Continuously improve local pattern database with new discoveries.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Claude API key
- TypeScript

### Installation

1. **Clone and setup**:
   ```bash
   cd /path/to/the-dojo/DEBUG-INTELLIGENCE/mcp-server
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.template .env
   # Edit .env with your Claude API key
   ```

3. **Build the server**:
   ```bash
   npm run build
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

## 💰 Cost Optimization Strategy

### Budget Target: $25/month

**Local Processing (90% - $0 cost)**:
- Pattern matching against 50+ pre-built error patterns
- Cached solution retrieval
- Risk assessment algorithms
- Basic code analysis

**Claude API Usage (10% - $25 cost)**:
- Novel error analysis
- Complex pattern discovery
- Cross-repository correlation analysis
- Strategic batch processing

### Daily Budget Allocation
- **Daily Limit**: 17 API calls (~$0.83/day)
- **Monday**: 8 calls for weekend error batch processing
- **Wednesday**: 6 calls for cross-repo pattern analysis  
- **Friday**: 5 calls for weekly synthesis
- **Daily**: 1-2 calls for critical errors only

## 🔧 Configuration

### Environment Variables

Key configurations in `.env`:

```bash
# Required
CLAUDE_API_KEY=your_api_key_here

# Budget Controls
MONTHLY_BUDGET_USD=25
DAILY_CALL_LIMIT=17

# Pattern Engine
LOCAL_PATTERN_CONFIDENCE_THRESHOLD=85
CLAUDE_FALLBACK_THRESHOLD=70
```

### MCP Client Setup

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "debug-intelligence": {
      "command": "node",
      "args": ["/path/to/debug-intelligence-mcp/build/index.js"],
      "env": {
        "CLAUDE_API_KEY": "your_api_key"
      }
    }
  }
}
```

## 📊 Usage Examples

### Capture Error Context
```json
{
  "tool": "capture_error_context",
  "arguments": {
    "error_message": "TypeError: Cannot read property 'length' of undefined",
    "stack_trace": "at processItems (app.js:45:12)",
    "repo_context": "cosmic-fountain",
    "environment_info": {
      "node_version": "18.17.0",
      "environment": "development"
    }
  }
}
```

### Analyze Error Patterns
```json
{
  "tool": "analyze_error_patterns", 
  "arguments": {
    "error_batch": [
      {
        "error_message": "ECONNREFUSED localhost:5432",
        "repo_context": "chat-classify-smart-view"
      }
    ],
    "analysis_depth": "claude_if_needed",
    "cross_repo_context": true
  }
}
```

### Scan Code for Risks
```json
{
  "tool": "scan_code_for_risks",
  "arguments": {
    "code_changes": [
      {
        "file_path": "src/auth.js",
        "content": "const password = 'hardcoded123';"
      }
    ],
    "risk_threshold": 70
  }
}
```

## 🎯 Cost Efficiency Metrics

**Expected Performance**:
- **Cache Hit Rate**: 85%+ after 30 days
- **Local Pattern Match**: 90%+ of common errors  
- **API Cost**: <$25/month
- **Resolution Speed**: <30 seconds for cached patterns

**Monthly Projections**:
- **Total Errors Analyzed**: 1000+
- **API Calls**: ~500 (17/day)
- **Cost Savings**: $200+ through caching
- **Patterns Learned**: 50+ new patterns cached

## 🔄 Workflow Integration

### Git Hooks
```bash
# Pre-commit hook
#!/bin/bash
mcp-client call scan_code_for_risks --changes="$(git diff --cached)"
```

### CI/CD Integration
```yaml
# GitHub Actions
- name: Debug Intelligence Analysis
  run: |
    mcp-client call analyze_error_patterns --batch="$ERROR_LOG"
```

### IDE Integration
Configure your IDE to call `capture_error_context` on errors for instant debugging guidance.

## 📈 Learning and Improvement

The system continuously improves through:

1. **Pattern Learning**: New error patterns automatically cached
2. **Success Tracking**: Fix effectiveness rates updated in real-time
3. **Cross-Repository Intelligence**: Patterns discovered in one repo benefit all repos
4. **Usage Analytics**: Optimize API spending based on actual usage patterns

## 🛡️ Security and Privacy

- **No Code Storage**: Only error patterns and metadata cached
- **Local Processing**: Sensitive code analyzed locally
- **API Optimization**: Minimal data sent to Claude API
- **Audit Trail**: Complete logging of API usage and costs

## 🤝 Contributing

This is part of the-dojo control center ecosystem. To contribute:

1. Test with cosmic-fountain repository first
2. Document new patterns discovered
3. Update cost efficiency metrics
4. Submit cross-repository insights

## 📞 Support

For issues or enhancements:
- Check the-dojo/INTELLIGENCE/debug-intelligence/ for documentation
- Review cached patterns in error-intelligence-cache/
- Monitor usage in usage-log.json

---

**Built for The Dojo Control Center** - Cross-repository debugging intelligence at scale 🥋