import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

export const pool = mysql.createPool({
  host: "localmonitoriadigital.mysql.database.azure.com",
  user: "adminmonitoria",
  database: "monitoria_digital",
  password: "Truco-6912",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    // Caminho para o arquivo .pem do certificado raiz
    ca: fs.readFileSync(path.resolve(__dirname, "certs", "BaltimoreCyberTrustRoot.crt.pem")),
    rejectUnauthorized: true,
  },
});

