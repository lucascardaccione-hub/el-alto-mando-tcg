/**
 * Core Security Utilities:
 * - Smart Email Validation & Domain Typo Detection (.dom, gmial.com, hotmial.com, etc.)
 * - Password Strength Evaluation
 * - Brute-Force Rate Limiting & Cooldown Guards
 */

export interface EmailValidationResult {
  valid: boolean;
  reason?: string;
  suggestion?: string;
}

const DOMAIN_TYPO_MAP: Record<string, string> = {
  'gmail.dom': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.cmo': 'gmail.com',
  'gmail.comm': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gimail.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmail.com.ar': 'gmail.com',
  'hotmail.dom': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmail.cmo': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'homtail.com': 'hotmail.com',
  'outlook.dom': 'outlook.com',
  'outlook.con': 'outlook.com',
  'outlok.com': 'outlook.com',
  'outllok.com': 'outlook.com',
  'yahoo.dom': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  'icloud.dom': 'icloud.com',
  'icloud.con': 'icloud.com',
  'iclud.com': 'icloud.com',
  'live.dom': 'live.com',
  'live.con': 'live.com',
};

const INVALID_TLDS = new Set([
  'dom',
  'con',
  'cmo',
  'comm',
  'cm',
  'om',
  'coom',
  'cor',
  'ne',
  'orgg',
  'nett',
  'local',
  'test',
  'invalid',
]);

export function validateAndSuggestEmail(rawEmail: string): EmailValidationResult {
  const email = (rawEmail || '').trim().toLowerCase();

  if (!email) {
    return { valid: false, reason: 'Ingresa una dirección de correo electrónico.' };
  }

  const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicRegex.test(email)) {
    return { valid: false, reason: 'El formato del correo electrónico no es válido.' };
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return { valid: false, reason: 'El formato del correo electrónico no es válido.' };
  }

  const [localPart, domain] = parts;

  if (localPart.length < 1 || localPart.length > 64 || localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return { valid: false, reason: 'El nombre de usuario del correo no es válido.' };
  }

  if (domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) {
    return { valid: false, reason: 'El dominio del correo no es válido.' };
  }

  // Check exact typo map first
  if (DOMAIN_TYPO_MAP[domain]) {
    const corrected = `${localPart}@${DOMAIN_TYPO_MAP[domain]}`;
    return {
      valid: false,
      suggestion: corrected,
      reason: `Parece haber un error de tipeo en "@${domain}". ¿Quisiste decir ${corrected}?`,
    };
  }

  const domainSegments = domain.split('.');
  const tld = domainSegments[domainSegments.length - 1];

  if (!tld || tld.length < 2 || /^\d+$/.test(tld)) {
    return { valid: false, reason: `La terminación ".${tld}" del correo no es válida.` };
  }

  if (INVALID_TLDS.has(tld)) {
    const guessedDomain = [...domainSegments.slice(0, -1), 'com'].join('.');
    const suggestion = `${localPart}@${guessedDomain}`;
    return {
      valid: false,
      suggestion,
      reason: `El dominio termina en ".${tld}" (no existe). ¿Quisiste decir ${suggestion}?`,
    };
  }

  return { valid: true };
}

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  checks: {
    minLength: boolean;
    goodLength: boolean;
    hasUpperOrLower: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const checks = {
    minLength: password.length >= 6,
    goodLength: password.length >= 8,
    hasUpperOrLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  if (!password || !checks.minLength) {
    return {
      score: 0,
      label: password.length === 0 ? 'Sin ingresar' : 'Muy corta (mín. 6)',
      color: 'bg-rose-500',
      checks,
    };
  }

  let points = 1;
  if (checks.goodLength) points++;
  if (checks.hasUpperOrLower) points++;
  if (checks.hasNumber || checks.hasSpecial) points++;

  const score = Math.min(4, points) as 0 | 1 | 2 | 3 | 4;

  const labels: Record<number, { label: string; color: string }> = {
    1: { label: 'Básica', color: 'bg-amber-500' },
    2: { label: 'Aceptable', color: 'bg-yellow-400' },
    3: { label: 'Fuerte', color: 'bg-emerald-400' },
    4: { label: 'Nivel Alto Mando', color: 'bg-blue-400' },
  };

  return {
    score,
    label: labels[score].label,
    color: labels[score].color,
    checks,
  };
}

// ============================================================================
// Server-Side In-Memory Brute-Force & Rate Limit Guards
// ============================================================================

interface RateRecord {
  count: number;
  resetAt: number;
}

const attemptStore = new Map<string, RateRecord>();
const cooldownStore = new Map<string, number>();

export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'local-ip';
}

/**
 * Checks if a key has exceeded `maxAttempts` within `windowMs`.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const record = attemptStore.get(key);

  if (!record || now > record.resetAt) {
    return { allowed: true, remaining: maxAttempts, retryAfterSeconds: 0 };
  }

  if (record.count >= maxAttempts) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Records a failed attempt and returns the updated count.
 */
export function recordFailedAttempt(
  key: string,
  windowMs: number = 15 * 60 * 1000
): number {
  const now = Date.now();
  const record = attemptStore.get(key);

  if (!record || now > record.resetAt) {
    attemptStore.set(key, { count: 1, resetAt: now + windowMs });
    return 1;
  }

  record.count += 1;
  attemptStore.set(key, record);
  return record.count;
}

export function clearFailedAttempts(key: string): void {
  attemptStore.delete(key);
}

/**
 * Enforces a cooldown between actions (e.g., sending emails).
 */
export function checkActionCooldown(
  key: string,
  cooldownSeconds: number = 45
): { allowed: boolean; waitSeconds: number } {
  const now = Date.now();
  const availableAt = cooldownStore.get(key) || 0;

  if (now < availableAt) {
    return {
      allowed: false,
      waitSeconds: Math.max(1, Math.ceil((availableAt - now) / 1000)),
    };
  }

  cooldownStore.set(key, now + cooldownSeconds * 1000);
  return { allowed: true, waitSeconds: 0 };
}
