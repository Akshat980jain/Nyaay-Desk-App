// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "NyaayDesk",
    platforms: [.iOS(.v17)],
    dependencies: [
        // Official Supabase Swift client — connects to the SAME Supabase project as the web app
        .package(
            url: "https://github.com/supabase/supabase-swift.git",
            from: "2.5.0"
        )
    ],
    targets: [
        .target(
            name: "NyaayDesk",
            dependencies: [
                .product(name: "Supabase", package: "supabase-swift"),
                .product(name: "Auth", package: "supabase-swift"),
                .product(name: "PostgREST", package: "supabase-swift"),
                .product(name: "Realtime", package: "supabase-swift"),
                .product(name: "Storage", package: "supabase-swift")
            ]
        )
    ]
)
