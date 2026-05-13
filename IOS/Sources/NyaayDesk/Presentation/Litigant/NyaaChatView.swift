import SwiftUI

// MARK: - Nyaay Saathi AI Chat (Stitch Design)
struct NyaaChatView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var messageText = ""
    @State private var messages: [NyaayChatMessage] = [
        NyaayChatMessage(
            text: "Hello! I am Nyaay-Saathi, your AI legal assistant. How can I help you with your case today?",
            isUser: false,
            quickReplies: nil
        ),
        NyaayChatMessage(
            text: "I need to check the status of my civil suit regarding property dispute.",
            isUser: true,
            quickReplies: nil
        ),
        NyaayChatMessage(
            text: "Certainly. To help you with the specific status, I will need your Case Number or CNR Number. Do you have that information available?",
            isUser: false,
            quickReplies: ["Yes, I have it", "Search by Name instead"]
        )
    ]

    var body: some View {
        VStack(spacing: 0) {
            // ── TOP NAV ───────────────────────────────────────────────────
            NyaayTopBarView(onLogout: { dismiss() })

            // ── CHAT AREA ─────────────────────────────────────────────────
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(spacing: 16) {
                        // Date separator
                        Text("Today, 10:00 AM")
                            .font(.system(size: 12))
                            .foregroundStyle(Color.appNavy.opacity(0.5))
                            .padding(.horizontal, 14).padding(.vertical, 4)
                            .background(Color(hex: "DEE2E6"))
                            .clipShape(Capsule())

                        ForEach(messages) { message in
                            NyaaChatBubble(message: message)
                                .id(message.id)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 16)
                }
                .background(Color.appBackground)
                .onChange(of: messages.count) {
                    withAnimation { proxy.scrollTo(messages.last?.id) }
                }
            }

            // ── INPUT AREA ────────────────────────────────────────────────
            VStack(spacing: 0) {
                // Quick action chips
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach([("magnifyingglass", "Check case status"),
                                 ("person.2", "Find an advocate"),
                                 ("doc.text", "How to file")], id: \.1) { icon, label in
                            HStack(spacing: 4) {
                                Image(systemName: icon).font(.system(size: 12))
                                Text(label).font(.system(size: 12))
                            }
                            .foregroundStyle(Color.appNavy.opacity(0.7))
                            .padding(.horizontal, 12).padding(.vertical, 6)
                            .background(Color.appBackground)
                            .overlay(Capsule().stroke(Color(hex: "DEE2E6"), lineWidth: 1))
                            .clipShape(Capsule())
                        }
                    }
                    .padding(.horizontal, 12)
                }
                .padding(.vertical, 8)
                .background(Color.white)

                // Text input row
                HStack(spacing: 8) {
                    TextField("Type your message to Nyaay-Saathi...", text: $messageText)
                        .font(.system(size: 14))
                        .padding(.horizontal, 16).padding(.vertical, 10)
                        .background(Color.appBackground)
                        .overlay(Capsule().stroke(Color(hex: "DEE2E6"), lineWidth: 1))
                        .clipShape(Capsule())

                    Button(action: sendMessage) {
                        Image(systemName: "arrow.right")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(Color.appNavy)
                            .frame(width: 48, height: 48)
                            .background(Color.appGold)
                            .clipShape(Circle())
                    }
                    .disabled(messageText.isEmpty)
                }
                .padding(.horizontal, 12)
                .padding(.bottom, 12)
                .background(Color.white)
            }
        }
        .background(Color.appBackground)
    }

    private func sendMessage() {
        guard !messageText.isEmpty else { return }
        messages.append(NyaayChatMessage(text: messageText, isUser: true, quickReplies: nil))
        let sent = messageText
        messageText = ""
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            messages.append(NyaayChatMessage(
                text: "I'm processing your request: \"\(sent)\". Please wait...",
                isUser: false,
                quickReplies: nil
            ))
        }
    }
}

// MARK: - Chat Bubble (Stitch design)
private struct NyaaChatBubble: View {
    let message: NyaayChatMessage

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            if message.isUser {
                Spacer()
                Text(message.text)
                    .font(.system(size: 15))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16).padding(.vertical, 12)
                    .background(Color.appNavy)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .frame(maxWidth: 280, alignment: .trailing)
            } else {
                // Robot avatar
                Circle()
                    .fill(Color(hex: "DEE2E6"))
                    .frame(width: 36, height: 36)
                    .overlay(Image(systemName: "cpu").font(.system(size: 16)).foregroundStyle(Color.appNavy))

                VStack(alignment: .leading, spacing: 8) {
                    Text(message.text)
                        .font(.system(size: 15))
                        .foregroundStyle(Color.appNavy)
                        .padding(.horizontal, 16).padding(.vertical, 12)
                        .background(Color(hex: "E9ECEF"))
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                        .frame(maxWidth: 280, alignment: .leading)

                    // Quick reply chips
                    if let replies = message.quickReplies {
                        VStack(alignment: .leading, spacing: 6) {
                            ForEach(replies, id: \.self) { reply in
                                Text(reply)
                                    .font(.system(size: 14))
                                    .foregroundStyle(Color.appNavy)
                                    .padding(.horizontal, 14).padding(.vertical, 8)
                                    .frame(maxWidth: 260, alignment: .leading)
                                    .background(Color.white)
                                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "DEE2E6"), lineWidth: 1))
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                            }
                        }
                    }
                }
                Spacer()
            }
        }
    }
}

struct NyaayChatMessage: Identifiable {
    let id = UUID()
    let text: String
    let isUser: Bool
    let quickReplies: [String]?
}
