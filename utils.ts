
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\p{L}\p{M}\p{N}-]+/gu, '')   // Remove all non-letter, non-mark, non-numeric, non-hyphen chars across all languages
    .replace(/--+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')        // Trim - from start of text
    .replace(/-+$/, '');       // Trim - from end of text
};

export const toVirtualEmail = (text: string): string => {
  if (!text) return "";
  const trimmed = text.trim();
  
  // Map admin username to their actual Firebase login email
  if (trimmed.toLowerCase() === 'doctorapp0p' || trimmed.toLowerCase() === 'doctorapp0p@gmail.com') {
    return 'doctorapp0p@gmail.com';
  }
  if (trimmed.toLowerCase() === 'moderator' || trimmed.toLowerCase() === 'modaretor' || trimmed.toLowerCase() === 'moderator@nilpha.com' || trimmed.toLowerCase() === 'modaretor@nilpha.com') {
    return 'moderator@nilpha.com';
  }
  
  if (trimmed.includes('@')) return trimmed;
  // Convert spaces and special characters to make a valid virtual email
  const cleaned = trimmed
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{M}\p{N}-]+/gu, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
  return `${cleaned}@nilpha.com`;
};
