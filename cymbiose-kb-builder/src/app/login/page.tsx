'use client'
import { createClient } from '@/utils/supabase/client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useState } from 'react'

export default function Login() {
    const [supabase] = useState(() => createClient())

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-2 bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <div className="mb-6 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h1>
                    <p className="text-gray-500 dark:text-gray-400">Sign in to your account</p>
                </div>

                <Auth
                    supabaseClient={supabase}
                    appearance={{
                        theme: ThemeSupa,
                        variables: {
                            default: {
                                colors: {
                                    brand: '#3b82f6',
                                    brandAccent: '#2563eb',
                                },
                                radii: {
                                    borderRadiusButton: '0.5rem',
                                    inputBorderRadius: '0.5rem',
                                }
                            }
                        }
                    }}
                    theme="dark"
                    providers={['google']}
                    redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
                />
            </div>
        </div>
    )
}
