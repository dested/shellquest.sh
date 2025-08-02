# Deployment Guide for TUI Crawler

## Prerequisites

1. **npm account**: Create one at https://www.npmjs.com/signup
2. **Verify package name availability**:
   ```bash
   npm view tui-crawler
   ```
   If taken, update the name in package.json

## Deployment Steps

### 1. Login to npm
```bash
npm login
```

### 2. Build the project
```bash
bun run build
```

### 3. Test locally
```bash
# Create a test package
npm pack

# Test installation (in a different directory)
npm install -g ./tui-crawler-0.1.0.tgz
tui-crawler

# Or test with bunx
bunx ./tui-crawler-0.1.0.tgz
```

### 4. Publish to npm
```bash
npm publish
```

### 5. Verify installation works
```bash
# Test with bunx (no installation needed)
bunx tui-crawler

# Or install globally
npm install -g tui-crawler
tui-crawler
```

## Version Updates

To publish updates:

1. Update version in package.json
2. Build: `bun run build`
3. Publish: `npm publish`

## Notes

- The package includes pre-built native libraries for all platforms
- Assets are bundled into the JavaScript file
- Minimum Node.js version is 18
- Works with both npm/node and bun runtimes