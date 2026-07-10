import SwiftUI

struct ContentView: View {
    @StateObject private var db = SupabaseManager.shared
    
    @State private var email = ""
    @State private var pin = ""
    @State private var loginError = ""
    @State private var isLoggingIn = false
    
    @State private var searchQuery = ""
    @State private var selectedContact: Contact? = nil
    
    @State private var showScanner = false
    @State private var currentScanResult: ScanResult? = nil
    @State private var isSyncing = false
    @State private var syncStatusMessage = ""
    
    var filteredContacts: [Contact] {
        if searchQuery.isEmpty {
            return db.contacts
        }
        return db.contacts.filter {
            $0.firstName.localizedCaseInsensitiveContains(searchQuery) ||
            $0.lastName.localizedCaseInsensitiveContains(searchQuery) ||
            ($0.address?.localizedCaseInsensitiveContains(searchQuery) ?? false)
        }
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                // Background theme (matches deep dark aesthetic)
                Color(red: 3/255, green: 20/255, blue: 39/255)
                    .ignoresSafeArea()
                
                if !db.isAuthenticated {
                    loginView
                } else {
                    mainDashboardView
                }
            }
            .navigationTitle("Barba Measure 3D")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if db.isAuthenticated {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button(action: {
                            db.isAuthenticated = false
                        }) {
                            Image(systemName: "power")
                                .foregroundColor(.red)
                        }
                    }
                }
            }
        }
        .onAppear {
            if db.isAuthenticated {
                db.fetchContacts()
            }
        }
    }
    
    // MARK: - Login UI View
    
    var loginView: some View {
        VStack(spacing: 24) {
            Spacer()
            
            // Branding
            Image(systemName: "arkit")
                .font(.system(size: 64))
                .foregroundColor(Color(red: 249/255, green: 115/255, blue: 22/255)) // Orange
                .padding(.bottom, 8)
            
            Text("BARBA PRO SYSTEM")
                .font(.system(size: 24, weight: .black, design: .monospaced))
                .foregroundColor(.white)
            
            Text("LiDAR Gutter & Siding Scanner")
                .font(.subheadline)
                .foregroundColor(.gray)
            
            VStack(spacing: 16) {
                TextField("Email", text: $email)
                    .textFieldStyle(PlainTextFieldStyle())
                    .padding()
                    .background(Color(red: 16/255, green: 32/255, blue: 52/255))
                    .cornerRadius(8)
                    .foregroundColor(.white)
                    .autocapitalization(.none)
                    .keyboardType(.emailAddress)
                
                SecureField("Access PIN", text: $pin)
                    .textFieldStyle(PlainTextFieldStyle())
                    .padding()
                    .background(Color(red: 16/255, green: 32/255, blue: 52/255))
                    .cornerRadius(8)
                    .foregroundColor(.white)
                    .keyboardType(.numberPad)
            }
            .padding(.horizontal, 24)
            
            if !loginError.isEmpty {
                Text(loginError)
                    .foregroundColor(.red)
                    .font(.caption)
            }
            
            Button(action: {
                isLoggingIn = true
                db.login(email: email, pin: pin) { success in
                    isLoggingIn = false
                    if success {
                        db.fetchContacts()
                    } else {
                        loginError = "Invalid credentials. Try again."
                    }
                }
            }) {
                HStack {
                    if isLoggingIn {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .black))
                    } else {
                        Text("Connect Platform")
                            .font(.headline)
                            .foregroundColor(.black)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(red: 249/255, green: 115/255, blue: 22/255))
                .cornerRadius(10)
                .padding(.horizontal, 24)
            }
            
            Spacer()
        }
    }
    
    // MARK: - Main Dashboard View
    
    var mainDashboardView: some View {
        VStack(spacing: 16) {
            // Client Search and Selector
            VStack(alignment: .leading, spacing: 8) {
                Text("SELECT CLIENT TO SCAN")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.gray)
                    .padding(.horizontal)
                
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    TextField("Search client by name...", text: $searchQuery)
                        .foregroundColor(.white)
                }
                .padding()
                .background(Color(red: 16/255, green: 32/255, blue: 52/255))
                .cornerRadius(12)
                .padding(.horizontal)
                
                if selectedContact == nil {
                    // List of clients
                    List(filteredContacts) { contact in
                        Button(action: {
                            selectedContact = contact
                            currentScanResult = nil
                            syncStatusMessage = ""
                        }) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("\(contact.firstName) \(contact.lastName)")
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                if let address = contact.address {
                                    Text(address)
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                }
                            }
                        }
                        .listRowBackground(Color(red: 11/255, green: 28/255, blue: 48/255))
                    }
                    .listStyle(PlainListStyle())
                    .frame(maxHeight: 250)
                } else {
                    // Selected client card
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("SELECTED CLIENT")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(Color(red: 249/255, green: 115/255, blue: 22/255))
                            Text("\(selectedContact!.firstName) \(selectedContact!.lastName)")
                                .font(.headline)
                                .foregroundColor(.white)
                            if let address = selectedContact!.address {
                                Text(address)
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            }
                        }
                        Spacer()
                        Button(action: {
                            selectedContact = nil
                            currentScanResult = nil
                            syncStatusMessage = ""
                        }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.gray)
                                .font(.title3)
                        }
                    }
                    .padding()
                    .background(Color(red: 11/255, green: 28/255, blue: 48/255))
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color(red: 249/255, green: 115/255, blue: 22/255, alpha: 0.3), lineWidth: 1)
                    )
                    .padding(.horizontal)
                }
            }
            .padding(.top, 16)
            
            // Scanner Activation & Results
            if selectedContact != nil {
                VStack(spacing: 20) {
                    if let result = currentScanResult {
                        // Scan results card
                        VStack(spacing: 12) {
                            Text("SCANNED MEASUREMENTS")
                                .font(.caption2)
                                .fontWeight(.bold)
                                .foregroundColor(.gray)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            
                            Divider()
                                .background(Color.gray)
                            
                            GridRowView(label: "Wall Area (Siding):", value: "\(result.wallArea) sqft")
                            GridRowView(label: "Floor Area (Roofing):", value: "\(result.floorArea) sqft")
                            GridRowView(label: "Perimeter (Gutters/Fence):", value: "\(result.perimeter) LF")
                            GridRowView(label: "Window Count:", value: "\(result.windowsCount) Uds")
                            GridRowView(label: "Door Count:", value: "\(result.doorsCount) Uds")
                        }
                        .padding()
                        .background(Color(red: 16/255, green: 32/255, blue: 52/255))
                        .cornerRadius(16)
                        .padding(.horizontal)
                        
                        if !syncStatusMessage.isEmpty {
                            Text(syncStatusMessage)
                                .font(.footnote)
                                .foregroundColor(.green)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal)
                        }
                        
                        // Sync Button
                        Button(action: {
                            syncScanData(result)
                        }) {
                            HStack {
                                if isSyncing {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .black))
                                } else {
                                    Image(systemName: "arrow.triangle.2.circlepath")
                                    Text("Upload & Sync with CRM")
                                        .fontWeight(.bold)
                                }
                            }
                            .foregroundColor(.black)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.green)
                            .cornerRadius(12)
                            .padding(.horizontal)
                        }
                        .disabled(isSyncing)
                    }
                    
                    // LiDAR Launch Button
                    Button(action: {
                        showScanner = true
                    }) {
                        HStack(spacing: 12) {
                            Image(systemName: "camera.viewfinder")
                                .font(.title2)
                            Text(currentScanResult == nil ? "LAUNCH 3D LIDAR SCANNER" : "RE-SCAN PROPERTY")
                                .font(.headline)
                        }
                        .foregroundColor(.black)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 18)
                        .background(Color(red: 249/255, green: 115/255, blue: 22/255)) // Orange
                        .cornerRadius(14)
                        .shadow(color: Color(red: 249/255, green: 115/255, blue: 22/255, alpha: 0.3), radius: 10, x: 0, y: 5)
                        .padding(.horizontal)
                    }
                    .sheet(isPresented: $showScanner) {
                        RoomScannerView(onScanFinished: { result in
                            self.currentScanResult = result
                            self.showScanner = false
                        }, onCancel: {
                            self.showScanner = false
                        })
                    }
                }
                .padding(.top, 8)
            } else {
                VStack(spacing: 16) {
                    Spacer()
                    Image(systemName: "dot.radiowaves.left.and.right")
                        .font(.system(size: 48))
                        .foregroundColor(.gray.opacity(0.5))
                    Text("Select an active client to begin scanning")
                        .foregroundColor(.gray)
                        .font(.subheadline)
                    Spacer()
                }
            }
            
            Spacer()
        }
    }
    
    // MARK: - API Upload Logic
    
    func syncScanData(_ result: ScanResult) {
        guard let contact = selectedContact else { return }
        isSyncing = true
        syncStatusMessage = ""
        
        let scan = JobsiteScan(
            contactId: contact.id,
            createdBy: db.currentUserUUID,
            scanType: "room",
            wallAreaSqft: result.wallArea,
            floorAreaSqft: result.floorArea,
            perimeterFt: result.perimeter,
            windowCount: result.windowsCount,
            doorCount: result.doorsCount,
            rawDataJson: result.rawJson
        )
        
        db.uploadScan(scan) { success in
            isSyncing = false
            if success {
                syncStatusMessage = "SUCCESS! Measurements uploaded. Go to CRM Estimator and click 'Import Measurements' for \(contact.firstName)."
            } else {
                syncStatusMessage = "UPLOAD FAILED. Check network or Supabase connection."
            }
        }
    }
}

// MARK: - Helper UI Components

struct GridRowView: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(.gray)
            Spacer()
            Text(value)
                .fontWeight(.bold)
                .foregroundColor(.white)
                .font(.system(.body, design: .monospaced))
        }
    }
}
