package com.nyaaydesk.app.di

import com.nyaaydesk.app.BuildConfig
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.realtime.Realtime
import io.github.jan.supabase.storage.Storage
import javax.inject.Singleton

/**
 * Hilt Module: Provides the single SupabaseClient instance to the entire app.
 *
 * The client is configured directly with the existing Supabase project URL and Anon key
 * from the NyaayDesk web frontend (injected via BuildConfig at compile time).
 * This is the SAME database the React web app uses — no duplication.
 *
 * Plugins installed:
 *  - Auth       : User login, session management, token refresh
 *  - Postgrest  : Full database CRUD (replaces REST fetch calls)
 *  - Realtime   : WebSocket subscriptions (live case updates)
 *  - Storage    : Upload/download legal documents (PDFs)
 */
@Module
@InstallIn(SingletonComponent::class)
object SupabaseModule {

    @Provides
    @Singleton
    fun provideSupabaseClient(): SupabaseClient {
        return createSupabaseClient(
            supabaseUrl = BuildConfig.SUPABASE_URL,
            supabaseKey = BuildConfig.SUPABASE_ANON_KEY
        ) {
            install(Auth)
            install(Postgrest)
            install(Realtime)
            install(Storage)
        }
    }
}
