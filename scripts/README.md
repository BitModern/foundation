# Version Management Scripts

These scripts implement the enhanced versioning system with Major.Minor.Update.Build# format.

## Versioning Rules

- **Major**: Only incremented when user explicitly requests or approves major version suggestions
- **Minor**: Only incremented when user explicitly requests or approves minor version suggestions  
- **Update**: Auto-incremented when new features/enhancements/capabilities are added
- **Build**: Auto-incremented every build, detailing what was fixed or attempted

## Scripts

### `increment-build.js`
Manually increment build number with custom description:
```bash
node scripts/increment-build.js "Fixed login bug"
```

### `increment-update.js`
Increment update version for new features:
```bash
node scripts/increment-update.js "New Feature" "Added AI provider support" "Added OpenAI integration" "Enhanced UI components"
```

### `auto-version.js`
Auto-increment build during development (called automatically):
```bash
node scripts/auto-version.js
```

## Usage Examples

### During Development
- Every build/compile should auto-increment build number
- Use `auto-version.js` or `increment-build.js` with build description

### New Features
- Use `increment-update.js` when adding new features/enhancements
- This resets build number to 0

### Release Notes
- By default, only shows update increments (Major.Minor.Update.000)
- Toggle "Show All Builds" to see individual build increments
- Type/score pills now appear after title for better alignment
- Ordered by version number instead of date

## Integration

To integrate with build process:
1. Call `node scripts/auto-version.js` before/after builds
2. For manual builds: `node scripts/increment-build.js "Description of what was fixed"`
3. For new features: `node scripts/increment-update.js "Feature Name" "Description"`