import SwiftUI

struct NyaayDocument: Identifiable {
    let id = UUID()
    let name: String
    let category: String
}

struct DocumentVaultView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var selectedCategory = "All"
    let categories = ["All", "IDs", "Evidence", "Orders", "Affidavits"]
    
    let documents = [
        NyaayDocument(name: "Final Judgment.pdf", category: "Orders"),
        NyaayDocument(name: "Aadhar Card.pdf", category: "IDs"),
        NyaayDocument(name: "Property Deed.pdf", category: "Evidence"),
        NyaayDocument(name: "Case Summary.pdf", category: "Evidence"),
        NyaayDocument(name: "Affidavit_Signed.pdf", category: "Affidavits"),
        NyaayDocument(name: "PAN Card.pdf", category: "IDs")
    ]

    var filteredDocuments: [NyaayDocument] {
        selectedCategory == "All" ? documents : documents.filter { $0.category == selectedCategory }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Category Picker
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 10) {
                        ForEach(categories, id: \.self) { category in
                            Button { selectedCategory = category } label: {
                                Text(category)
                                    .font(.system(size: 14, weight: .medium))
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(selectedCategory == category ? Color.appNavy : Color.appNavy.opacity(0.05))
                                    .foregroundStyle(selectedCategory == category ? .white : Color.appNavy)
                                    .clipShape(Capsule())
                            }
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.vertical, 16)
                }

                ScrollView {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                        ForEach(filteredDocuments) { doc in
                            DocumentCard(doc: doc)
                        }
                    }
                    .padding(24)
                }
            }
            .background(Color.appBackground)
            .navigationTitle("Document Vault")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "chevron.left")
                            .foregroundStyle(Color.appNavy)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: { /* Upload */ }) {
                        Image(systemName: "plus.circle.fill")
                            .foregroundStyle(Color.appGold)
                    }
                }
            }
        }
    }
}

private struct DocumentCard: View {
    let doc: NyaayDocument
    
    var body: some View {
        VStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color.appNavy.opacity(0.05))
                    .frame(width: 80, height: 80)
                
                Image(systemName: iconForCategory(doc.category))
                    .font(.system(size: 30))
                    .foregroundStyle(Color.appNavy)
            }
            
            VStack(spacing: 2) {
                Text(doc.name)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(Color.appNavy)
                    .lineLimit(1)
                
                Text(doc.category)
                    .font(.system(size: 11))
                    .foregroundStyle(Color.appNavy.opacity(0.4))
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
    }
    
    private func iconForCategory(_ category: String) -> String {
        switch category {
        case "IDs": return "person.text.rectangle.fill"
        case "Orders": return "gavel.fill"
        default: return "doc.fill"
        }
    }
}
