import { sanitizeHtml } from './sanitizer.util';

describe('sanitizeHtml', () => {
  it('should return empty string if input is empty string', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('should allow safe tags', () => {
    const input = '<p>Hello <b>World</b></p>';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('should remove script tags', () => {
    const input = '<script>alert("xss")</script><p>Safe</p>';
    expect(sanitizeHtml(input)).toBe('<p>Safe</p>');
  });

  it('should remove onclick attributes', () => {
    // button is not in allowedTags, so it will be stripped, content preserved
    // Test with an allowed tag like 'a'
    const inputA = '<a href="#" onclick="alert(\'xss\')">Link</a>';
    expect(sanitizeHtml(inputA)).toBe('<a href="#">Link</a>');
  });

  it('should allow allowed attributes', () => {
    const input = '<a href="https://example.com" target="_blank" class="link">Link</a>';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('should remove disallowed attributes', () => {
    const input = '<img src="image.jpg" data-evil="true">';
    expect(sanitizeHtml(input)).toBe('<img src="image.jpg" />');
  });

  it('should allow img tags with safe attributes', () => {
    const input = '<img src="https://example.com/image.png" alt="Test image">';
    expect(sanitizeHtml(input)).toBe('<img src="https://example.com/image.png" alt="Test image" />');
  });

  it('should allow img tags with width and height', () => {
    const input = '<img src="image.jpg" alt="Test" width="500" height="300">';
    expect(sanitizeHtml(input)).toBe('<img src="image.jpg" alt="Test" width="500" height="300" />');
  });

  it('should remove dangerous attributes from img tags', () => {
    const input = '<img src="image.jpg" alt="Test" onclick="alert(\'xss\')" onload="evil()">';
    expect(sanitizeHtml(input)).toBe('<img src="image.jpg" alt="Test" />');
  });

  it('should allow full editor image HTML', () => {
    const input = '<p><img src="http://localhost:3000/api/uploads/editor-images/550e8400-e29b-41d4-a716-446655440000-1712345678901.png" alt="screenshot.png" /></p>';
    const expected = '<p><img src="http://localhost:3000/api/uploads/editor-images/550e8400-e29b-41d4-a716-446655440000-1712345678901.png" alt="screenshot.png" /></p>';
    expect(sanitizeHtml(input)).toBe(expected);
  });

  it('should sanitize nested unsafe content', () => {
    const input = '<div><script>alert("xss")</script><span>Safe</span></div>';
    expect(sanitizeHtml(input)).toBe('<div><span>Safe</span></div>');
  });
});
