import { renderSVG } from "uqr";

export function pairingQrSvg(payload: string): string {
  return renderSVG(payload, {
    border: 2,
    blackColor: "#12110F",
    whiteColor: "#F3EFE7",
  });
}
