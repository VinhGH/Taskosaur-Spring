import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  includeMargin?: boolean;
}

export default function QRCodeDisplay({
  value,
  size = 180,
  includeMargin = true,
}: QRCodeDisplayProps) {
  if (!value) return null;

  return (
    <div className="flex items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        includeMargin={includeMargin}
        className="rounded-md"
      />
    </div>
  );
}
