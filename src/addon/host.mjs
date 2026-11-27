// 씬북+ · 추가 기능이 원본 index.js 안의 함수를 빌려 쓰기 위한 연결점입니다.
// index.js의 initialize()에서 connect({...})로 한 번 채웁니다.
export const host={};
export function connect(parts){Object.assign(host,parts);}
