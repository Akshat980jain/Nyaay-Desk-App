package com.nyaaydesk.app.presentation.litigant

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nyaaydesk.app.data.local.entity.CaseEntity
import com.nyaaydesk.app.data.local.entity.UserEntity
import com.nyaaydesk.app.data.remote.dto.DashboardSummaryDto
import com.nyaaydesk.app.data.repository.AuthRepository
import com.nyaaydesk.app.data.repository.CaseRepository
import com.nyaaydesk.app.domain.model.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LitigantUiState(
    val user: UserEntity? = null,
    val activeCases: List<CaseEntity> = emptyList(),
    val availableAdvocates: List<com.nyaaydesk.app.data.remote.dto.UserProfileDto> = emptyList(),
    val nocRequests: List<com.nyaaydesk.app.data.remote.dto.JoinRequestDto> = emptyList(),
    val dashboardSummary: DashboardSummaryDto? = null,
    val isLoading: Boolean = true,
    val errorMessage: String? = null
)

@HiltViewModel
class LitigantViewModel @Inject constructor(
    private val caseRepository: CaseRepository,
    private val authRepository: AuthRepository,
    private val supabase: SupabaseClient
) : ViewModel() {

    private val _uiState = MutableStateFlow(LitigantUiState())
    val uiState: StateFlow<LitigantUiState> = _uiState.asStateFlow()

    init {
        loadDashboard()
        fetchAdvocates()
    }

    private fun fetchAdvocates() {
        viewModelScope.launch {
            runCatching {
                supabase.postgrest["users"]
                    .select { filter { eq("user_type", "advocate"); eq("is_verified", true) } }
                    .decodeList<com.nyaaydesk.app.data.remote.dto.UserProfileDto>()
            }.onSuccess { advocates ->
                _uiState.update { it.copy(availableAdvocates = advocates) }
            }
        }
    }

    fun sendJoinRequest(caseId: String, advocateId: String) {
        viewModelScope.launch {
            runCatching {
                supabase.postgrest["case_join_requests"].insert(
                    mapOf(
                        "case_id" to caseId,
                        "advocate_id" to advocateId,
                        "status" to "pending"
                    )
                )
            }.onSuccess {
                // Success feedback can be handled via a UI event or State
            }
        }
    }

    private fun loadDashboard() {
        viewModelScope.launch {
            val userId = supabase.auth.currentSessionOrNull()?.user?.id ?: return@launch

            // Load user profile
            authRepository.currentUser
                .filterNotNull()
                .collect { user ->
                    _uiState.update { it.copy(user = user) }
                }
        }

        viewModelScope.launch {
            val userId = supabase.auth.currentSessionOrNull()?.user?.id ?: return@launch

            // Load cases
            caseRepository.getCasesForLitigant(userId)
                .collect { resource ->
                    when (resource) {
                        is Resource.Success -> _uiState.update {
                            it.copy(activeCases = resource.data ?: emptyList(), isLoading = false)
                        }
                        is Resource.Loading -> _uiState.update { it.copy(isLoading = true) }
                        is Resource.Error -> _uiState.update {
                            it.copy(isLoading = false, errorMessage = resource.message)
                        }
                    }
                }
        }

        viewModelScope.launch {
            val userId = supabase.auth.currentSessionOrNull()?.user?.id ?: return@launch
            authRepository.getDashboardSummary(userId)
                .onSuccess { summary ->
                    _uiState.update { it.copy(dashboardSummary = summary) }
                }
        }

        viewModelScope.launch {
            val userId = supabase.auth.currentSessionOrNull()?.user?.id ?: return@launch
            runCatching {
                supabase.postgrest["case_join_requests"]
                    .select { filter { eq("litigant_id", userId) } } // Assuming litigant_id exists or linked
                    .decodeList<com.nyaaydesk.app.data.remote.dto.JoinRequestDto>()
            }.onSuccess { requests ->
                _uiState.update { it.copy(nocRequests = requests) }
            }
        }
    }

    fun signOut() {
        viewModelScope.launch {
            runCatching { supabase.auth.signOut() }
        }
    }

    fun refresh() { loadDashboard() }
}
