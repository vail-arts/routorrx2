export default function StreetPlate(){
  const path="M48 240 H126 Q142 240 142 224 V190 Q142 174 158 174 H218 Q234 174 234 158 V108 Q234 92 250 92 H308";
  return <figure className="street-plate">
    <div className="plate-edge"><span>ROUTORRX / FIELD ATLAS</span><span>PLATE 01</span></div>
    <svg viewBox="0 0 360 300" role="img" aria-label="Illustrated pedestrian route through a street grid">
      <defs><pattern id="blocks" width="46" height="42" patternTransform="rotate(-12)" patternUnits="userSpaceOnUse"><rect x="3" y="3" width="38" height="34" rx="5" fill="#323232" stroke="#4b4b4b"/></pattern></defs>
      <rect width="360" height="300" rx="18" fill="url(#blocks)"/>
      <path d="M-15 45 Q72 124 158 65 T380 72" fill="none" stroke="#8a8a8a" opacity=".38" strokeWidth="18"/>
      <path d={path} fill="none" stroke="#151515" strokeWidth="17" strokeLinecap="round"/>
      <path d={path} className="plate-trace" fill="none" stroke="#e9e9e9" strokeWidth="4" strokeLinecap="round" pathLength="1"/>
      <circle cx="48" cy="240" r="8" fill="#e2e2e2"/><circle cx="308" cy="92" r="9" fill="#1e1e1e" stroke="#e2e2e2" strokeWidth="3"/>
      <g fill="#fff" fontSize="11" fontFamily="monospace"><text x="32" y="269">START</text><text x="278" y="73">ARRIVE</text></g>
    </svg><div className="plate-edge"><span>SILVASSA / WALKING STUDY</span><span>ILLUSTRATION</span></div>
  </figure>;
}
