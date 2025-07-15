/**
 * Detects and cleans phone numbers from pasted input
 * @param input - The input string that might contain a phone number
 * @returns Cleaned phone number or original input if not a valid phone number
 */
export const detectAndCleanPhone = (input: string): string => {
  // Step 1: Remove all spaces and '+' sign
  let cleaned = input.replace(/[\s+]/g, "");
  
  // Step 2: Check if it's a number
  if (/^\d+$/.test(cleaned)) {
    // Step 3: If length is 12 and starts with '91', remove the '91'
    if (cleaned.length === 12 && cleaned.startsWith("91")) {
      cleaned = cleaned.substring(2);
    }
    return cleaned;
  }
  
  // If not a valid number, return original input
  return input;
};

/**
 * Handles paste event and applies phone cleaning logic
 * @param event - Paste event
 * @param setValue - Function to set the cleaned value
 */
export const handlePhonePaste = (
  event: ClipboardEvent,
  setValue: (value: string) => void
) => {
  event.preventDefault();
  const pastedText = event.clipboardData?.getData('text') || '';
  const cleanedValue = detectAndCleanPhone(pastedText);
  setValue(cleanedValue);
};