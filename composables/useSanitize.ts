import DOMPurify from 'dompurify';

export function useSanitize() {
  // Initialize DOMPurify
  const sanitize = (html: string): string => {
    // Configure DOMPurify to allow certain tags and attributes
    const config = {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      KEEP_CONTENT: true,
      RETURN_DOM_FRAGMENT: false,
      RETURN_DOM: false,
      FORCE_BODY: false,
    };

    return DOMPurify.sanitize(html, config);
  };

  return {
    sanitize
  };
} 