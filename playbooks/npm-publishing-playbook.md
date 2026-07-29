# NPM Publishing Playbook

**Status:** Authoritative
**Context:** Publishing packages to NPM with a privacy-preserving GitHub no-reply email

## 1. Core Principle: No Personal Email

Every published NPM package exposes the author's email in the public registry. Use a GitHub no-reply email to keep your real address private while remaining a verifiable contributor.

## 2. Prerequisites

- [ ] GitHub account exists
- [ ] Password manager ready (1Password, Bitwarden, etc.)
- [ ] Terminal open

---

## Step 1: Get Your GitHub No-Reply Email

### 1.1 Navigate to GitHub Email Settings
```bash
open https://github.com/settings/emails
```

### 1.2 Enable Privacy Settings
- [ ] Check **"Keep my email addresses private"**
- [ ] Check **"Block command line pushes that expose my email"**

### 1.3 Copy Your No-Reply Email
```
<numeric-id>+<github-username>@users.noreply.github.com
```
**Copy this exact address** — you'll need it multiple times.

---

## Step 2: Configure Git Globally

### 2.1 Set Your Git Email
```bash
git config --global user.email "123456789+yourusername@users.noreply.github.com"
git config --global user.name "Your Name"
```

### 2.2 Verify
```bash
git config --global --list | grep user
```

---

## Step 3: Create NPM Account

### 3.1 Start Account Creation
```bash
npm adduser
```

### 3.2 Follow Prompts

| Prompt | Guidance |
|--------|----------|
| **Username** | Lowercase, hyphens allowed. Check availability: `https://www.npmjs.com/~yourusername` |
| **Password** | Use password manager. NPM requires 10+ characters. |
| **Email** | Paste your GitHub no-reply email. ⚠️ This IS public. |

### 3.3 Email Verification Problem

Your no-reply email is a black hole — you won't receive the OTP.

**Solution: Temporary real email, then switch.**
```bash
# Use real email during signup (web or CLI)
npm login
npm profile set email "123456789+pjsvis@users.noreply.github.com"
```

Or sign up at `https://www.npmjs.com/signup` with a real email, verify, then switch via CLI.

---

## Step 4: Post-Creation Hardening

### 4.1 Enable 2FA
```bash
npm profile enable-2fa auth-and-writes
```
Scan QR code, enter 6-digit code, **save recovery codes** in password manager.

### 4.2 Verify Profile
```bash
npm profile get
```
Confirm `email_verified: true` and `tfa` is active.

---

## Step 5: Reserve a Package Name

### 5.1 Create Minimal Package
```bash
mkdir -p /tmp/<pkg>-reserve && cd /tmp/<pkg>-reserve
cat > package.json << 'EOF'
{
  "name": "<pkg>",
  "version": "0.0.0-reserved",
  "description": "<description> (Coming Soon)",
  "author": "Your Name <123456789+yourusername@users.noreply.github.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/<pkg>"
  },
  "keywords": ["coming-soon"]
}
EOF
```

### 5.2 Publish Placeholder
```bash
npm publish --access public
# Enter OTP if 2FA enabled
```

### 5.3 Verify
```bash
npm view <pkg>
open https://www.npmjs.com/package/<pkg>
```

---

## Step 6: Security Checklist

Store in password manager:
- [ ] NPM username
- [ ] NPM password
- [ ] 2FA recovery codes
- [ ] GitHub no-reply email address

```bash
npm config set access public   # default to public for open source
npm config list                # verify
```

---

## Quick Reference

```bash
# Setup
npm adduser                                  # Create account
npm login                                    # Sign in
npm profile set email "your@noreply.email"   # Change email
npm profile enable-2fa auth-and-writes       # Enable 2FA

# Publishing
npm publish --access public                  # Publish package
npm version <major|minor|patch>              # Bump version
npm view <package>                           # Check registry

# Verification
npm whoami                                   # Current user
npm profile get                              # Account details
```

## Common Issues

| Issue | Solution |
|-------|----------|
| "You must verify your email to publish" | Log into npmjs.com, resend verification to a real email, then switch to no-reply |
| "Package name already taken" | Try `@yourusername/<pkg>` (scoped) or `<pkg>-mcp` |
| "403 Forbidden" | `npm logout && npm login` |
| "Invalid email format" | Copy exact format from GitHub settings, include numeric prefix |

---

## Package Lifecycle

```
0.0.0-reserved  →  [development]  →  1.0.0  →  1.0.1  →  ...
  (today)           (weeks 1-2)      (launch)  (patches)
```
