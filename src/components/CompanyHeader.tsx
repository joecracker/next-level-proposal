import React from 'react';
import { CompanyConfig } from '../types';
import { fontCss, resolveHeaderStyle } from '../lib/headerStyle';

interface CompanyHeaderProps {
  companyConfig: CompanyConfig;
}

/**
 * The company block at the top of the proposal: logo, name, then the small lines.
 * Used by both the printed sheet and the live sample on the Company & Logo screen,
 * so what you see while styling it is what prints.
 */
export const CompanyHeader: React.FC<CompanyHeaderProps> = ({ companyConfig }) => {
  const s = resolveHeaderStyle(companyConfig);
  const family = fontCss(s.nameFont);

  const contactBits = [
    companyConfig.licenseNumber,
    companyConfig.website,
    companyConfig.email,
    companyConfig.phone,
  ].filter(Boolean);

  const detail: React.CSSProperties = {
    fontFamily: family,
    fontSize: `${s.detailSizePt}pt`,
    fontWeight: s.detailBold ? 700 : 400,
    marginTop: '0.25rem',
  };

  return (
    <div className="text-center">
      {companyConfig.logoUrl ? (
        <div className="flex justify-center mb-4">
          <img
            src={companyConfig.logoUrl}
            alt={companyConfig.companyName}
            className="object-contain"
            style={{ height: `${s.logoHeightPx}px`, width: 'auto', maxWidth: '100%' }}
            referrerPolicy="no-referrer"
          />
        </div>
      ) : null}

      <p
        style={{
          fontFamily: family,
          fontSize: `${s.nameSizePt}pt`,
          fontWeight: s.nameBold ? 700 : 400,
          fontStyle: s.nameItalic ? 'italic' : 'normal',
          lineHeight: 1.15,
        }}
      >
        {companyConfig.companyName || 'Contractor'}
      </p>
      {companyConfig.tagline && <p style={detail}>{companyConfig.tagline}</p>}
      {contactBits.length > 0 && <p style={detail}>{contactBits.join('   ')}</p>}
      {companyConfig.address && <p style={detail}>{companyConfig.address}</p>}
    </div>
  );
};