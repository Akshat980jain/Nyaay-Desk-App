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
    private val supabase: SupabaseClient
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

                val session = supabase.auth.currentSessionOrNull()
                val metadata = session?.user?.userMetadata
                val userType = metadata?.get("user_type")?.toString()?.trim('"')

                if (userType == null) {
                    _uiState.value = AuthUiState(errorMessage = "Could not determine user role. Please contact support.")
                    return@launch
                }

                // Enforce role segregation — a Litigant cannot use the Admin portal
                if (userType.lowercase() != expectedRole.lowercase()) {
                    supabase.auth.signOut()
                    _uiState.value = AuthUiState(
                        errorMessage = "Access denied. This portal is for ${expectedRole}s only."
                    )
                    return@launch
                }

                _uiState.value = AuthUiState(isSuccess = true, userType = userType)

            } catch (e: Exception) {
                _uiState.value = AuthUiState(
                    errorMessage = when {
                        e.message?.contains("Invalid login") == true -> "Incorrect email or password."
                        e.message?.contains("Email not confirmed") == true -> "Please verify your email first."
                        else -> "Login failed. Please try again."
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
