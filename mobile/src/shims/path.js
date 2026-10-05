// "path" simplificado (só o que os arquivos compartilhados usam)
export const join = (...partes) => partes.filter(Boolean).join('/').replace(/\/+/g, '/');
export const dirname = (p) => String(p).replace(/\/[^/]*$/, '') || '/';
export const basename = (p) => String(p).split('/').pop();
export const extname = (p) => {
  const m = String(p).match(/\.[^./]*$/);
  return m ? m[0] : '';
};
export default { join, dirname, basename, extname };
