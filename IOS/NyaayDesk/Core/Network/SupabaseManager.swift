import Foundation
import Supabase

/**
 * SupabaseManager — the single shared Supabase client for the iOS app.
 *
 * Connects to the EXACT same Supabase project as the NyaayDesk React web app.
 * URL: https://pnneversthhxilensrzq.supabase.co
 *
 * All plugins (Auth, PostgREST, Realtime, Storage) are pre-initialized here.
 * Access via: SupabaseManager.shared.client
 */
final class SupabaseManager {
    static let shared = SupabaseManager()

    let client: SupabaseClient

    private init() {
        // These credentials mirror the web app's .env file exactly
        let supabaseURL = URL(string: "https://pnneversthhxilensrzq.supabase.co")!
        let supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubmV2ZXJzdGhoeGlsZW5zcnpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MDc2NzUsImV4cCI6MjA5MzE4MzY3NX0.XENFITdSfqoMyjEETvGDVaEXlajRoHzINue8X6vfWoU"

        client = SupabaseClient(supabaseURL: supabaseURL, supabaseKey: supabaseKey)
    }
}
