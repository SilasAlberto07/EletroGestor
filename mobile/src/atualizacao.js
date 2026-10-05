// Atualizações no celular: procura um APK mais novo nas Releases do GitHub
// (o mesmo lugar onde o instalador do computador é publicado).
import { ehCelular } from './armazenamento.js';

const REPOSITORIO = 'SilasAlberto07/EletroGestor';
const ouvintes = new Set();
let estado = { estado: 'parado' };
let linkApk = null;

function mudar(novo) {
  estado = novo;
  ouvintes.forEach((f) => f(estado));
  return estado;
}

function maisNova(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
  }
  return false;
}

export function obterEstado() {
  return estado;
}

export function aoMudar(callback) {
  ouvintes.add(callback);
  return () => ouvintes.delete(callback);
}

export async function verificar(versaoAtual) {
  if (!ehCelular()) return mudar({ estado: 'dev', mensagem: 'Atualizações só funcionam no aplicativo instalado.' });
  mudar({ estado: 'verificando' });
  try {
    const resposta = await fetch(`https://api.github.com/repos/${REPOSITORIO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!resposta.ok) throw new Error(`GitHub respondeu ${resposta.status}`);
    const release = await resposta.json();
    const versaoNova = String(release.tag_name || '').replace(/^v/, '');
    const apk = (release.assets || []).find((a) => a.name.toLowerCase().endsWith('.apk'));

    if (apk && maisNova(versaoNova, versaoAtual)) {
      linkApk = apk.browser_download_url;
      return mudar({ estado: 'pronta', versaoNova });
    }
    return mudar({ estado: 'atualizado' });
  } catch (erro) {
    console.warn('Erro ao procurar atualização', erro);
    return mudar({ estado: 'erro', mensagem: 'Não foi possível procurar atualizações. Verifique a internet.' });
  }
}

// Abre o download do APK novo no navegador do celular. Depois é só tocar no arquivo para instalar.
export function instalar() {
  if (!linkApk) throw new Error('Nenhuma atualização disponível.');
  location.href = linkApk; // o Android abre links de fora do app no navegador
  return true;
}
