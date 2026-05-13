package com.nyaaydesk.app.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

import com.nyaaydesk.app.data.repository.AuthRepository
import com.nyaaydesk.app.data.remote.dto.UserProfileDto
import io.github.jan.supabase.postgrest.postgrest

data class AuthUiState(
    val isLoading: Boolean = false,
    val isSuccess: Boolean = false,
    val errorMessage: String? = null,
    val userType: String? = null
)

/**
 * AuthViewModel — shared across all 4 login screens.
 *
 * The login function receives a `userType` hint but the actual role is extracted
 * from the JWT's user_metadata after login, ensuring the backend is the source of truth.
 */
@HiltViewModel
class AuthViewModel @Inject constructor(
    private val supabase: SupabaseClient,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState

    fun login(email: String, password: String, expectedRole: String) {
        if (email.isBlank() || password.isBlank()) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please fill in all fields")
            return
        }

        viewModelScope.launch {
            _uiState.value = AuthUiState(isLoading = true)
            try {
                supabase.auth.signInWith(Email) {
                    this.email = email
                    this.password = password
                }

                // 2. Fetch or Determine User Profile
                val session = supabase.auth.currentSessionOrNull()
                val metadata = session?.user?.userMetadata
                val userId = session?.user?.id
                var profile: UserProfileDto? = null

                if (userId != null) {
                    try {
                        profile = supabase.postgrest["users"]
                            .select { filter { eq("id", userId) } }
                            .decodeSingleOrNull<UserProfileDto>()
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }

                // Determine final userType
                val finalUserType = (profile?.userType ?: 
                                     (metadata?.get("user_type") ?: metadata?.get("role"))?.toString()?.trim('"') ?: 
                                     expectedRole).lowercase()

                // 3. Enforce role segregation
                if (finalUserType != expectedRole.lowercase()) {
                    supabase.auth.signOut()
                    _uiState.value = AuthUiState(
                        errorMessage = "Access denied. Your account is registered as ${finalUserType.replaceFirstChar { it.uppercase() }}, but you are trying to access the ${expectedRole} portal."
                    )
                    return@launch
                }

                // 4. Cache Session (This triggers dashboard ViewModels)
                if (profile != null) {
                    authRepository.saveUserSession(profile)
                } else if (userId != null) {
                    // Fallback profile if record is missing in 'users' table
                    val fallbackProfile = UserProfileDto(
                        id = userId,
                        email = email,
                        userType = expectedRole
                    )
                    authRepository.saveUserSession(fallbackProfile)
                }

                _uiState.value = AuthUiState(isSuccess = true, userType = expectedRole)

            } catch (e: Exception) {
                _uiState.value = AuthUiState(
                    errorMessage = when {
                        e.message?.contains("Invalid login") == true -> "Incorrect email or password."
                        e.message?.contains("Email not confirmed") == true -> "Please verify your email first."
                        else -> "Login failed: ${e.message ?: "Please check your internet connection"}"
                    }
                )
            }
        }
    }

    fun resetPassword(email: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState(isLoading = true)
            try {
                supabase.auth.resetPasswordForEmail(email)
                _uiState.value = AuthUiState(errorMessage = "Password reset link sent to your email.")
            } catch (e: Exception) {
                _uiState.value = AuthUiState(errorMessage = "Failed to send reset link: ${e.message}")
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }

    fun signOut() {
        viewModelScope.launch {
            runCatching { supabase.auth.signOut() }
        }
    }
}
