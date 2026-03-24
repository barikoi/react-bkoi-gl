# Security Audit Report: react-bkoi-gl

**Project:** react-bkoi-gl (v2.0.1)
**Type:** React Component Library for Barikoi Maps (MapLibre GL JS wrapper)
**Date:** March 24, 2026
**Auditor:** Security Audit Review

---

## Executive Summary

**Overall Risk Posture: MEDIUM-HIGH**

The react-bkoi-gl library is a React wrapper for MapLibre GL JS, designed for Barikoi Maps. The security assessment identified **12 findings** across dependency vulnerabilities, XSS risks, input validation gaps, and secure coding practices.

### Key Findings Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 2 |
| Medium | 4 |
| Low | 4 |
| Informational | 2 |

---

## Detailed Findings

### Finding 1: XSS Vulnerability via innerHTML Usage
**Severity: HIGH**
**Category: OWASP A03:2021 - Injection**
**CWE: CWE-79 (Cross-site Scripting)**

**Location:**
`src/components/attribution-control.ts` (Lines 38-41)

**Evidence:**
```typescript
inner.innerHTML =
  '© <a href="https://barikoi.com" target="_blank">Barikoi</a> ' +
  '© <a href="https://openmaptiles.org" target="_blank">OpenMapTiles</a> ' +
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>'
```

**Risk:**
While the current content is hardcoded and safe, using `innerHTML` establishes a dangerous pattern. If this code is modified in the future or if user-controlled content is added, it could lead to XSS attacks.

**Remediation:**
Use DOM APIs to create elements safely:
```typescript
const createLink = (text: string, href: string) => {
  const a = document.createElement('a');
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = text;
  return a;
};

inner.appendChild(createLink('Barikoi', 'https://barikoi.com'));
inner.appendChild(document.createTextNode(' © '));
```

---

### Finding 2: XSS Vulnerability via innerHTML with Dynamic SVG Injection
**Severity: HIGH**
**Category: OWASP A03:2021 - Injection**
**CWE: CWE-79 (Cross-site Scripting)**

**Location:**
`src/components/minimap-control.ts` (Lines 142, 382, 282, 397)

**Evidence:**
```typescript
// Line 142 - Default SVG icon constant
const DEFAULT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.6 18L8 8.4V17H6V5h12v2H9.4l9.6 9.6l-1.4 1.4Z" /></svg>`

// Line 382 - User-provided icon injected via innerHTML
el.innerHTML = this.options.toggleButton?.icon || DEFAULT_ICON

// Line 282 - Dynamic CSS injection
styleEl.innerHTML = this.getContainerStyles()

// Line 397 - Dynamic CSS with user-provided values
styleEl.innerHTML = `
  button#${elId} {
    ...
    background-color: ${iconBackgroundColor};
    ...
  }
`
```

**Risk:**
The `toggleButton?.icon` option allows users to inject arbitrary HTML/SVG content via `innerHTML`. A malicious SVG could contain:
- `<script>` tags (in non-XML parsing contexts)
- `onload` event handlers
- `use` elements referencing external resources

**Remediation:**
1. For SVG icons, sanitize the input or use a strict allowlist:
```typescript
const sanitizeSVG = (svgString: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  doc.querySelectorAll('script, [onclick], [onload], [onerror]').forEach(el => el.remove());
  return new XMLSerializer().serializeToString(doc);
};
```

2. For CSS, use `style.setProperty()` instead of `innerHTML`.

---

### Finding 3: Prototype Pollution Vulnerability in Dependency
**Severity: HIGH (External Dependency)**
**Category: OWASP A06:2021 - Vulnerable and Outdated Components**
**CWE: CWE-1321 (Prototype Pollution)**

**Location:**
`package.json` - `flatted` dependency (transitive)

**Evidence (from npm audit):**
```
flatted  <=3.4.1
Severity: high
Prototype Pollution via parse() in NodeJS flatted
https://github.com/advisories/GHSA-rf6f-7fwh-wjgh
```

**Remediation:**
```bash
npm audit fix
```

---

### Finding 4: Control Flow Scoping Vulnerability in Dependency
**Severity: LOW (External Dependency)**
**Category: OWASP A06:2021 - Vulnerable and Outdated Components**

**Location:**
`package.json` - `jest-environment-jsdom` and transitive dependencies

**Remediation:**
```bash
npm audit fix --force
```

---

### Finding 5: Missing Input Validation for Style URLs and Sources
**Severity: MEDIUM**
**Category: OWASP A03:2021 - Injection**
**CWE: CWE-20 (Improper Input Validation)**

**Location:**
`src/utils/style-utils.ts` (Lines 9-16)

**Evidence:**
```typescript
export function normalizeStyle(
  style: string | StyleSpecification | ImmutableLike<StyleSpecification>
): string | StyleSpecification {
  if (!style) {
    return null
  }
  if (typeof style === 'string') {
    return style  // No validation of URL format or protocol
  }
}
```

**Risk:**
Style URLs are passed directly without validation. A malicious URL could:
- Point to internal network resources (SSRF)
- Use `javascript:` or `data:` protocols

**Remediation:**
```typescript
if (typeof style === 'string') {
  try {
    const url = new URL(style);
    if (!['http:', 'https:', 'mapbox:'].includes(url.protocol)) {
      console.warn('Invalid style URL protocol');
      return null;
    }
  } catch {
    // Not a URL, might be a style ID
  }
  return style;
}
```

---

### Finding 6: Arbitrary Code Execution via Global Settings
**Severity: MEDIUM**
**Category: OWASP A03:2021 - Injection**
**CWE: CWE-94 (Code Injection)**

**Location:**
`src/utils/set-globals.ts` (Lines 18-46)

**Evidence:**
```typescript
if (RTLTextPlugin && mapLib.getRTLTextPluginStatus?.() === 'unavailable') {
  mapLib.setRTLTextPlugin(pluginUrl, ...)  // No URL validation
}
if (workerUrl !== undefined) {
  mapLib.setWorkerUrl(workerUrl)  // No URL validation
}
```

**Risk:**
The `RTLTextPlugin` and `workerUrl` settings accept arbitrary URLs without validation.

**Remediation:**
Add URL validation:
```typescript
const validateUrl = (url: string, settingName: string): boolean => {
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      console.warn(`${settingName}: Only http/https protocols allowed`);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};
```

---

### Finding 7: Exposed Raw Map Instance Bypasses Safety Controls
**Severity: MEDIUM**
**Category: OWASP A01:2021 - Broken Access Control**
**CWE: CWE-284 (Improper Access Control)**

**Location:**
`src/maplibre/create-ref.ts` (Lines 28-50)

**Evidence:**
```typescript
export type MapRef = {
  getMap(): MapInstance  // Bypasses all safety controls
} & Omit<MapInstance, (typeof skipMethods)[number]>
```

**Risk:**
The `getMap()` method provides direct access to the underlying MapLibre instance, bypassing all safety controls.

**Remediation:**
Document the security implications and add a development-mode warning.

---

### Finding 8: CSS Property Injection via Style Object
**Severity: MEDIUM**
**Category: OWASP A03:2021 - Injection**
**CWE: CWE-79 (Cross-site Scripting)**

**Location:**
`src/utils/apply-react-style.ts` (Lines 6-19)

**Evidence:**
```typescript
for (const key in styles) {
  const value = styles[key]
  style[key] = value  // Direct assignment without validation
}
```

**Risk:**
Certain CSS properties could be exploited in legacy browsers.

**Remediation:**
Add validation for dangerous CSS patterns:
```typescript
const DANGEROUS_PATTERNS = [/javascript:/i, /expression\s*\(/i, /behavior\s*:/i];
```

---

### Finding 9: DOM-Based XSS via Fullscreen Container ID
**Severity: LOW**
**Category: OWASP A03:2021 - Injection**

**Location:**
`src/components/fullscreen-control.ts` (Lines 22-24)

**Remediation:**
Add validation that the container element exists.

---

### Finding 10: Missing Content Security Policy Guidance
**Severity: LOW**
**Category: OWASP A05:2021 - Security Misconfiguration**

**Evidence:**
No CSP documentation or guidance is provided for users deploying in strict CSP environments.

**Remediation:**
Add documentation recommending CSP headers:
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' blob:;
  worker-src 'self' blob:;
  img-src 'self' data: blob: https:;
  connect-src 'self' https:;
```

---

### Finding 11: Use of Non-Cryptographic Random for ID Generation
**Severity: LOW**
**Category: OWASP A02:2021 - Cryptographic Failures**
**CWE: CWE-338 (Use of Cryptographically Weak PRNG)**

**Location:**
`src/components/minimap-control.ts` (Lines 147-153)

**Evidence:**
```typescript
function getRandomUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
```

**Remediation:**
Use `crypto.randomUUID()` if available.

---

### Finding 12: Missing Rel Attribute on External Links
**Severity: INFORMATIONAL**

**Location:**
`src/components/attribution-control.ts`

**Note:**
The AttributionControl uses `innerHTML` with links that do not have `rel="noopener noreferrer"` protection. LogoControl correctly uses `rel="noopener nofollow"`.

---

## Dependency Security Analysis

### Production Dependencies

| Package | Version | Risk Level | Notes |
|---------|---------|------------|-------|
| maplibre-gl | ^5.15.0 | Low | Well-maintained mapping library |
| @maplibre/maplibre-gl-style-spec | ^24.4.1 | Low | Style specification utilities |
| maplibre-gl-draw | ^1.6.9 | Medium | Third-party drawing plugin |

### Dev Dependencies with Known Vulnerabilities

| Package | Vulnerability | Severity | Fix Available |
|---------|---------------|----------|---------------|
| flatted | Prototype Pollution | High | Yes (npm audit fix) |
| jest-environment-jsdom | Control Flow Scoping | Low | Yes (npm audit fix --force) |

---

## OWASP Top 10 (2021) Compliance Summary

| OWASP Category | Status | Notes |
|----------------|--------|-------|
| A01: Broken Access Control | Partial | MapRef exposes raw instance |
| A02: Cryptographic Failures | Pass | Not applicable (no crypto) |
| A03: Injection | **Fail** | Multiple XSS vectors identified |
| A04: Insecure Design | Pass | Reasonable architecture |
| A05: Security Misconfiguration | Partial | Missing CSP guidance |
| A06: Vulnerable Components | **Fail** | Known vulnerable dependencies |
| A07: Auth Failures | N/A | Library does not handle auth |
| A08: Software/Data Integrity | Pass | Uses npm for package management |
| A09: Logging/Monitoring | N/A | Library does not handle logging |
| A10: SSRF | Partial | No URL validation for styles/workers |

---

## Remediation Roadmap

### Immediate (Days)

1. **Update vulnerable dependencies:**
   ```bash
   npm audit fix
   npm audit fix --force
   ```

2. **Sanitize SVG input in MinimapControl** (Finding 2)

### Short-Term (Weeks)

3. **Replace innerHTML with safe DOM methods** (Finding 1)
4. **Add URL validation for global settings** (Finding 6)
5. **Validate style URLs** (Finding 5)

### Long-Term (Next Release)

6. **Add CSP documentation** (Finding 10)
7. **Use crypto.randomUUID()** (Finding 11)
8. **Add CSS property validation** (Finding 8)
9. **Document getMap() security implications** (Finding 7)

---

## Quick Wins

1. Run `npm audit fix` immediately to resolve dependency vulnerabilities
2. Add input sanitization to MinimapControl icon handling
3. Replace innerHTML in AttributionControl with DOM APIs

---

## Conclusion

The react-bkoi-gl library has a reasonable architecture but contains several security concerns primarily around:

1. **Input sanitization** - Multiple XSS vectors through innerHTML and SVG injection
2. **Dependency management** - Known vulnerable packages in dev dependencies
3. **URL validation** - No validation for externally loaded resources

The most critical findings relate to XSS vulnerabilities in the AttributionControl and MinimapControl components. These should be addressed before the next release.

---

**Report Generated:** March 24, 2026
**Confidence Level:** High
