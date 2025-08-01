# Supabase Setup for Kiddoscore

This guide will help you migrate from localStorage to Supabase database for persistent, cloud-based storage.

## Prerequisites

1. Create a [Supabase](https://supabase.com) account
2. Create a new Supabase project

## Database Setup

1. **Create the database schema:**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy and paste the contents of `supabase_schema.sql`
   - Run the SQL to create all tables and indexes

2. **Configure Row Level Security (Optional):**
   - The schema includes basic RLS policies that allow all operations
   - You can customize these based on your authentication needs

## Environment Configuration

1. **Copy environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Get your Supabase credentials:**
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy your project URL and anon key

3. **Update `.env.local`:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

## Migration Process

The app automatically detects if Supabase is configured:

- **With Supabase configured:** All data will be stored in Supabase database
- **Without Supabase:** Falls back to localStorage (existing behavior)

## Data Migration

If you have existing data in localStorage and want to migrate to Supabase:

1. Set up Supabase as described above
2. The app will automatically use Supabase for new data
3. Existing localStorage data will remain until you manually migrate it

To migrate existing data, you can:
1. Export your localStorage data
2. Use the Supabase dashboard to import it
3. Or clear localStorage to start fresh with the seed data

## Database Schema

- **kids**: Store kid profiles with points
- **tasks**: Store available tasks with points and assignments  
- **rewards**: Store rewards with costs
- **redemptions**: Track reward redemptions
- **completions**: Track daily task completions (replaces complex completions object)

## Benefits of Supabase

- ✅ **Persistent storage** across devices and sessions
- ✅ **Real-time updates** (can be enabled)
- ✅ **Backup and recovery**
- ✅ **Scalable** for multiple families
- ✅ **SQL queries** for advanced reporting
- ✅ **Authentication** ready (if needed later)

## Development vs Production

- **Development:** Can use localStorage for quick testing
- **Production:** Should use Supabase for persistence and reliability

The app gracefully handles both scenarios based on environment configuration.