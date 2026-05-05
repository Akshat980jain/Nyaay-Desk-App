package com.nyaaydesk.app.data.repository

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.nyaaydesk.app.data.local.dao.UserDao
import com.nyaaydesk.app.data.local.entity.UserEntity
import com.nyaaydesk.app.data.remote.dto.DashboardSummaryDto
import com.nyaaydesk.app.data.remote.dto.UserProfileDto
import dagger.hilt.android.qualifiers.ApplicationContext
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.rpc
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore by preferencesDataStore("nyaaydesk_prefs")

@Singleton
class AuthRepository @Inject constructor(
    private val supabase: SupabaseClient,
    private val userDao: UserDao,
    @ApplicationContext private val context: Context
) {
    companion object {
        val USER_TYPE_KEY = stringPreferencesKey("user_type")
        val USER_ID_KEY = stringPreferencesKey("user_id")
    }

    val currentUser: Flow<UserEntity?> = userDao.observeCurrentUser()

    suspend fun login(email: String, password: String): Result<String> = runCatching {
        supabase.auth.signInWith(Email) {
            this.email = email
            this.password = password
        }
        val session = supabase.auth.currentSessionOrNull()
            ?: throw IllegalStateException("No session after login")
        val userId = session.user?.id ?: throw IllegalStateException("No user ID")
        val metadata = session.user?.userMetadata
        val userType = metadata?.get("user_type")?.toString()?.trim('"')
            ?: throw IllegalStateException("No user_type in metadata")

        // Fetch and cache full user profile from users table
        val profileDto = supabase.postgrest["users"]
            .select { filter { eq("id", userId) } }
            .decodeSingle<UserProfileDto>()

        userDao.insertUser(profileDto.toEntity())

        // Persist role to DataStore for fast session restore
        context.dataStore.edit {
            it[USER_TYPE_KEY] = userType
            it[USER_ID_KEY] = userId
        }

        userType
    }

    suspend fun logout() {
        supabase.auth.signOut()
        userDao.clearAll()
        context.dataStore.edit { it.clear() }
    }

    suspend fun resetPassword(email: String) {
        supabase.auth.resetPasswordForEmail(email)
    }

    suspend fun getCurrentUserType(): String? {
        return context.dataStore.data.first()[USER_TYPE_KEY]
    }

    suspend fun getDashboardSummary(userId: String): Result<DashboardSummaryDto> = runCatching {
        supabase.postgrest.rpc(
            "get_mobile_dashboard_summary",
            mapOf("p_user_id" to userId)
        ).decodeSingle()
    }
}

fun UserProfileDto.toEntity() = UserEntity(
    id = id,
    email = email,
    userType = userType,
    fullName = fullName,
    phone = phone,
    barCouncilId = barCouncilId,
    courtId = courtId,
    isVerified = isVerified,
    avatarUrl = avatarUrl
)
