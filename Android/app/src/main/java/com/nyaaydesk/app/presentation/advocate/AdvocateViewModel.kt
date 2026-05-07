package com.nyaaydesk.app.presentation.advocate

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nyaaydesk.app.data.local.entity.CaseEntity
import com.nyaaydesk.app.data.local.entity.UserEntity
import com.nyaaydesk.app.data.remote.dto.CaseDto
import com.nyaaydesk.app.data.remote.dto.DashboardSummaryDto
import com.nyaaydesk.app.data.repository.AuthRepository
import com.nyaaydesk.app.data.repository.CaseRepository
import com.nyaaydesk.app.domain.model.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

data class AdvocateUiState(
    val user: UserEntity? = null,
    val allCases: List<CaseEntity> = emptyList(),
    val todaysCases: List<CaseEntity> = emptyList(),
    val pendingRequests: List<com.nyaaydesk.app.data.remote.dto.JoinRequestDto> = emptyList(),
    val summary: DashboardSummaryDto? = null,
    val isLoading: Boolean = true,
    val errorMessage: String? = null,
    val filingSuccess: Boolean = false
)

@HiltViewModel
class AdvocateViewModel @Inject constructor(
    private val caseRepository: CaseRepository,
    private val authRepository: AuthRepository,
    private val supabase: SupabaseClient
) : ViewModel() {

    private val _uiState = MutableStateFlow(AdvocateUiState())
    val uiState: StateFlow<AdvocateUiState> = _uiState.asStateFlow()

    init {
        loadDashboard()
        fetchJoinRequests()
    }

    private fun fetchJoinRequests() {
        viewModelScope.launch {
            val userId = supabase.auth.currentSessionOrNull()?.user?.id ?: return@launch
            runCatching {
                // Simplified join: in a production app, we'd use a view or rpc for case_title/litigant_name
                supabase.postgrest["case_join_requests"]
                    .select { filter { eq("advocate_id", userId); eq("status", "pending") } }
                    .decodeList<com.nyaaydesk.app.data.remote.dto.JoinRequestDto>()
            }.onSuccess { requests ->
                _uiState.update { it.copy(pendingRequests = requests) }
            }
        }
    }

    fun acceptJoinRequest(requestId: String) {
        viewModelScope.launch {
            runCatching {
                // Atomic operation usually handled via Edge Function to update case.advocate_id AND request.status
                supabase.postgrest["case_join_requests"]
                    .update(mapOf("status" to "accepted")) { filter { eq("id", requestId) } }
            }.onSuccess {
                _uiState.update { state -> 
                    state.copy(pendingRequests = state.pendingRequests.filter { it.id != requestId })
                }
                refresh()
            }
        }
    }

    fun rejectJoinRequest(requestId: String) {
        viewModelScope.launch {
            runCatching {
                supabase.postgrest["case_join_requests"]
                    .update(mapOf("status" to "rejected")) { filter { eq("id", requestId) } }
            }.onSuccess {
                _uiState.update { state -> 
                    state.copy(pendingRequests = state.pendingRequests.filter { it.id != requestId })
                }
            }
        }
    }

    private fun loadDashboard() {
        val today = LocalDate.now().toString()

        viewModelScope.launch {
            authRepository.currentUser.filterNotNull().collect { user ->
                _uiState.update { it.copy(user = user) }

                // Load all cases for this advocate
                caseRepository.getCasesForAdvocate(user.id).collect { resource ->
                    when (resource) {
                        is Resource.Success -> {
                            val cases = resource.data ?: emptyList()
                            _uiState.update {
                                it.copy(
                                    allCases = cases,
                                    todaysCases = cases.filter { c -> c.nextHearingDate == today },
                                    isLoading = false
                                )
                            }
                        }
                        is Resource.Loading -> _uiState.update { it.copy(isLoading = true) }
                        is Resource.Error -> _uiState.update {
                            it.copy(isLoading = false, errorMessage = resource.message)
                        }
                    }
                }
            }
        }

        viewModelScope.launch {
            val userId = supabase.auth.currentSessionOrNull()?.user?.id ?: return@launch
            authRepository.getDashboardSummary(userId).onSuccess { summary ->
                _uiState.update { it.copy(summary = summary) }
            }
        }
    }

    fun fileNewCase(dto: CaseDto) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            caseRepository.fileNewCase(dto)
                .onSuccess { _uiState.update { it.copy(filingSuccess = true, isLoading = false) } }
                .onFailure { e -> _uiState.update { it.copy(errorMessage = e.message, isLoading = false) } }
        }
    }

    fun resetFilingState() = _uiState.update { it.copy(filingSuccess = false) }
    fun refresh() = loadDashboard()
}
