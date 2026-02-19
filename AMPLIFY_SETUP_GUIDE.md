# AWS Amplify GitHub Access Token Setup

## Create GitHub Personal Access Token

AWS Amplify needs access to your GitHub repository to automatically build and deploy your frontend.

### Steps:

1. **Go to GitHub Settings**:
   - Navigate to https://github.com/settings/tokens
   - Or: Click your profile photo → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **Generate New Token (Classic)**:
   - Click "Generate new token" → "Generate new token (classic)"
   - Note: Use token (classic), not fine-grained token

3. **Configure Token**:
   - **Note**: `Amplify Access for serverless-task-management`
   - **Expiration**: Set to your preference (90 days recommended for lab work)
   - **Scopes** - Select these permissions:
     - ✅ `repo` (Full control of private repositories)
       - This includes: repo:status, repo_deployment, public_repo, repo:invite, security_events
     - ✅ `admin:repo_hook` (Full control of repository hooks)
       - This includes: write:repo_hook, read:repo_hook

4. **Generate and Copy Token**:
   - Click "Generate token" at the bottom
   - **IMPORTANT**: Copy the token immediately - you won't see it again!
   - It will look like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Add Token to Terraform

### Option 1: Environment Variable (Recommended for Security)

```bash
export TF_VAR_github_access_token="ghp_your_token_here"
```

Then run:
```bash
terraform apply -var-file=dev.tfvars
```

### Option 2: Add to dev.tfvars (Less Secure - Don't Commit!)

Add this line to `dev.tfvars`:
```terraform
github_access_token = "ghp_your_token_here"
```

**⚠️ IMPORTANT**: If you use Option 2:
- Never commit `dev.tfvars` with the token to Git
- Add to `.gitignore` if not already there
- Remove the token from the file after deployment

## After Token is Set

Run terraform apply:
```bash
cd infrastructure/terraform
terraform apply -var-file=dev.tfvars
```

## Verify Deployment

After successful terraform apply:
1. Go to AWS Console → Amplify
2. Find your app: `task-mgmt-dev-frontend`
3. The main branch should start building automatically
4. Click on the branch to see build progress
5. Once complete, you'll get an Amplify URL like:
   `https://main.xxxxxx.amplifyapp.com`

## Troubleshooting

### "Invalid token" error
- Make sure you selected the correct scopes (`repo` and `admin:repo_hook`)
- Token might have expired - generate a new one

### "Repository not found"
- Check the repository URL in `dev.tfvars` is correct
- Format: `https://github.com/KofiAckah/serverless-task-management`

### Build fails
- Check the build logs in Amplify Console
- Verify `amplify.yml` is in the root of your repository
- Ensure frontend dependencies can be installed

## Security Best Practices

1. **Use Environment Variables**: Export the token as an environment variable
2. **Never Commit Tokens**: Add `*.tfvars` to `.gitignore`
3. **Rotate Tokens**: Regenerate tokens periodically
4. **Delete After Use**: If this is a one-time lab, delete the token after deployment
5. **Use Secrets Manager**: For production, consider AWS Secrets Manager

## Next Steps

After Amplify deployment successful:
1. Access your app at the Amplify URL
2. Test all functionality
3. Set up custom domain (optional)
4. Configure branch-based deployments (optional)
