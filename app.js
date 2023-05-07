// Importa Express como módulo.
const express = require("express");
// Importa el módulo path para manejar rutas de archivos.
const path = require("path");
// Crea una instancia de la aplicación Express.
const app = express();
// Importa el módulo Speakeasy para generar secretos y verificar contraseñas de TOTP.
const speakeasy = require("speakeasy");
// Importa el módulo QRCode para generar códigos QR a partir de una URL.
const QRCode = require("qrcode");

// Crea una variable para registrar el momento en que se inició el servidor.
const serverStarted = new Date();

// Indica que los archivos estáticos se encuentran en el directorio 'public'.
app.use(express.static("public"));

// Define la ruta principal del sitio web.
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public/index.html"))
);

// Crea una matriz vacía para almacenar los usuarios.
const users = [];

// Define una ruta que devuelve la fecha y hora en que se inició el servidor.
app.get("/serverStarted", (req, res) => {
  res.json(serverStarted);
});

// Define una ruta que devuelve la cantidad de usuarios registrados.
app.get("/userCount", (req, res) => {
  const userCount = users.length;
  res.json(userCount);
});

// Define una ruta para generar un código TOTP y un código QR para un nuevo usuario.
app.post("/genTotp", (req, res) => {
  // Genera un secreto aleatorio.
  const secret = speakeasy.generateSecret();

  // Asigna un identificador único al usuario.
  let key = users.length + 1;
  // Agrega el usuario a la matriz de usuarios con su identificador y su secreto TOTP.
  users.push({ user: key, secret: secret.base32 });
  // Genera una URL de autenticación TOTP y un código QR a partir del secreto generado.
  QRCode.toDataURL(secret.otpauth_url, function (err, data_url) {
    res.json({ qrcode_url: data_url, user: key });
  });
});

// Define una ruta para verificar un código TOTP enviado por el usuario.
app.post("/verify/:userId/totpcode/:totpcode", function (req, res) {
  let serverSecret;
  let { userId, totpcode } = req.params;

  // Busca el secreto TOTP del usuario en la matriz de usuarios.
  users.forEach((item, index) => {
    userId = Number.parseInt(userId);
    totpcode = Number.parseInt(totpcode);

    if (userId === item.user) {
      serverSecret = users[index].secret;
    }
  });

  // Verifica el código TOTP enviado por el usuario con el secreto del servidor.
  let verified = speakeasy.totp.verify({
    secret: serverSecret,
    encoding: "base32",
    token: totpcode,
  });

  // Devuelve el resultado de la verificación al cliente.
  res.json(verified);
});

// Define el número de puerto en el que se ejecutará la aplicación.
const port = 5000;
// Inicia el servidor en el puerto especificado.
app.listen(port, () => console.log(`Server started on port ${port}`));
