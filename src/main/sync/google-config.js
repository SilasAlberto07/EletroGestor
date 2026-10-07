// Códigos do Google Cloud (projeto EletroGestor). Veja mobile/COMO-GERAR-APK.md.
// Os IDs abaixo só identificam o app e podem ficar no código.
// A chave secreta do cliente "App para computador" NÃO fica aqui: ela vem do secret
// GOOGLE_CLIENT_SECRET do GitHub e é gravada em google-segredo.js na hora de publicar.
module.exports = {
  // Cliente "App para computador"
  desktopClientId: '362696230212-g093b9bbrfjvglp8jgdm7rsle614gn1m.apps.googleusercontent.com',
  // Cliente "Aplicativo da Web" (usado pelo login do Android)
  webClientId: '362696230212-84f1vqtv0du7k38hoo65aoeg5fo878n1.apps.googleusercontent.com',
  // Só pede acesso aos arquivos que o próprio EletroGestor criar no Drive
  escopos: ['openid', 'email', 'https://www.googleapis.com/auth/drive.file'],
};
