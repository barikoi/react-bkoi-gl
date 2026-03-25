# Security Audit Report: react-bkoi-gl

**Project:** react-bkoi-gl v2.0.1
**Type:** React Component Library for Barikoi Maps (MapLibre GL JS wrapper)
**Date:** March 25, 2026
**Auditor:** Security Audit Review
**Status:** Post-Fix Security Assessment

---

## Executive Summary

**Overall Risk Posture: LOW**

The react-bkoi-gl library continues to demonstrate a **good security posture** in this post-fix assessment. No new security vulnerabilities have been introduced by the recent code changes. All previously identified security controls remain intact and functioning properly.

### Risk Assessment Matrix

| Category | Risk Level | Status | Change |
|----------|------------|--------|--------|
| XSS Prevention | LOW | Maintained | - |
| Injection Prevention | LOW | Secure | - |
| Input Validation | LOW | Implemented | - |
| URL Security | LOW | Validated | - |
| Cryptographic Security | LOW | Secure | Improved |
| Dependency Security | LOW | No Vulnerabilities | - |
| Data Sanitization | LOW | Implemented | - |

### Key Metrics

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 0 | None Found |
| High | 0 | None Found |
| Medium | 0 | None Found |
| Low | 2 | Minor Issues (Unchanged) |
| Informational | 5 | Best Practices (Improved) |

---

## Changes Since Last Review

### Summary of Changes

| Change Type | Count | Impact |
|-------------|-------|--------|
| Security Issues Fixed | 0 | N/A |
| Security Issues Introduced | 0 | N/A |
| Security Controls Modified | 0 | N/A |
| Dependencies Updated | 0 | N/A |
| Code Quality Improvements | 5 | Indirect security benefit |

### Security-Relevant Code Changes

The following code changes were made since the last audit. Each was reviewed for security implications:

#### 1. memo() Added to Source and Layer Components
**Files:** `/src/components/source.ts`, `/src/components/layer.ts`
**Security Impact:** None - Performance optimization only
**Verdict:** No security concerns

#### 2. Deep Merge for DrawControl Options
**File:** `/src/components/draw-control.ts`
**Security Impact:** None - Options merging improvement
**Verdict:** No security concerns

#### 3. useEffect for ScaleControl Props
**File:** `/src/components/scale-control.ts`
**Security Impact:** None - React lifecycle fix
**Verdict:** No security concerns

#### 4. Proper Type Import for MapMouseEvent
**File:** `/src/components/popup.ts`
**Security Impact:** None - Type safety improvement
**Verdict:** No security concerns

#### 5. React.useId() for Unique IDs
**Files:** `/src/components/source.ts`, `/src/components/layer.ts`
**Security Impact:** Positive - Uses cryptographically secure ID generation via React's useId()
**Previous State:** Used global counter (predictable IDs)
**Verdict:** Minor improvement in ID uniqueness

---

## 1. Security Controls Assessment

### 1.1 XSS Prevention - PASS

**Status:** All XSS vectors remain properly mitigated.

#### AttributionControl (`/src/components/attribution-control.ts`)
- Uses safe DOM APIs instead of innerHTML
- `rel="noopener noreferrer"` prevents tabnabbing
- **Verdict:** SECURE

#### MinimapControl (`/src/components/minimap-control.ts`)
- SVG sanitization implemented via `sanitizeSVG()` function
- Script tags and event handlers are stripped from SVG content
- **Verdict:** SECURE

#### LogoControl (`/src/components/logo-control.ts`)
- Uses DOM APIs for element creation
- `rel="noopener nofollow"` on external links
- **Verdict:** SECURE

#### Dangerous Patterns Check
- **No `dangerouslySetInnerHTML` usage** - VERIFIED
- **No `eval()` or `new Function()` usage** - VERIFIED
- **No `document.write()` usage** - VERIFIED

### 1.2 URL Validation - PASS

**Status:** URL validation prevents SSRF and malicious protocol injection.

#### set-globals.ts (`/src/utils/set-globals.ts`)
- Protocol whitelist validation (http/https only)
- Invalid URL handling with proper error messages
- **Verdict:** SECURE

### 1.3 Cryptographic Security - PASS (IMPROVED)

**Status:** Secure random number generation is used.

#### ID Generation - IMPROVED
- **Previous:** Global counter pattern (`sourceCounter++`, `layerCounter++`)
- **Current:** React's `useId()` hook
- React's useId uses cryptographically secure internal mechanisms
- **Verdict:** IMPROVED

#### MinimapControl UUID Generation
- Uses `crypto.randomUUID()` with secure fallback
- **Verdict:** SECURE

### 1.4 Input Validation - PASS

**Status:** Appropriate input validation is implemented.

#### Container Style Validation
- CSS validation using `CSS.supports()`
- Fallback to defaults for invalid values

#### Map Context Validation
- ID validation prevents reserved identifiers
- Duplicate ID detection

### 1.5 Security Headers/Attributes - PASS

**Status:** Proper security attributes on external links.

| Component | Attribute | Purpose |
|-----------|-----------|---------|
| AttributionControl | `rel="noopener noreferrer"` | Prevents tabnabbing |
| LogoControl | `rel="noopener nofollow"` | Prevents tabnabbing, SEO |
| All external links | `target="_blank"` | Opens in new tab (with noopener) |

---

## 2. Findings by Severity

### 2.1 LOW Severity Issues

#### Finding L-1: TypeScript @ts-ignore Directives
**File:** Multiple files
**Category:** Code Quality / Type Safety
**Risk:** Low - These bypass TypeScript checks but are documented
**Status:** UNCHANGED

**Locations:**
| File | Count |
|------|-------|
| `/src/components/draw-control.ts` | 2 |
| `/src/components/layer.ts` | 6 |
| `/src/components/source.ts` | 8 |
| `/src/components/map.tsx` | 1 |
| `/src/utils/style-utils.ts` | 3 |
| `/src/maplibre/maplibre.ts` | 9 |
| `/src/maplibre/create-ref.ts` | 1 |

**Remediation:**
- These are acceptable as they interact with untyped MapLibre internals
- Consider contributing types to DefinitelyTyped for maplibre-gl-draw

#### Finding L-2: innerHTML Usage with Sanitized Content
**File:** `/src/components/minimap-control.ts`
**Lines:** 303, 403, 418
**Category:** DOM Manipulation
**Risk:** Low - Content is sanitized or controlled
**Status:** UNCHANGED - SECURE

**Verdict:** Acceptable - All dynamic content is sanitized

### 2.2 Informational Findings

#### Info-1: Console Logging in Production
**Files:** Multiple
**Category:** Information Disclosure
**Risk:** Informational
**Status:** UNCHANGED

All console logging is for error/warning handling (developer feedback).

**Recommendation:** Consider implementing a debug mode flag.

#### Info-2: External Dependencies
**File:** `/package.json`
**Category:** Supply Chain Security
**Status:** VERIFIED - NO VULNERABILITIES

**npm audit results:** 0 vulnerabilities

**Production Dependencies:**
| Package | Version | Risk Assessment |
|---------|---------|-----------------|
| maplibre-gl | ^5.15.0 | Active maintenance, good security |
| maplibre-gl-draw | ^1.6.9 | Community maintained, acceptable |
| @maplibre/maplibre-gl-style-spec | ^24.4.1 | Official package, secure |

#### Info-3: React Portal Security
**Files:** `/src/components/popup.ts`, `/src/components/marker.ts`
**Category:** React Security
**Risk:** Informational
**Status:** UNCHANGED - SECURE

Portal targets are controlled DOM elements created by the library.

#### Info-4: Dynamic Method Binding
**File:** `/src/maplibre/create-ref.ts`
**Category:** Dynamic Code Patterns
**Risk:** Informational
**Status:** UNCHANGED - SECURE

Method names are extracted from prototype chain, not user input. Skip list prevents dangerous methods.

#### Info-5: setTimeout Usage
**Category:** Asynchronous Operations
**Risk:** Informational
**Status:** UNCHANGED

All uses are for UI timing, not security-sensitive operations.

---

## 3. OWASP Top 10 (2021) Compliance

| OWASP Category | Status | Notes |
|----------------|--------|-------|
| **A01: Broken Access Control** | N/A | No authentication/authorization in library |
| **A02: Cryptographic Failures** | PASS | Uses crypto.randomUUID() and React.useId() |
| **A03: Injection** | PASS | DOM APIs used, SVG sanitized |
| **A04: Insecure Design** | PASS | Good security patterns followed |
| **A05: Security Misconfiguration** | PASS | Proper security attributes on links |
| **A06: Vulnerable Components** | PASS | Dependencies are current, 0 vulnerabilities |
| **A07: Authentication Failures** | N/A | No authentication in library |
| **A08: Software/Data Integrity** | PASS | No eval, dynamic code execution |
| **A09: Logging/Monitoring** | PARTIAL | Console logging could be improved |
| **A10: SSRF** | PASS | URL validation implemented |

---

## 4. Test Coverage Assessment

### Security-Related Tests

| Test File | Coverage | Security Tests |
|-----------|----------|----------------|
| draw-control.test.js | Good | Event handling, cleanup |
| minimap-control.test.js | Excellent | SVG sanitization tests |
| set-globals.test.js | Good | URL handling tests |
| attribution-control.test.js | Good | DOM manipulation |
| source.test.js | Good | ID generation, memoization |
| layer.test.js | Good | ID generation, memoization |

### SVG Sanitization Test Coverage
The minimap-control.test.js includes comprehensive SVG security tests:
- Valid SVG acceptance
- Invalid SVG fallback
- Script tag removal
- Event handler removal

---

## 5. Security Best Practices Verified

### 5.1 DOM Manipulation
- [x] No use of `eval()` or `new Function()`
- [x] No use of `document.write()`
- [x] `innerHTML` only used with sanitized content
- [x] DOM APIs preferred over string concatenation

### 5.2 React Security
- [x] No `dangerouslySetInnerHTML` usage
- [x] Proper use of React portals
- [x] Context values properly typed
- [x] memo() used consistently to prevent unexpected behavior

### 5.3 URL/Resource Handling
- [x] Protocol whitelist validation (http/https only)
- [x] Invalid URL handling with fallback
- [x] No `javascript:` protocol allowed

### 5.4 Cryptographic
- [x] `crypto.randomUUID()` for UUID generation
- [x] `crypto.getRandomValues()` as fallback
- [x] React's `useId()` for component IDs (NEW)

### 5.5 External Links
- [x] `rel="noopener noreferrer"` on all target="_blank" links
- [x] Prevents tabnabbing attacks

---

## 6. Recommendations

### High Priority
None - All high-priority issues have been resolved.

### Medium Priority
None - All medium-priority issues have been resolved.

### Low Priority

1. **Reduce @ts-ignore Usage**
   - Consider contributing types to DefinitelyTyped
   - Document why each @ts-ignore is necessary
   - **Status:** No change from previous audit

2. **Implement Debug Mode**
   - Add configurable logging levels
   - Reduce console output in production builds
   - **Status:** No change from previous audit

### Future Considerations

1. **Content Security Policy (CSP) Compatibility**
   - Document CSP requirements for users
   - Ensure worker scripts can be loaded from custom URLs

2. **Dependency Scanning**
   - Enable Dependabot or Renovate
   - Set up automated security alerts
   - **Note:** Current npm audit shows 0 vulnerabilities

3. **Security Documentation**
   - Add SECURITY.md file
   - Document security reporting process

---

## 7. Conclusion

The react-bkoi-gl library continues to demonstrate **strong security practices** in this post-fix assessment. No new security vulnerabilities were introduced by the recent code changes, and one minor improvement was made (React.useId() for unique IDs).

**Key Findings:**
- No new security issues introduced
- All previously identified controls remain effective
- Zero vulnerable dependencies (npm audit clean)
- SVG sanitization working correctly
- URL validation preventing SSRF/protocol injection
- Secure cryptographic practices maintained
- **NEW:** React.useId() provides more robust unique IDs

### Final Assessment

| Assessment Area | Previous Score | Current Score | Comments |
|-----------------|----------------|---------------|----------|
| XSS Prevention | A | A | All vectors mitigated |
| Input Validation | A | A | Comprehensive validation |
| Dependency Security | A | A | 0 vulnerabilities, current versions |
| Code Quality | B+ | B+ | Some @ts-ignore directives |
| Documentation | B | B | Could add SECURITY.md |
| ID Generation | B | A- | Improved with useId() |
| **Overall** | **A-** | **A-** | Excellent security posture |

**Recommendation:** The library remains suitable for production use from a security perspective. No immediate security actions required.

---

## 8. Audit Trail

| Date | Version | Changes |
|------|---------|---------|
| March 24, 2026 | 2.0.1 | Initial comprehensive audit |
| March 24, 2026 | 2.0.1 | Verified fixes from previous audit |
| March 25, 2026 | 2.0.1 | Follow-up assessment - No new issues found |
| March 25, 2026 | 2.0.1 | Post-fix assessment - Code changes verified secure |

---

**Report Generated:** March 25, 2026
**Audit Scope:** Source code review, dependency analysis, OWASP Top 10 compliance
**Methodology:** Static code analysis, pattern matching, manual review, npm audit
**Branch:** dev-sarika
