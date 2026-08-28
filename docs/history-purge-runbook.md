# History Purge Runbook — Customer Payment PDFs (R57)

**Task ID:** B9 (Master Directive §9 — production readiness audit)
**Owner:** Founder (this is a deliberate founder-side security-incident action; agents DO NOT execute this)
**Severity:** CRITICAL — SECURITY INCIDENT
**Status:** Pending founder execution before public production launch

---

## 0. Context — Why this runbook exists

During the Phase 27 security audit (commit `629dc44` "security(severity=critical): untrack customer payment PDFs from public repo"), 6 customer payment PDFs were `git rm --cached` from the working tree so they no longer ship with new clones of `main`. **However**:

1. The 6 PDFs REMAIN in the public git history (commits `fddfcc3` + `a9fe579` + `d8a6ca7`). Anyone can `git clone` the repo and `git checkout fddfcc3` to read them.
2. **CRITICAL FINDING (Batch 9 audit, 2026-09-22):** The Phase 27 untrack step was **incomplete**. Commit `629dc44`'s message claims it untracked 5 proposal PDFs (`INV-2026-0001`, `0007`, `0008`, `0009`, `0010`) + 1 payment-proof PDF + 1 receipt PDF — but the actual `git show --stat 629dc44` shows it only `git rm --cached`'d 6 files (INV-2026-0001, INV-2026-0007, INV-2026-0008, INV-2026-0009, payment-proof-0007, receipt-INV-2026-0001.pdf). The proposal PDF **`data/uploads/proposals/INV-2026-0010.pdf`** was MISSED — it is STILL tracked in HEAD today.

   Verification (run by B9 agent on 2026-09-22):
   ```bash
   $ git ls-files 'data/uploads/' 'e2e-shots/module7/receipt*'
   data/uploads/proposals/INV-2026-0010.pdf        ← STILL TRACKED IN HEAD
   e2e-shots/module7/receipt-page-1.png            ← PNG, not a customer document
   $ git cat-file -t HEAD:data/uploads/proposals/INV-2026-0010.pdf
   blob                                            ← confirms tracked blob in current HEAD
   $ git log --oneline -- data/uploads/proposals/INV-2026-0010.pdf
   fddfcc3 fix(docker): install prod deps at runtime (prisma 6 needs effect/c12/etc)
   $ file data/uploads/proposals/INV-2026-0010.pdf
   PDF document, version 1.3, 3 page(s)            ← real customer proposal PDF
   ```

   The `.gitignore` line `data/uploads/` was added in commit `629dc44` (line 69 of `.gitignore`) — but `.gitignore` only affects UNtracked files. Once a file is tracked, `.gitignore` cannot untrack it; that requires an explicit `git rm --cached <file>`. The Phase 27 fix untracked 6 files but missed `INV-2026-0010.pdf`, and the `.gitignore` rule could not retroactively untrack it.

This is therefore a security incident on TWO fronts:

- **Front A — current HEAD:** `data/uploads/proposals/INV-2026-0010.pdf` is publicly accessible RIGHT NOW via `git clone https://github.com/ifeanyiokomba/okomba-analytics.git` + `cat data/uploads/proposals/INV-2026-0010.pdf`. Anyone with the repo URL has this customer's full proposal PDF (3 pages, customer name + service + price + scope + duration + bank account number for DVA).
- **Front B — git history:** the 6 PDFs (INV-2026-0001/0007/0008/0009/0010 + payment-proof-0007 + receipt-INV-2026-0001) in commits `fddfcc3` + `a9fe579` + `d8a6ca7` are publicly accessible via `git checkout <old-commit>` or `git show <old-commit>:<path>`.

**Treat this as a security incident.** Assume that every customer proposal PDF and the payment-proof PDF was accessed by anyone who cloned the repo pre-purge. The purge below is the remediation step.

---

## 1. Pre-flight — Backup the repo (do this BEFORE step 2)

A history rewrite is destructive — `git filter-repo` will rewrite EVERY commit hash, so if anything goes wrong you want a full mirror backup to restore from.

```bash
# From a fresh directory OUTSIDE the working repo (e.g., ~/okomba-backup-2026-09-22):
cd ~
git clone --mirror https://github.com/ifeanyiokomba/okomba-analytics.git okomba-analytics-mirror-backup-$(date +%Y%m%d)
cd okomba-analytics-mirror-backup-*
git log --oneline | head -5  # confirm the mirror has full history
```

If anything goes wrong during the purge, you can restore by:

```bash
cd /path/to/fresh-clone
git remote remove origin
git remote add origin ~/okomba-analytics-mirror-backup-<date>
git fetch origin
git reset --hard origin/main
git remote remove origin
git remote add origin https://github.com/ifeanyiokomba/okomba-analytics.git
git push --force origin main
```

Keep the mirror backup for at least 6 months in case you need to audit what was rewritten.

---

## 2. Untrack the still-tracked PDF from HEAD (Front A remediation)

**This step MUST happen BEFORE the history purge (step 4) because filter-repo refuses to operate on a working tree with uncommitted changes.**

In your working clone of the repo:

```bash
cd /path/to/okomba-analytics

# Verify the file is still tracked
git ls-files data/uploads/proposals/INV-2026-0010.pdf
# Expected output: data/uploads/proposals/INV-2026-0010.pdf

# Untrack it (file stays on disk locally but is removed from the index)
git rm --cached data/uploads/proposals/INV-2026-0010.pdf

# Verify .gitignore already covers it (line 69: data/uploads/)
grep -n "data/uploads/" .gitignore
# Expected output: 69:data/uploads/

# Commit the untrack
git commit -m "security(severity=critical): untrack INV-2026-0010.pdf (Phase 27 Fix 1 follow-up — was missed in 629dc44)

The Phase 27 audit commit 629dc44 untracked 6 customer PDFs but missed
data/uploads/proposals/INV-2026-0010.pdf. The .gitignore rule added in
that same commit (data/uploads/) cannot retroactively untrack a file
that was already tracked — explicit `git rm --cached` is required.

This commit removes the file from HEAD only. The file REMAINS in git
history (commit fddfcc3 + a9fe579) — the next commit will run
git-filter-repo to purge it from history.

Found by Batch 9 production readiness audit (2026-09-22)."

# Push to GitHub (origin/main) BEFORE the history purge — this puts HEAD in a clean state
git push origin main
```

After this step, `git ls-files data/uploads/` should return empty (the file is no longer in HEAD), but the file is still on disk locally (because `--cached` keeps the working-tree copy).

---

## 3. Install git-filter-repo

`git-filter-repo` is the recommended modern replacement for `git filter-branch` / BFG. It's faster, safer, and was written by the Git project itself.

```bash
# Install via pip (Python 3.6+ required)
pip install git-filter-repo

# Or via Homebrew on macOS
brew install git-filter-repo

# Verify installation
git filter-repo --version
```

(Note: `git filter-repo` is a single Python script. If you don't want to install it system-wide, you can also `pipx install git-filter-repo` or download it directly from https://github.com/newren/git-filter-repo/raw/main/git-filter-repo and put it on your PATH.)

---

## 4. Run the history purge (Front B remediation)

Make a FRESH clone for the purge operation — `git filter-repo` requires a non-shared clone (no other worktrees pointing at the same repo).

```bash
# Fresh clone (NOT the working tree where you develop):
cd /tmp
git clone https://github.com/ifeanyiokomba/okomba-analytics.git okomba-purge
cd okomba-purge

# Sanity-check: confirm the customer PDFs are in history (these should print a blob hash, not "Not a valid object name")
git rev-list --all -- data/uploads/proposals/INV-2026-0001.pdf
git rev-list --all -- data/uploads/proposals/INV-2026-0007.pdf
git rev-list --all -- data/uploads/proposals/INV-2026-0008.pdf
git rev-list --all -- data/uploads/proposals/INV-2026-0009.pdf
git rev-list --all -- data/uploads/proposals/INV-2026-0010.pdf
git rev-list --all -- data/uploads/proofs/
git rev-list --all -- e2e-shots/module7/receipt-INV-2026-0001.pdf

# Run the purge.
# This rewrites EVERY commit, removing ALL files under data/uploads/ AND the specific
# receipt PDF, across ALL branches and ALL tags, in ALL of history.
git filter-repo --path data/uploads/ --path e2e-shots/module7/receipt-INV-2026-0001.pdf --invert-paths

# filter-repo automatically:
#   • removes the origin remote (defensive — forces you to re-add it before pushing)
#   • expires reflog + gc the repo so dangling blobs are unreachable
#   • writes a fresh commit map to .git/filter-repo/
```

The `--invert-paths` flag means "remove these paths from every commit they ever appeared in." Everything ELSE in the repo is preserved with its full history (just with rewritten hashes).

---

## 5. Verify the purge

Before force-pushing, verify the customer PDFs are GONE from history:

```bash
# All of these should return NOTHING (empty output = no commit ever touched the file):
git log --all -- data/uploads/proposals/INV-2026-0001.pdf
git log --all -- data/uploads/proposals/INV-2026-0007.pdf
git log --all -- data/uploads/proposals/INV-2026-0008.pdf
git log --all -- data/uploads/proposals/INV-2026-0009.pdf
git log --all -- data/uploads/proposals/INV-2026-0010.pdf
git log --all -- data/uploads/proofs/
git log --all -- e2e-shots/module7/receipt-INV-2026-0001.pdf

# Also verify NO pdf remains under data/uploads/ in any historical commit:
git log --all --name-only --pretty=format: | grep -E '^data/uploads/.*\.pdf$' | sort -u
# Expected: empty output

# Verify the rest of the repo is intact (latest commit subject + file count):
git log --oneline -5
git ls-files | wc -l
# Expected: roughly the same file count as before (minus the 7 purged PDFs)
```

Optionally, do a fresh clone from your local purged repo into a different directory and confirm the PDFs are inaccessible:

```bash
cd /tmp
git clone /tmp/okomba-purge okomba-verify
cd okomba-verify
git log --all -- data/uploads/        # empty
git log --all -- 'e2e-shots/module7/receipt-INV-2026-0001.pdf'  # empty
# Confirm you can NOT checkout the old commits to read the PDFs:
git checkout fddfcc3 2>&1 | head -3   # "error: pathspec 'fddfcc3' did not match" (hash was rewritten)
```

---

## 6. Force-push the rewritten history

`git filter-repo` removed the `origin` remote as a safety measure. Re-add it before pushing.

```bash
cd /tmp/okomba-purge

# Re-add the origin remote
git remote add origin https://github.com/ifeanyiokomba/okomba-analytics.git

# Force-push ALL refs (main + any tags/branches) — the --force-with-lease is the SAFER
# version of --force: it refuses to push if the remote has commits you haven't fetched
# (which would indicate someone else pushed between your last fetch and now).
# But because we're rewriting history, you actually want --force (no lease) to overwrite
# the remote refs unconditionally. Use --force + verify your local main matches what you
# expect before pushing.
git log --oneline -5   # sanity check — first commit subject should match the pre-purge HEAD
git push --force origin main
git push --force --tags   # only if you have tags; otherwise skip
```

GitHub will accept the force-push. The commit SHAs for EVERY commit in the repo will change. Anyone with a local clone of the OLD history will need to re-clone or reset their local copy.

---

## 7. Post-purge coordination

### 7.1 Anyone with a local clone must re-clone or reset

Send the following message to anyone (collaborators, contractors, CI systems) who has a local clone of the repo:

> "We performed a git history rewrite on `ifeanyiokomba/okomba-analytics` to purge customer payment PDFs that should never have been committed. The commit hashes have all changed. Please discard your local clone and re-clone from origin:
> ```
> rm -rf okomba-analytics
> git clone https://github.com/ifeanyiokomba/okomba-analytics.git
> ```
> If you have local branches with work in them, rebase them onto the new main:
> ```
> git fetch origin
> git rebase --onto origin/main <your-old-base-commit> <your-branch>
> ```"

### 7.2 GitHub-side bookkeeping

- GitHub will automatically update open Pull Requests and Issues to point at the rewritten commits (or close them if the referenced commits no longer exist).
- The GitHub UI's "Insights → Traffic" will lose history (the rewrite starts a fresh view-count).
- The repo's default branch protection rule (if any) stays in place.

### 7.3 Treat as a security incident

Assume that every customer proposal PDF + the payment-proof PDF was accessed by anyone who cloned the public repo before the purge. Specifically:

1. **Identify affected customers.** Cross-reference the purged PDFs against your customer records:
   - `INV-2026-0001.pdf` → customer named in the proposal
   - `INV-2026-0007.pdf`, `INV-2026-0008.pdf`, `INV-2026-0009.pdf`, `INV-2026-0010.pdf` → ditto
   - `payment-proof-0007.pdf` → the customer who uploaded the payment proof (the filename pattern suggests this was uploaded by the INV-0007 customer)
   - `receipt-INV-2026-0001.pdf` → the INV-0001 customer (receipt is generated when their payment was confirmed)

2. **Rotate any credentials/tokens that may have appeared in historical files.**
   - The customer PDFs themselves are payment documents — they contain names, services, prices, DVA bank account numbers. Bank account numbers are NOT secrets per se (DVA accounts are designed to be shared so customers can pay in), but exposure may still be a PII / customer-trust issue.
   - Audit the OLD commits (`fddfcc3`, `a9fe579`, `d8a6ca7`) for any OTHER secrets that may have been committed alongside the PDFs (e.g., .env files, API keys). The Phase 27 audit already verified the current HEAD has no secrets (B7 §E item 14a — `Grep "sk_live_|ghp_|npg_|AKIA|-----BEGIN" src/ prisma/ scripts/ Google-apps-script/ whatsapp-service/src/" returns 0 hits), but historical commits may have had `.env` files that were later untracked. The mirror backup from step 1 lets you `git checkout <old-commit> -- .env` to inspect.
   - If you find ANY historical secret (even one that's no longer in HEAD), rotate it immediately. Treat the mirror backup as containing live secrets — keep it on an encrypted disk and delete it once you've audited it.

3. **Notify affected customers if required by your local data-protection regulations.**
   - If you're subject to NDPR (Nigeria Data Protection Regulation), GDPR, or similar, you may have a legal obligation to notify affected individuals within 72 hours of becoming aware of a breach. Consult your legal counsel.
   - Even if notification isn't legally required, proactively emailing affected customers ("we found that an early version of our repo accidentally included your proposal PDF — we've purged it from history; please let us know if you see any unauthorized use of your information") is good customer-trust practice.

4. **Document the incident** in your internal records (incident date: 2026-09-22; date discovered: Phase 27 audit 2026-08-28; date remediated: <fill in after step 6>; affected records: 6 PDFs; remediation: history purge per this runbook; notification: <sent / not required>).

### 7.4 Re-deploy after the purge

The purge only changes the git history — it doesn't touch the deployed Render service. The currently-deployed Render instance continues running with the pre-purge code. After the force-push:

1. Trigger a fresh Render deploy (auto-deploys are on per `render.yaml` line 33 — `autoDeploy: true`).
2. The deploy will pull the rewritten `main`. Build will succeed (the rewrite doesn't change any source code — only removes the 7 PDFs).
3. The runtime is unaffected. No DB migration needed. No env-var changes needed.

---

## 8. Verification after purge (final sanity check)

After step 6 (force-push), do a final end-to-end verification from a fresh clone:

```bash
cd /tmp
rm -rf okomba-final-verify
git clone https://github.com/ifeanyiokomba/okomba-analytics.git okomba-final-verify
cd okomba-final-verify

# Confirm the PDFs are GONE from HEAD:
ls data/uploads/proposals/INV-2026-0010.pdf 2>&1
# Expected: ls: cannot access 'data/uploads/proposals/INV-2026-0010.pdf': No such file or directory

# Confirm the PDFs are GONE from ALL of history:
git log --all -- data/uploads/
# Expected: empty output

git log --all -- e2e-shots/module7/receipt-INV-2026-0001.pdf
# Expected: empty output

# Confirm the repo otherwise builds clean:
bun install
bunx tsc --noEmit      # exit 0, 0 errors
bun run lint            # exit 0, 0 errors
bun test tests/         # 200 pass + 27 skip / 0 fail (same baseline as B9)
```

If `tsc` or `lint` or `tests` fail after the purge, that means `git filter-repo` accidentally removed a file the build needs — restore from the mirror backup (step 1) and re-investigate.

---

## 9. Done — close out the incident

Once steps 1-8 are complete:

- [ ] Mirror backup retained at `~/okomba-analytics-mirror-backup-<date>` (encrypted / access-controlled).
- [ ] `INV-2026-0010.pdf` untracked from HEAD (step 2) — committed + pushed.
- [ ] History purged (step 4) — force-pushed (step 6).
- [ ] Fresh clone verification passes (step 8) — `tsc` 0 errors, `lint` 0 errors, `tests` 200 pass + 27 skip / 0 fail.
- [ ] Render auto-deploy triggered post-purge.
- [ ] Affected customers notified (if required by law / by your customer-trust policy).
- [ ] Incident documented in your internal incident log.

After closeout, update the B0-A requirements matrix item **R57** (worklog.md:4057) from 🟡 to ✅. The R57 security-incident chapter is now closed.

---

## References

- Phase 27 worklog entry — `worklog.md:3309-3438` (the original 10-audit-fix entry where R57 was identified and the first 6-file untrack happened).
- B0-A requirements matrix — `worklog.md:3997-4113` (R57 row at `worklog.md:4057`).
- B7 security audit §D table — `docs/security-audit-batch7.md` §D row R57 (the founder-action disposition).
- B9 production-readiness audit §F — `docs/production-readiness-audit-batch9.md` (this runbook's parent doc).
- `git-filter-repo` documentation — https://htmlpreview.github.io/?https://github.com/newren/git-filter-repo/blob/HEAD/Documentation/git-filter-repo.html
- GitHub's guidance on removing sensitive data — https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository

---

*This runbook was prepared by the Batch 9 production-readiness audit (2026-09-22). It is a founder-action document — the agent did NOT execute any of these steps. The audit verified the security incident is real and documented the remediation path; the founder is responsible for executing steps 1-9 before declaring production ready.*
