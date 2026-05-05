import SwiftUI

/**
 * DocumentVaultView (iOS) — Modern grid for file management.
 */
struct DocumentVaultView: View {
    let columns = [
        GridItem(.flexible(), spacing: 16),
        GridItem(.flexible(), spacing: 16)
    ]
    
    let dummyDocs = [
        "Judgment_Main.pdf", "Hearing_Notice.pdf", "Summons_Reply.pdf", "Evidence_03.pdf"
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVGrid(columns: columns, spacing: 16) {
                    ForEach(dummyDocs, id: \.self) { doc in
                        DocumentVaultCard(fileName: doc)
                    }
                }
                .padding()
            }
            .navigationTitle("Document Vault")
            .background(Color(.systemGroupedBackground))
        }
    }
}

struct DocumentVaultCard: View {
    let fileName: String
    
    var body: some View {
        VStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.nyaayNavy.opacity(0.1))
                    .frame(height: 100)
                
                Image(systemName: "doc.text.fill")
                    .font(.system(size: 40))
                    .foregroundStyle(.nyaayNavy)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(fileName)
                    .font(.caption.bold())
                    .lineLimit(1)
                
                HStack {
                    Image(systemName: "arrow.down.circle")
                    Text("Download")
                }
                .font(.system(size: 10))
                .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
    }
}
