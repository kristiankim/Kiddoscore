# Supabase Authentication Setup for Kiddoscore

This guide will help you implement user authentication in your Kiddoscore app using Supabase.

## Step 1: Update Database Schema

1. **Run the updated schema** in your Supabase SQL Editor:
   - Copy the contents of `supabase_schema.sql`
   - This includes user authentication tables and Row Level Security (RLS) policies
   - The schema now supports multi-family accounts with proper data isolation

## Step 2: Configure Authentication in Supabase Dashboard

1. **Go to Authentication Settings:**
   - Navigate to your Supabase project dashboard
   - Go to **Authentication > Settings**

2. **Enable Email Authentication:**
   - Enable "Enable email confirmations"
   - Set a custom redirect URL (optional): `https://yourdomain.com/auth/callback`

3. **Configure Email Templates (Optional):**
   - Go to **Authentication > Email Templates**
   - Customize the confirmation and reset password emails

4. **Enable Additional Providers (Optional):**
   - **Google OAuth:** For easier sign-in
   - **GitHub OAuth:** For developer accounts

## Step 3: Environment Variables

Ensure your `.env.local` file has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 4: Authentication Features Implemented

### ✅ What's Already Set Up:

1. **Authentication Context (`app/_lib/auth.tsx`):**
   - User session management
   - Sign in/up/out functions
   - Password reset functionality
   - Automatic session persistence

2. **Authentication Components:**
   - `AuthForm.tsx`: Reusable sign-in/sign-up form
   - `ProtectedRoute.tsx`: Route protection for authenticated users
   - Updated `Header.tsx`: Shows auth status and sign-in/out buttons

3. **Authentication Pages:**
   - `/auth/signin`: Sign-in page
   - `/auth/signup`: Sign-up page

4. **Database Security:**
   - Row Level Security (RLS) policies
   - User-based data isolation
   - Automatic user profile creation on signup

## Step 5: How Authentication Works

### User Flow:
1. **Unauthenticated users** are redirected to `/auth/signin`
2. **Sign up** creates a new user account and profile
3. **Sign in** authenticates existing users
4. **Authenticated users** can access the main app
5. **Data is isolated** per user/family

### Data Security:
- Each user can only access their own family's data
- RLS policies ensure data isolation
- User profiles are automatically created on signup

## Step 6: Testing Authentication

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test the authentication flow:**
   - Visit your app
   - You should be redirected to sign-in
   - Create a new account
   - Sign in and verify data isolation

## Step 7: Customization Options

### Email Templates:
- Customize confirmation emails in Supabase dashboard
- Add your branding and messaging

### Social Login:
- Enable Google, GitHub, or other providers
- Users can sign in with social accounts

### Password Policies:
- Configure password requirements in Supabase
- Set minimum length and complexity rules

### User Profiles:
- Customize the `user_profiles` table
- Add additional fields like family name, preferences, etc.

## Step 8: Production Deployment

### Environment Variables:
- Set production Supabase URL and keys
- Configure proper redirect URLs

### Email Configuration:
- Set up custom email domain (optional)
- Configure email templates for production

### Security:
- Review RLS policies for your use case
- Consider additional security measures

## Benefits of This Authentication Setup:

✅ **Multi-family support:** Each family has isolated data  
✅ **Secure by default:** RLS policies protect user data  
✅ **Easy to use:** Simple sign-in/sign-up flow  
✅ **Scalable:** Built on Supabase's robust auth system  
✅ **Customizable:** Easy to extend and modify  
✅ **Production ready:** Includes proper error handling and loading states  

## Troubleshooting

### Common Issues:

1. **"Invalid login credentials"**
   - Check if user exists in Supabase dashboard
   - Verify email confirmation if enabled

2. **"RLS policy violation"**
   - Ensure user is properly authenticated
   - Check that RLS policies are correctly applied

3. **"Session not found"**
   - Clear browser storage and try again
   - Check Supabase client configuration

### Debug Tips:
- Check Supabase dashboard logs
- Use browser dev tools to inspect network requests
- Verify environment variables are correct

## Next Steps

After implementing authentication, you can:

1. **Add user profile management**
2. **Implement family member invitations**
3. **Add role-based permissions**
4. **Set up email notifications**
5. **Add social login providers**

The authentication system is now ready to use! Users can sign up, sign in, and their data will be properly isolated and secured. 