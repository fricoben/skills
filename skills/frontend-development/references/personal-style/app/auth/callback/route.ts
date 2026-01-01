import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import {
  addMemberRoles,
  getDiscordIdFromIdentities,
  getDiscordRolesForLicenseTypes
} from '@/lib/discord'

function getSafeRedirect(redirect: string | null): string {
  const fallback = '/license'
  if (!redirect) return fallback

  // Must start with single slash (relative path) and not be protocol-relative
  if (!redirect.startsWith('/') || redirect.startsWith('//')) {
    return fallback
  }

  // Block any URL-encoded slashes that could bypass the check
  if (redirect.includes('%2f') || redirect.includes('%2F')) {
    return fallback
  }

  return redirect
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = getSafeRedirect(searchParams.get('redirect'))

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          }
        }
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Ensure a profile exists for every authenticated user.
      // This makes it possible to detect "registered users" by email later (e.g., follow-up emails).
      try {
        const admin = getSupabaseAdmin()
        await admin.from('profiles').upsert(
          {
            id: data.user.id,
            email: data.user.email,
            full_name:
              data.user.user_metadata?.full_name ||
              data.user.user_metadata?.name,
            avatar_url: data.user.user_metadata?.avatar_url
          },
          { onConflict: 'id' }
        )
      } catch (e) {
        // Don't block login on profile creation issues.
        console.error('Profile upsert error:', e)
      }

      // Check if user has Discord connected and has active licenses
      const discordId = getDiscordIdFromIdentities(data.user.identities)

      if (discordId) {
        // User has Discord connected - check for active licenses and add roles
        const admin = getSupabaseAdmin()
        const { data: licenses } = await admin
          .from('licenses')
          .select('license_type')
          .eq('user_id', data.user.id)
          .eq('is_active', true)

        if (licenses && licenses.length > 0) {
          const licenseTypes = licenses.map((l) => l.license_type)
          const roleIds = getDiscordRolesForLicenseTypes(licenseTypes)

          if (roleIds.length > 0) {
            const result = await addMemberRoles(discordId, roleIds)
            if (!result.success) {
              console.error('Failed to add Discord roles:', result.errors)
            }
          }
        }
      }

      return NextResponse.redirect(`${origin}${redirect}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/license?error=auth_failed`)
}
