package com.nyaaydesk.app.presentation.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nyaaydesk.app.data.remote.dto.DashboardSummaryDto
import com.nyaaydesk.app.data.remote.dto.UserProfileDto
import com.nyaaydesk.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AdminUiState(
    val summary: DashboardSummaryDto? = null,
    val pendingAdvocates: List<UserProfileDto> = emptyList(),
    val isLoading: Boolean = true,
    val errorMessage: String? = null,
    val approvalSuccess: Boolean = false
)

@HiltViewModel
class AdminViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val supabase: SupabaseClient
) : ViewModel() {

    private val _uiState = MutableStateFlow(AdminUiState())
    val uiState: StateFlow<AdminUiState> = _uiState.asStateFlow()

    init { loadAdminData() }

    private fun loadAdminData() {
        viewModelScope.launch {
            val userId = supabase.auth.currentSessionOrNull()?.user?.id ?: return@launch

            // Fetch system metrics
            authRepository.getDashboardSummary(userId)
                .onSuccess { summary -> _uiState.update { it.copy(summary = summary) } }

            // Fetch unverified advocates pending approval
            runCatching {
                supabase.postgrest["users"]
                    .select { filter { and { eq("user_type", "advocate"); eq("is_verified", false) } } }
                    .decodeList<UserProfileDto>()
            }.onSuccess { advocates ->
                _uiState.update { it.copy(pendingAdvocates = advocates, isLoading = false) }
            }.onFailure {
                _uiState.update { it.copy(isLoading = false, errorMessage = it.toString()) }
            }
        }
    }

    fun approveAdvocate(advocateId: String) {
        viewModelScope.launch {
            runCatching {
                supabase.postgrest["users"]
                    .update(mapOf("is_verified" to true)) { filter { eq("id", advocateId) } }
            }.onSuccess {
                _uiState.update { state ->
                    state.copy(
                        pendingAdvocates = state.pendingAdvocates.filter { it.id != advocateId },
                        approvalSuccess = true
                    )
                }
            }.onFailure { e ->
                _uiState.update { it.copy(errorMessage = e.message) }
            }
        }
    }

    fun rejectAdvocate(advocateId: String) {
        viewModelScope.launch {
            runCatching {
                supabase.postgrest["users"]
                    .update(mapOf("is_verified" to false, "is_rejected" to true)) {
                        filter { eq("id", advocateId) }
                    }
            }.onSuccess {
                _uiState.update { state ->
                    state.copy(pendingAdvocates = state.pendingAdvocates.filter { it.id != advocateId })
                }
            }
        }
    }

    fun refresh() = loadAdminData()
}
