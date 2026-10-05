// Códigos do Google Cloud (projeto EletroGestor). Veja mobile/COMO-GERAR-APK.md.
// Para apps instalados (computador/celular) o Google considera que estes códigos
// não são segredos de verdade: eles só identificam o app. O acesso aos dados
// depende sempre do login do próprio usuário.
module.exports = {
  // Cliente "App para computador"
  desktopClientId: 'PREENCHER.apps.googleusercontent.com',
  desktopClientSecret: 'PREENCHER',
  // Cliente "Aplicativo da Web" (usado pelo login do Android)
  webClientId: 'PREENCHER.apps.googleusercontent.com',
  // Só pede acesso aos arquivos que o próprio EletroGestor criar no Drive
  escopos: ['openid', 'email', 'https://www.googleapis.com/auth/drive.file'],
};
