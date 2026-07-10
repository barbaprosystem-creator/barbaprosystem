import SwiftUI
import RoomPlan
import ARKit

// MARK: - ScanResult Data Model

struct ScanResult {
    var wallArea: Double = 0.0      // Total wall square footage (siding / paint)
    var floorArea: Double = 0.0     // Total floor square footage (flooring)
    var perimeter: Double = 0.0     // Total perimeter linear feet (baseboards / gutters)
    var windowsCount: Int = 0
    var doorsCount: Int = 0
    var rawJson: String = "{}"
}

// MARK: - SwiftUI RoomScanner View Wrapper

struct RoomScannerView: UIViewControllerRepresentable {
    var onScanFinished: (ScanResult) -> Void
    var onCancel: () -> Void
    
    func makeUIViewController(context: Context) -> RoomScannerViewController {
        let vc = RoomScannerViewController()
        vc.onScanFinished = onScanFinished
        vc.onCancel = onCancel
        return vc
    }
    
    func updateUIViewController(_ uiViewController: RoomScannerViewController, context: Context) {}
}

// MARK: - UIViewController for LiDAR & RoomPlan Capture

class RoomScannerViewController: UIViewController, RoomCaptureViewDelegate, RoomCaptureSessionDelegate {
    
    var onScanFinished: ((ScanResult) -> Void)?
    var onCancel: (() -> Void)?
    
    private var roomCaptureView: RoomCaptureView!
    private var roomCaptureSessionConfig = RoomCaptureSession.Configuration()
    private var isScanning = false
    
    private var stopButton: UIButton!
    private var cancelButton: UIButton!
    private var statusLabel: UILabel!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupCaptureView()
        setupControls()
        startScan()
    }
    
    private func setupCaptureView() {
        roomCaptureView = RoomCaptureView(frame: view.bounds)
        roomCaptureView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        roomCaptureView.delegate = self
        roomCaptureView.captureSession.delegate = self
        view.addSubview(roomCaptureView)
    }
    
    private func setupControls() {
        // Stop Button
        stopButton = UIButton(type: .system)
        stopButton.setTitle("FINISH SCAN & EXTRACT", for: .normal)
        stopButton.titleLabel?.font = UIFont.boldSystemFont(ofSize: 16)
        stopButton.setTitleColor(.black, for: .normal)
        stopButton.backgroundColor = UIColor(red: 249/255, green: 115/255, blue: 22/255, alpha: 1.0) // Vibrant Orange
        stopButton.layer.cornerRadius = 10
        stopButton.frame = CGRect(x: 20, y: view.bounds.height - 100, width: view.bounds.width - 40, height: 50)
        stopButton.autoresizingMask = [.flexibleTopMargin, .flexibleWidth]
        stopButton.addTarget(self, action: #selector(stopScan), for: .touchUpInside)
        view.addSubview(stopButton)
        
        // Cancel Button
        cancelButton = UIButton(type: .system)
        cancelButton.setTitle("Cancel", for: .normal)
        cancelButton.setTitleColor(.white, for: .normal)
        cancelButton.frame = CGRect(x: 20, y: 50, width: 80, height: 40)
        cancelButton.addTarget(self, action: #selector(cancelTapped), for: .touchUpInside)
        view.addSubview(cancelButton)
        
        // Status HUD Label
        statusLabel = UILabel(frame: CGRect(x: 20, y: 100, width: view.bounds.width - 40, height: 40))
        statusLabel.textColor = .white
        statusLabel.textAlignment = .center
        statusLabel.font = UIFont.monospacedDigitSystemFont(ofSize: 14, weight: .bold)
        statusLabel.text = "Point camera at walls to capture LiDAR depth..."
        statusLabel.backgroundColor = UIColor.black.withAlphaComponent(0.6)
        statusLabel.layer.cornerRadius = 8
        statusLabel.clipsToBounds = true
        view.addSubview(statusLabel)
    }
    
    private func startScan() {
        guard RoomCaptureSession.isSupported else {
            statusLabel.text = "LiDAR NOT SUPPORTED - Simulating scan"
            stopButton.setTitle("LiDAR Not Supported. Click to Simulate", for: .normal)
            return
        }
        roomCaptureView.captureSession.run(configuration: roomCaptureSessionConfig)
        isScanning = true
    }
    
    @objc private func stopScan() {
        if RoomCaptureSession.isSupported {
            roomCaptureView.captureSession.stop()
        } else {
            // Simulate scan data for preview/non-Pro iPhones
            let mockResult = ScanResult(
                wallArea: Double.random(in: 400...1200).rounded(),
                floorArea: Double.random(in: 150...600).rounded(),
                perimeter: Double.random(in: 60...180).rounded(),
                windowsCount: Int.random(in: 2...8),
                doorsCount: Int.random(in: 1...3),
                rawJson: "{\"simulated\": true, \"timestamp\": \(Date().timeIntervalSince1970)}"
            )
            onScanFinished?(mockResult)
            dismiss(animated: true)
        }
    }
    
    @objc private func cancelTapped() {
        if RoomCaptureSession.isSupported {
            roomCaptureView.captureSession.stop()
        }
        onCancel?()
        dismiss(animated: true)
    }
    
    // MARK: - RoomCaptureViewDelegate
    
    func roomCaptureView(shouldPresent room: CapturedRoom, error: Error?) -> Bool {
        return true
    }
    
    func roomCaptureView(didPresent room: CapturedRoom, error: Error?) {
        // Extracted room details
        var totalWallArea: Double = 0.0
        var totalFloorArea: Double = 0.0
        var totalPerimeter: Double = 0.0
        var windowsCount = 0
        var doorsCount = 0
        
        // Loop over room elements to compute measurements (converted from meters to feet)
        let metersToFeet: Double = 3.28084
        let sqMetersToSqFeet: Double = 10.7639
        
        // 1. Calculate floor area
        // CapturedRoom defines dimensions as (x: width, y: height, z: depth)
        // Usually, y-axis represents room height, x/z are floor plane dimensions
        // For simple estimation, floor area = x * z
        for roomFloor in room.floors {
            let area = Double(roomFloor.dimensions.x * roomFloor.dimensions.z) * sqMetersToSqFeet
            totalFloorArea += area
        }
        
        // 2. Calculate walls area and perimeter
        for roomWall in room.walls {
            // Wall area = length * height
            let lengthFeet = Double(roomWall.dimensions.x) * metersToFeet
            let heightFeet = Double(roomWall.dimensions.y) * metersToFeet
            totalWallArea += (lengthFeet * heightFeet)
            totalPerimeter += lengthFeet
        }
        
        // 3. Count windows and doors
        windowsCount = room.windows.count
        doorsCount = room.doors.count
        
        // Create serialization string
        let jsonStr = "{\"walls\": \(room.walls.count), \"windows\": \(windowsCount), \"doors\": \(doorsCount)}"
        
        let result = ScanResult(
            wallArea: totalWallArea.rounded(),
            floorArea: totalFloorArea.rounded(),
            perimeter: totalPerimeter.rounded(),
            windowsCount: windowsCount,
            doorsCount: doorsCount,
            rawJson: jsonStr
        )
        
        onScanFinished?(result)
        dismiss(animated: true)
    }
    
    // MARK: - RoomCaptureSessionDelegate
    
    func roomCaptureSession(_ session: RoomCaptureSession, didUpdate room: CapturedRoom) {
        DispatchQueue.main.async {
            self.statusLabel.text = "LiDAR Active: captured \(room.walls.count) walls, \(room.windows.count) windows"
        }
    }
}
