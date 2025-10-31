const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Generando certificados SSL autofirmados para desarrollo...');

try {
  // Crear directorio certs si no existe
  const certsDir = path.join(__dirname, 'certs');
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir);
  }

  // Generar clave privada
  execSync('openssl genrsa -out certs/private-key.pem 2048', { stdio: 'inherit' });
  
  // Generar certificado autofirmado
  execSync('openssl req -new -x509 -key certs/private-key.pem -out certs/certificate.pem -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"', { stdio: 'inherit' });
  
  console.log('✅ Certificados SSL generados exitosamente en el directorio /certs');
  console.log('   - private-key.pem: Clave privada');
  console.log('   - certificate.pem: Certificado público');
  
} catch (error) {
  console.error('❌ Error generando certificados SSL:', error.message);
  console.log('\n💡 Nota: Asegúrate de tener OpenSSL instalado en tu sistema');
  console.log('   - macOS: brew install openssl');
  console.log('   - Windows: Descargar desde https://slproweb.com/products/Win32OpenSSL.html');
  console.log('   - Linux: sudo apt-get install openssl');
}