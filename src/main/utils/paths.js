// Caminhos onde o sistema guarda arquivos.
// O banco fica na pasta de dados do usuário (não se perde ao atualizar o programa).
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

function pastaDados() {
  return app.getPath('userData');
}

function caminhoBanco() {
  return path.join(pastaDados(), 'eletrogestor.db');
}

function pastaPdfs() {
  const pasta = path.join(app.getPath('documents'), 'EletroGestor', 'Orcamentos');
  fs.mkdirSync(pasta, { recursive: true });
  return pasta;
}

module.exports = { pastaDados, caminhoBanco, pastaPdfs };
