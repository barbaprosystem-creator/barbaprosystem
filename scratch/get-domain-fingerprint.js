import tls from 'tls';

const socket = tls.connect(443, 'barbaprosystem.com', { servername: 'barbaprosystem.com' }, () => {
  const cert = socket.getPeerCertificate();
  if (cert && Object.keys(cert).length > 0) {
    console.log("✅ SSL Certificate fetched successfully!");
    console.log("Subject:", cert.subject?.CN);
    console.log("Issuer:", cert.issuer?.CN);
    console.log("SHA-1 Fingerprint:", cert.fingerprint);
    console.log("SHA-256 Fingerprint (Hex):", cert.fingerprint256);
    
    // Formatting SHA-256 with colons if needed
    console.log("SHA-256 Fingerprint (Colons):", cert.fingerprint256);
  } else {
    console.log("❌ Could not retrieve peer certificate.");
  }
  socket.end();
});

socket.on('error', (err) => {
  console.error("❌ TLS Connection error:", err.message);
});
