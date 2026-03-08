/**
 * Formats a CPF string into the standard XXX.XXX.XXX-XX format.
 * @param value The raw CPF string.
 * @returns The formatted CPF string.
 */
export const formatCPF = (value: string): string => {
    const clean = value.replace(/\D/g, ''); // Remove non-digits
    return clean
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1'); // Limit to 11 digits + formatting
};

/**
 * Validates a CPF string.
 * @param cpf The CPF string to validate (can be formatted or raw).
 * @returns True if valid, false otherwise.
 */
export const validateCPF = (cpf: string): boolean => {
    const clean = cpf.replace(/\D/g, '');

    if (clean.length !== 11) return false;

    // Check for known invalid patterns (e.g., 111.111.111-11)
    if (/^(\d)\1+$/.test(clean)) return false;

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
        sum = sum + parseInt(clean.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;

    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(clean.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum = sum + parseInt(clean.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;

    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(clean.substring(10, 11))) return false;

    return true;
};
