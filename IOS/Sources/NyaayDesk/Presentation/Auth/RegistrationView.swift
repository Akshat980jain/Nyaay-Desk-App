import SwiftUI

/**
 * RegistrationView — Implemented to match Stitch registration_structured_sections.
 */
struct RegistrationView: View {
    @Environment(\.dismiss) var dismiss
    @State private var selectedRole = "Litigant"
    @State private var expandedSection = 1

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Button(action: { dismiss() }) {
                    Image(systemName: "arrow.left")
                        .foregroundStyle(Color.appGold)
                }
                Text("Nyaay Desk")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(Color.appGold)
                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color.appNavy)

            ScrollView {
                VStack(spacing: 0) {
                    // Main Canvas Header
                    VStack(spacing: 16) {
                        Text("Registration")
                            .font(.system(size: 32, weight: .bold))
                            .foregroundStyle(.white)
                        
                        Text("Please complete the form below to create your account.")
                            .font(.system(size: 14))
                            .foregroundStyle(.white.opacity(0.6))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 40)

                        // Role Selection Toggle
                        HStack(spacing: 4) {
                            RoleToggleButton(title: "Litigant", isSelected: selectedRole == "Litigant") { selectedRole = "Litigant" }
                            RoleToggleButton(title: "Advocate", isSelected: selectedRole == "Advocate") { selectedRole = "Advocate" }
                            RoleToggleButton(title: "Court Clerk", isSelected: selectedRole == "Court Clerk") { selectedRole = "Court Clerk" }
                        }
                        .padding(4)
                        .background(.white.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .padding(.top, 8)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 40)
                    .background(Color(hex: "101B30"))

                    // Accordion Sections
                    VStack(spacing: 12) {
                        RegistrationSectionView(
                            index: 1,
                            title: "Personal Details",
                            isExpanded: expandedSection == 1
                        ) {
                            expandedSection = expandedSection == 1 ? 0 : 1
                        } content: {
                            PersonalDetailsForm()
                        }

                        RegistrationSectionView(
                            index: 2,
                            title: "Address Details",
                            isExpanded = expandedSection == 2
                        ) {
                            expandedSection = expandedSection == 2 ? 0 : 2
                        } content: {
                            AddressDetailsForm()
                        }

                        RegistrationSectionView(
                            index: 3,
                            title: "Secure Account",
                            isExpanded = expandedSection == 3
                        ) {
                            expandedSection = expandedSection == 3 ? 0 : 3
                        } content: {
                            SecureAccountForm()
                        }
                    }
                    .padding(16)
                    .padding(.top, 8)

                    Spacer().frame(height: 100)
                }
            }
            .background(Color.appBackground)
        }
        .overlay(alignment: .bottom) {
            // Form Actions
            VStack(spacing: 0) {
                Divider()
                HStack(spacing: 16) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(.white)
                    .foregroundStyle(Color.appNavy)
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.appNavy, lineWidth: 1))
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                    Button(action: { dismiss() }) {
                        HStack {
                            Text("Complete Registration")
                            Image(systemName: "arrow.right")
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(Color.appGold)
                        .foregroundStyle(Color.appNavy)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                    .font(.system(size: 15, weight: .bold))
                }
                .padding(24)
                .background(.white)
            }
        }
        .navigationBarHidden(true)
    }
}

private struct RoleToggleButton: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(isSelected ? Color.appNavy : .white.opacity(0.6))
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(isSelected ? Color.appGold : .clear)
                .clipShape(RoundedRectangle(cornerRadius: 6))
        }
    }
}

private struct RegistrationSectionView<Content: View>: View {
    let index: Int
    let title: String
    let isExpanded: Bool
    let toggle: () -> Void
    let content: () -> Content

    var body: some View {
        VStack(spacing: 0) {
            Button(action: toggle) {
                HStack(spacing: 12) {
                    ZStack {
                        Circle()
                            .fill(isExpanded ? Color.appGold : Color.appBackground)
                            .frame(width: 32, height: 32)
                        Text("\(index)")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(isExpanded ? Color.appNavy : Color.appNavy.opacity(0.6))
                    }
                    
                    Text(title)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Color(hex: "101B30"))
                    
                    Spacer()
                    
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Color.appNavy.opacity(0.4))
                }
                .padding(16)
            }

            if isExpanded {
                VStack(spacing: 20) {
                    content()
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 24)
            }
        }
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "DEE2E6"), lineWidth: 1))
    }
}

private struct PersonalDetailsForm: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            NyaayInputLabel(text: "Party Type")
            NyaayRegistrationDropdown(options: ["Individual", "Organization"], placeholder: "Select Party Type")
            
            NyaayInputLabel(text: "Full Name")
            NyaayRegistrationTextField(placeholder: "Enter your full name")
            
            NyaayInputLabel(text: "Parent's Name")
            NyaayRegistrationTextField(placeholder: "Enter parent's full name")
            
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    NyaayInputLabel(text: "Gender")
                    NyaayRegistrationDropdown(options: ["Male", "Female", "Other"], placeholder: "Select")
                }
                VStack(alignment: .leading, spacing: 8) {
                    NyaayInputLabel(text: "Date of Birth")
                    NyaayRegistrationTextField(placeholder: "DD/MM/YYYY")
                }
            }
        }
    }
}

private struct AddressDetailsForm: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            NyaayInputLabel(text: "Street/House/Village")
            NyaayRegistrationTextField(placeholder: "Enter complete address")
            
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    NyaayInputLabel(text: "City")
                    NyaayRegistrationTextField(placeholder: "Enter city")
                }
                VStack(alignment: .leading, spacing: 8) {
                    NyaayInputLabel(text: "District")
                    NyaayRegistrationTextField(placeholder: "Enter district")
                }
            }
            
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    NyaayInputLabel(text: "State")
                    NyaayRegistrationDropdown(options: ["Delhi", "Maharashtra", "Uttar Pradesh"], placeholder: "Select")
                }
                VStack(alignment: .leading, spacing: 8) {
                    NyaayInputLabel(text: "Pincode")
                    NyaayRegistrationTextField(placeholder: "6-digit")
                }
            }
        }
    }
}

private struct SecureAccountForm: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            NyaayInputLabel(text: "Email Address")
            NyaayRegistrationTextField(placeholder: "Enter valid email")
            
            NyaayInputLabel(text: "Mobile Number")
            HStack(spacing: 0) {
                Text("+91")
                    .font(.system(size: 14))
                    .foregroundStyle(Color.appNavy.opacity(0.6))
                    .padding(.horizontal, 12)
                    .frame(height: 48)
                    .background(Color(hex: "F3F4F5"))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "C4C6CC"), lineWidth: 1))
                
                TextField("10-digit mobile number", text: .constant(""))
                    .foregroundStyle(Color.appNavy)
                    .padding(.horizontal)
                    .frame(height: 48)
                    .background(.white)
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "C4C6CC"), lineWidth: 1))
                    .padding(.leading, -1)
            }
            
            NyaayInputLabel(text: "Password")
            SecureField("Create password", text: .constant(""))
                .foregroundStyle(Color.appNavy)
                .padding()
                .frame(height: 48)
                .background(.white)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "C4C6CC"), lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            
            NyaayInputLabel(text: "Confirm Password")
            SecureField("Confirm password", text: .constant(""))
                .foregroundStyle(Color.appNavy)
                .padding()
                .frame(height: 48)
                .background(.white)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "C4C6CC"), lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: 8))
        }
    }
}

private struct NyaayInputLabel: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.system(size: 12, weight: .bold))
            .foregroundStyle(Color.appNavy.opacity(0.6))
    }
}

private struct NyaayRegistrationTextField: View {
    let placeholder: String
    var body: some View {
        TextField(placeholder, text: .constant(""))
            .foregroundStyle(Color.appNavy)
            .padding()
            .frame(height: 48)
            .background(.white)
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "C4C6CC"), lineWidth: 1))
            .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

private struct NyaayRegistrationDropdown: View {
    let options: [String]
    let placeholder: String
    var body: some View {
        HStack {
            Text(placeholder)
                .foregroundStyle(Color.appNavy.opacity(0.4))
            Spacer()
            Image(systemName: "chevron.down")
                .foregroundStyle(Color.appNavy.opacity(0.4))
        }
        .padding()
        .frame(height: 48)
        .background(.white)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "C4C6CC"), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
