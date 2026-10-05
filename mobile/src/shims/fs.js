// "fs" de mentira: o único arquivo lido no celular é o modelo do PDF,
// que já vem embutido no app.
import TEMPLATE_PDF from '../../../src/main/modules/orcamentos/pdf/template.html';

export function readFileSync(caminho) {
  if (String(caminho).endsWith('template.html')) return TEMPLATE_PDF;
  throw new Error(`Arquivo indisponível no celular: ${caminho}`);
}
const nada = () => {
  throw new Error('Função disponível apenas no computador.');
};
export const writeFileSync = nada;
export const existsSync = () => false;
export const mkdirSync = () => {};
export const rmSync = () => {};
export default { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync };
