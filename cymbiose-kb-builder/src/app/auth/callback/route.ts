import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: any) {
                        cookieStore.set({ name, value, ...options })
                    },
                    remove(name: string, options: any) {
                        cookieStore.set({ name, value: '', ...options })
                    },
                },
            }
        )

        const { error, data } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data?.user) {
            // Sync user to publicSchema User table
            try {
                const user = data.user;
                // Cast to any to avoid IDE caching issues with generated client
                await (prisma as any).user.upsert({
                    where: { email: user.email! },
                    update: {
                        lastLogin: new Date(),
                        supabaseUserId: user.id
                    },
                    create: {
                        email: user.email!,
                        name: user.user_metadata?.full_name || user.email?.split('@')[0],
                        supabaseUserId: user.id,
                        role: 'USER'
                    }
                });
            } catch (syncError) {
                console.error("Failed to sync user:", syncError);
                // Non-blocking error, allow login to proceed
            }

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
