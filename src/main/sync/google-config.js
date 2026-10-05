// Códigos do Google Cloud (projeto EletroGestor). Veja mobile/COMO-GERAR-APK.md.
// Para apps instalados (computador/celular) o Google considera que estes códigos
// não são segredos de verdade: eles só identificam o app. O acesso aos dados
// depende sempre do login do próprio usuário.
module.exports = {
  // Cliente "App para computador"
  desktopClientId: '362696230212-g093b9bbrfjvglp8jgdm7rsle614gn1m.apps.googleusercontent.com',
  desktopClientSecret: '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',
  // Cliente "Aplicativo da Web" (usado pelo login do Android)
  webClientId: '362696230212-84f1vqtv0du7k38hoo65aoeg5fo878n1.apps.googleusercontent.com',
  // Só pede acesso aos arquivos que o próprio EletroGestor criar no Drive
  escopos: ['openid', 'email', 'https://www.googleapis.com/auth/drive.file'],
};
