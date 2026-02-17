# Role Detection Fix - Group Name Mismatch

## Issue
Users logging in were always detected as "Member" regardless of their actual Cognito group membership, even if they were in the Admin group.

## Root Cause
**Group name mismatch between Cognito configuration and frontend code:**

| Component | Expected Group Name | Actual Group Name in Cognito |
|-----------|-------------------|------------------------------|
| Frontend (OLD) | "Admins" (plural) | "Admin" (singular) ✓ |
| Backend Lambda (OLD) | "Members" (plural) | "Member" (singular) ✓ |
| Cognito User Pool | - | "Admin" & "Member" (singular) ✓ |

The frontend was checking for `groups.includes('Admins')` which always returned `false` because the actual group name in Cognito is `'Admin'` (singular), causing all users to default to 'Member'.

## Files Fixed

### 1. Frontend - AuthContext.jsx
**Changed:**
```javascript
// OLD - WRONG
const role = groups.includes('Admins') ? 'Admin' : 'Member';

// NEW - CORRECT
const role = groups.includes('Admin') ? 'Admin' : 'Member';
```

**Also added:**
- `forceRefresh: true` to `fetchAuthSession()` to ensure fresh tokens
- Debug logging to show groups and role determination
- Automatic token storage in sessionStorage

### 2. Backend - postConfirmation.js
**Changed:**
```javascript
// OLD - WRONG
GroupName: 'Members'

// NEW - CORRECT
GroupName: 'Member'
```

This ensures newly confirmed users are added to the correct "Member" group (singular).

### 3. Documentation Updates
- `PHASE_4_ENHANCEMENTS.md` - Updated all references to use "Admin" and "Member"
- `frontend/README.md` - Updated group name references

## Cognito Group Configuration (Verified)

```bash
$ aws cognito-idp list-groups --user-pool-id eu-west-1_j6w7VPIZj
```

| Group Name | Precedence | Description |
|------------|------------|-------------|
| Admin | 1 | Admin users with full access |
| Member | 2 | Member users with limited access |

**Current Group Membership:**
- **Admin group**: 3 users
- **Member group**: 4 users

## How to Promote User to Admin

Use the **correct group name** "Admin" (singular):

```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id eu-west-1_j6w7VPIZj \
  --username <user@amalitech.com> \
  --group-name Admin \
  --region eu-west-1
```

**Important**: User must log out and log back in to refresh their JWT token with the new group membership.

## Testing the Fix

### 1. Test Admin Login
```bash
# Verify user is in Admin group
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id eu-west-1_j6w7VPIZj \
  --username admin@amalitech.com \
  --region eu-west-1
```

Expected output:
```json
{
  "Groups": [
    {
      "GroupName": "Admin",
      "Precedence": 1
    }
  ]
}
```

### 2. Login and Check Console
1. Open browser console (F12)
2. Login with admin credentials
3. Look for debug logs:
   ```
   🔍 Auth Check - Groups from token: ['Admin']
   🔍 Auth Check - Determined role: Admin
   ```
4. Verify role badge shows **"Admin"** (not "Member")
5. Verify **"Create Task"** button appears

### 3. Test Member Login
1. Login with member credentials
2. Check console logs:
   ```
   🔍 Auth Check - Groups from token: ['Member']
   🔍 Auth Check - Determined role: Member
   ```
3. Verify role badge shows **"Member"**
4. Verify **no "Create Task"** button appears
5. Only assigned tasks visible

## Deployment Status

✅ **Frontend**: Updated (needs browser refresh or logout/login)  
✅ **Backend**: postConfirmation Lambda updated and deployed  
✅ **Cognito**: Already configured correctly with singular group names  
✅ **Documentation**: Updated with correct group names

## Debug Logging

The fix includes debug logging in the AuthContext to help troubleshoot role detection:

```javascript
console.log('🔍 Auth Check - Groups from token:', groups);
console.log('🔍 Auth Check - Full token payload:', session.tokens?.idToken?.payload);
console.log('🔍 Auth Check - Determined role:', role);
```

**To view logs:**
1. Open Browser DevTools (F12)
2. Go to Console tab
3. Login to the application
4. Look for logs prefixed with "🔍 Auth Check"

## Session Refresh

If a user was recently promoted to Admin but still shows as Member:

**Solution:** Force session refresh by logging out and logging back in.

**Why?** JWT tokens are cached and contain the `cognito:groups` claim at the time of login. Promoting a user to Admin updates their group membership in Cognito, but does not invalidate existing tokens. The user must get a fresh token with the updated groups.

## Verification Commands

```bash
# List all groups
aws cognito-idp list-groups \
  --user-pool-id eu-west-1_j6w7VPIZj \
  --region eu-west-1

# List users in Admin group
aws cognito-idp list-users-in-group \
  --user-pool-id eu-west-1_j6w7VPIZj \
  --group-name Admin \
  --region eu-west-1

# List users in Member group
aws cognito-idp list-users-in-group \
  --user-pool-id eu-west-1_j6w7VPIZj \
  --group-name Member \
  --region eu-west-1

# Check specific user's groups
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id eu-west-1_j6w7VPIZj \
  --username <email> \
  --region eu-west-1
```

## Summary

The issue was a simple but critical typo: the code was looking for plural group names ("Admins", "Members") while Cognito was configured with singular names ("Admin", "Member"). This has been fixed in both frontend and backend code, and documentation has been updated to reflect the correct group names.

**Users should now see their correct roles after logging out and logging back in.**
