/* eslint-disable prefer-template, no-useless-escape */
module.exports = url => {
  const { protocol: reqProtocol, host: reqDomain, pathname: reqPath } = new URL(url);

  return INSTALL_OPTIONS.ROUTES.map(r => {
    const { protocol: refProtocol, host, pathname: refPath } = new URL(r);
    const refDomain = host.replace('%2A', '*');
    const protocolMatch = reqProtocol === refProtocol;
    let domainMatch;
    let pathMatch;

    if (isWildcard(refDomain)) {
      const cleanedDomain = refDomain.split(/\*\./g)[1];
      const refRegex = new RegExp('.+?(?=.\\' + cleanedDomain + ')', 'gi');

      domainMatch = refRegex.test(reqDomain);
    } else {
      domainMatch = pathTest(reqDomain, refDomain);
    }

    if (isWildcard(refPath)) {
      const [nonOptionalPath] = refPath.replace(/\//g, '\\/').split(/\*/);
      const refRegex = new RegExp('(?=' + nonOptionalPath + ')[^\\]]+', 'gi');

      pathMatch = refRegex.test(reqPath);
    } else if (
      (refPath.length === 1 && reqPath.length === 1) ||
      (refPath.length === reqPath.length && pathTest(reqPath, refPath))
    ) {
      pathMatch = true;
    }

    return protocolMatch && domainMatch && pathMatch;
  }).some(e => e);
};

function isWildcard(str) {
  return RegExp(/\*/g).test(str);
}

function pathTest(req, ref) {
  return new RegExp(ref, 'gi').test(req);
}
