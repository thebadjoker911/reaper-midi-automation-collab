# Contributing to Reaper MIDI & Automation Collaboration System

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/reaper-midi-automation-collab.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development Workflow

### Code Style

We use ESLint to maintain code quality. Before committing:

```bash
npm run lint
```

Our ESLint configuration enforces:
- 2-space indentation
- Single quotes for strings
- Semicolons required
- Unix line endings

### Project Structure

```
src/
├── parser/           # RPP file parsing logic
├── server/           # WebSocket server implementation
├── client/           # WebSocket client implementation
├── utils/            # Shared utilities (file monitoring, OT)
├── reascript/        # Lua scripts for Reaper integration
└── index.js          # Main entry point
```

### Adding New Features

1. **Parser Enhancements**
   - Add new parsing logic to `src/parser/rpp-parser.js`
   - Update extraction methods if needed
   - Test with sample RPP files

2. **Server Features**
   - Extend `src/server/websocket-server.js`
   - Add new message types to the protocol
   - Update message handling

3. **Client Features**
   - Extend `src/client/websocket-client.js`
   - Add new event emitters
   - Update connection logic

4. **Operational Transform**
   - Enhance `src/utils/operational-transform.js`
   - Add new operation types
   - Implement transform logic

### Testing

Currently, the project uses manual testing. When adding features:

1. Test with the example scripts
2. Verify with multiple clients
3. Check edge cases and error handling

**Future**: We plan to add automated tests using Jest or Mocha.

### Documentation

Update documentation when adding features:

- **API Changes**: Update `docs/API.md`
- **Setup Changes**: Update `docs/SETUP.md`
- **Architecture Changes**: Update `docs/ARCHITECTURE.md`
- **New Examples**: Add to `examples/` with README

## Pull Request Process

1. **Before Submitting**
   - Ensure code passes linting: `npm run lint`
   - Test your changes thoroughly
   - Update relevant documentation
   - Add examples if applicable

2. **PR Description**
   - Describe what changes you made
   - Explain why the changes are needed
   - List any breaking changes
   - Reference related issues

3. **Review Process**
   - Maintainers will review your PR
   - Address any feedback
   - Once approved, PR will be merged

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards others

### Our Responsibilities

Maintainers will:
- Review PRs in a timely manner
- Provide clear feedback
- Maintain project quality
- Foster a welcoming environment

## Reporting Issues

### Bug Reports

Include:
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- System information (OS, Node version, Reaper version)
- Error messages and logs

### Feature Requests

Include:
- Clear description of the feature
- Use cases and benefits
- Possible implementation approach
- Any alternatives considered

## Development Ideas

Here are areas that need improvement:

### High Priority
- [ ] Add unit tests for parser
- [ ] Add integration tests for WebSocket communication
- [ ] Implement user authentication
- [ ] Add encryption (WSS support)
- [ ] Optimize large file handling

### Medium Priority
- [ ] Add compression for messages
- [ ] Implement project history/versioning
- [ ] Create a visual collaboration UI
- [ ] Add database for state persistence
- [ ] Improve ReaScript performance

### Low Priority
- [ ] Add metrics and monitoring
- [ ] Implement rate limiting
- [ ] Add multi-language support
- [ ] Create Docker containers
- [ ] Add CI/CD pipeline

## Questions?

If you have questions:
- Open an issue with the "question" label
- Check existing issues and documentation
- Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to the Reaper MIDI & Automation Collaboration System! 🎵
