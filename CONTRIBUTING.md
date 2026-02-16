# Contributing to OctoTRMNL

Thank you for considering contributing to this project!

## How to Contribute

### Reporting Issues

- Check existing issues first to avoid duplicates
- Include your Cloudflare Worker logs if applicable
- Describe what you expected vs what happened
- Include TRMNL display screenshots if relevant

### Suggesting Enhancements

- Open an issue describing your enhancement idea
- Explain the use case and why it would be valuable
- Consider backward compatibility with existing setups

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly (see SETUP.md for local development)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Follow existing code formatting
- Add comments for complex logic
- Update documentation if changing functionality
- Keep commits focused and atomic

### Testing

Before submitting:
- Test the Cloudflare Worker locally with `wrangler dev`
- Verify TRMNL plugin renders correctly with `trmnlp serve`
- Ensure no sensitive data is committed
- Check that the plugin works on an actual TRMNL device if possible

## Questions?

Feel free to open an issue for any questions!
