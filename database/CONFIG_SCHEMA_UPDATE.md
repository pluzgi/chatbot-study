# Donation Configuration Schema Update

## Overview
Updated the `donation_decisions` table to properly handle dashboard configuration data with NULL values for conditions that don't show the dashboard.

## Database Changes

### Schema Updates (`schema.sql`)
- Renamed column: `configuration` → `config`
- Changed default: `'{}'::jsonb` → `NULL`
- Added constraint: `CHECK (condition IN ('A', 'B', 'C', 'D'))`
- Added GIN index for JSON queries: `idx_donation_config`

### Migration File (`005_update_donation_config.sql`)
- Renames `configuration` column to `config`
- Updates default value to NULL
- Adds condition constraint
- Creates GIN index for performance
- Includes documentation comments

## Data Structure

### Config Column Values by Condition

**Condition A (Low Transparency, Low Control):**
- No DNL shown
- No Dashboard shown
- Config value: `NULL`

**Condition B (High Transparency, Low Control):**
- DNL shown
- No Dashboard shown
- Config value: `NULL`

**Condition C (Low Transparency, High Control):**
- No DNL shown
- Dashboard shown
- Config value when **donate**:
  ```json
  {
    "scope": "full" | "topics",
    "purpose": "academic" | "commercial",
    "storage": "swiss" | "eu" | "no-preference",
    "retention": "1month" | "3months" | "6months" | "1year" | "indefinite"
  }
  ```
- Config value when **decline**: `NULL`

**Condition D (High Transparency, High Control):**
- DNL shown
- Dashboard shown
- Config value when **donate**: Same as Condition C
- Config value when **decline**: `NULL`

## Backend Updates

### Service Method (`experiment.service.js`)
```javascript
async recordDonation(participantId, decision, dashboardConfig = null) {
  // Config is NULL for:
  // - Conditions A & B (no dashboard)
  // - Any decline decision
  // Config is JSON object for:
  // - Conditions C & D when user donates
  const configValue = dashboardConfig ? JSON.stringify(dashboardConfig) : null;

  await pool.query(
    `INSERT INTO donation_decisions (id, participant_id, decision, condition,
     transparency_level, control_level, config, decision_timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [uuidv4(), participantId, decision, condition, config.transparency,
     config.control, configValue]
  );
}
```

## Frontend Flow

### DonationModal Component
```typescript
// For Conditions A & B (no dashboard):
dashboardConfig = null
onDecision(decision, undefined)  // undefined becomes null in backend

// For Conditions C & D (with dashboard):
// When donate:
dashboardConfig = {
  scope: "full",
  purpose: "academic",
  storage: "swiss",
  retention: "1year"
}
onDecision("donate", dashboardConfig)  // Sent as JSON

// When decline:
onDecision("decline", undefined)  // undefined becomes null
```

### API Service (`api.ts`)
```typescript
async recordDonation(participantId: string, decision: 'donate' | 'decline', config?: any) {
  const data = { participantId, decision, configuration: config };
  // config is undefined → configuration: undefined
  // Backend receives undefined → defaults to null in service
}
```

## Migration Instructions

### For New Databases
Use the updated `schema.sql` file directly.

### For Existing Databases
Run the migration:
```bash
psql -U your_username -d your_database_name -f database/migrations/005_update_donation_config.sql
```

## Querying Examples

### Find all donations with dashboard configuration
```sql
SELECT * FROM donation_decisions
WHERE config IS NOT NULL;
```

### Find donations by specific configuration choice
```sql
-- Find users who chose "swiss" storage
SELECT * FROM donation_decisions
WHERE config->>'storage' = 'swiss';

-- Find users who chose indefinite retention
SELECT * FROM donation_decisions
WHERE config->>'retention' = 'indefinite';

-- Find users who chose full scope donation
SELECT * FROM donation_decisions
WHERE config->>'scope' = 'full';
```

### Count by configuration presence
```sql
SELECT
  condition,
  decision,
  COUNT(*) FILTER (WHERE config IS NULL) as no_config,
  COUNT(*) FILTER (WHERE config IS NOT NULL) as with_config
FROM donation_decisions
GROUP BY condition, decision;
```

## Validation

The system ensures:
1. ✅ Conditions A & B always have NULL config (no dashboard shown)
2. ✅ Decline decisions always have NULL config (no configuration needed)
3. ✅ Conditions C & D donate decisions can have JSON config or NULL
4. ✅ Config is properly validated before submission (dashboard fields required)
5. ✅ Database uses JSONB for efficient querying
6. ✅ GIN index optimizes JSON field queries
