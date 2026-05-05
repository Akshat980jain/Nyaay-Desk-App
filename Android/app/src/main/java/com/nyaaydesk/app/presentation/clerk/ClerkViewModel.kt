package com.nyaaydesk.app.presentation.clerk

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nyaaydesk.app.data.local.entity.CaseEntity
import com.nyaaydesk.app.data.local.entity.UserEntity
import com.nyaaydesk.app.data.remote.dto.HearingDto
import com.nyaaydesk.app.data.repository.AuthRepository
import com.nyaaydesk.app.data.repository.CaseRepository
import com.nyaaydesk.app.data.repository.HearingRepository
import com.nyaaydesk.app.domain.model.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.util.UUID
import javax.inject.Inject

data class ClerkUiState(
    val user: UserEntity? = null,
    val todaysCauseList: List<CaseEntity> = emptyList(),
    val pendingVerifications: List<CaseEntity> = emptyList(),
    val isLoading: Boolean = true,
    val hearingUpdateSuccess: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class ClerkViewModel @Inject constructor(
    private val caseRepository: CaseRepository,
    private val hearingRepository: HearingRepository,
    private val authRepository: AuthRepository,
    private val supabase: SupabaseClient
) : ViewModel() {

    private val _uiState = MutableStateFlow(ClerkUiState())
    val uiState: StateFlow<ClerkUiState> = _uiState.asStateFlow()

    init { loadCauseList() }

    private fun loadCauseList() {
        val today = LocalDate.now().toString()
        viewModelScope.launch {
            authRepository.currentUser.filterNotNull().collect { user ->
                _uiState.update { it.copy(user = user) }
                val courtId = user.courtId ?: return@collect

                caseRepository.getCasesForAdvocate(courtId).collect { resource ->
                    when (resource) {
                        is Resource.Success -> {
                            val cases = resource.data ?: emptyList()
                            _uiState.update {
                                it.copy(
                                    todaysCauseList = cases.filter { c -> c.nextHearingDate == today },
                                    pendingVerifications = cases.filter { c -> c.status == "pending" },
                                    isLoading = false
                                )
                            }
                        }
                        is Resource.Loading -> _uiState.update { it.copy(isLoading = true) }
                        is Resource.Error -> _uiState.update { it.copy(isLoading = false, errorMessage = resource.message) }
                    }
                }
            }
        }
    }

    fun updateHearing(caseId: String, nextHearingDate: String, orderText: String) {
        viewModelScope.launch {
            val dto = HearingDto(
                id = UUID.randomUUID().toString(),
                caseId = caseId,
                hearingDate = LocalDate.now().toString(),
                nextHearingDate = nextHearingDate,
                orderText = orderText,
                attendanceMarked = true
            )
            hearingRepository.addHearing(dto)
                .onSuccess { _uiState.update { it.copy(hearingUpdateSuccess = true) } }
                .onFailure { e -> _uiState.update { it.copy(errorMessage = e.message) } }
        }
    }

    fun resetHearingState() = _uiState.update { it.copy(hearingUpdateSuccess = false) }
    fun clearError() = _uiState.update { it.copy(errorMessage = null) }
    fun refresh() = loadCauseList()
}
