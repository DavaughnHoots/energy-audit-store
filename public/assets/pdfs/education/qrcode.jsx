import { QRCodeSVG } from 'qrcode.react';

const QRCode = ({ url, size = 100 }) => {
  return (
    <div className="qr-code">
      <QRCodeSVG 
        value={url}
        size={size}
        bgColor={"#ffffff"}
        fgColor={"#000000"}
        level={"L"}
        includeMargin={false}
      />
    </div>
  );
};

export default QRCode;