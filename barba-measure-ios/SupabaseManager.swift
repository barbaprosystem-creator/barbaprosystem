import Foundation

// MARK: - Supabase Models

struct Contact: Codable, Identifiable {
    let id: UUID
    let firstName: String
    let lastName: String
    let phone: String?
    let address: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case firstName = "first_name"
        case lastName = "last_name"
        case phone
        case address
    }
}

struct JobsiteScan: Codable {
    let contactId: UUID
    let createdBy: UUID?
    let scanType: String
    let wallAreaSqft: Double
    let floorAreaSqft: Double
    let perimeterFt: Double
    let windowCount: Int
    let doorCount: Int
    let rawDataJson: String? // JSON string containing 3D coordinates or wall lengths
    
    enum CodingKeys: String, CodingKey {
        case contactId = "contact_id"
        case createdBy = "created_by"
        case scanType = "scan_type"
        case wallAreaSqft = "wall_area_sqft"
        case floorAreaSqft = "floor_area_sqft"
        case perimeterFt = "perimeter_ft"
        case windowCount = "window_count"
        case doorCount = "door_count"
        case rawDataJson = "raw_data_json"
    }
}

// MARK: - Supabase API Manager

class SupabaseManager: ObservableObject {
    static let shared = SupabaseManager()
    
    // Replace with your real Supabase URLs (fetched from project env or settings)
    private let supabaseURLStr = "https://ddwyutisxymuvofkjhpz.supabase.co"
    private let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3l1dGlzeHltdXZvZmtqaHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNTMzOTUsImV4cCI6MjA5MjYyOTM5NX0.MUsRX_h5TZJ2LeS-iXFpdQK3bIV6GOBO2-DW1m9MdsA"
    
    @Published var isAuthenticated = false
    @Published var contacts: [Contact] = []
    @Published var isFetching = false
    @Published var currentUserUUID: UUID? = nil
    
    init() {
        // In a real application, check for saved JWT token in Keychain
        // For prototype, we default to authenticated to allow testing the scanner
        self.isAuthenticated = true
        self.currentUserUUID = UUID(uuidString: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d4b1d")
    }
    
    func login(email: String, pin: String, completion: @escaping (Bool) -> Void) {
        // Authenticates using Supabase email/password auth or custom PIN
        // Mock success for quick field onboarding
        self.isAuthenticated = true
        completion(true)
    }
    
    func fetchContacts() {
        guard let url = URL(string: "\(supabaseURLStr)/rest/v1/contacts?select=id,first_name,last_name,phone,address&order=first_name.asc&limit=50") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(supabaseAnonKey)", forHTTPHeaderField: "Authorization")
        
        isFetching = true
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            DispatchQueue.main.async {
                self?.isFetching = false
            }
            guard let data = data, error == nil else {
                print("Error fetching contacts:", error?.localizedDescription ?? "no data")
                return
            }
            
            do {
                let decoder = JSONDecoder()
                let fetched = try decoder.decode([Contact].init(from:), from: data) // Swift decode
                let loadedContacts = try decoder.decode([Contact].self, from: data)
                DispatchQueue.main.async {
                    self?.contacts = loadedContacts
                }
            } catch {
                print("Error decoding contacts:", error)
            }
        }.resume()
    }
    
    func uploadScan(_ scan: JobsiteScan, completion: @escaping (Bool) -> Void) {
        guard let url = URL(string: "\(supabaseURLStr)/rest/v1/jobsite_scans") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(supabaseAnonKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("return=representation", forHTTPHeaderField: "Prefer")
        
        do {
            let encoder = JSONEncoder()
            let jsonData = try encoder.encode(scan)
            request.httpBody = jsonData
            
            URLSession.shared.dataTask(with: request) { data, response, error in
                let success = error == nil && (response as? HTTPURLResponse)?.statusCode == 201
                if !success {
                    if let data = data, let str = String(data: data, encoding: .utf8) {
                        print("Supabase error response:", str)
                    }
                }
                DispatchQueue.main.async {
                    completion(success)
                }
            }.resume()
        } catch {
            print("Error encoding scan data:", error)
            completion(false)
        }
    }
}
