package com.nyaaydesk.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

/** Local Room entity caching authenticated user profile data. */
@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    val email: String,
    val userType: String,       // "litigant" | "advocate" | "clerk" | "admin"
    val fullName: String?,
    val phone: String?,
    val barCouncilId: String?,  // Advocate-specific
    val courtId: String?,       // Clerk-specific
    val isVerified: Boolean = false,
    val avatarUrl: String?
)
