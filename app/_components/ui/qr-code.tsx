"use server"

import React from "react";
import QRCodeStyling, {
  TypeNumber,
  Mode,
  ErrorCorrectionLevel,
  Options,
} from "qr-code-styling";

import nodeCanvas from "canvas";
import { JSDOM } from "jsdom";
import { Box } from "@radix-ui/themes";

const options: Options = {
  type: 'svg',
//   shape: "circle",
  jsdom: JSDOM,
  nodeCanvas,
  margin: 0,
  qrOptions: {
    typeNumber: 0 as TypeNumber,
    mode: 'Byte' as Mode,
    errorCorrectionLevel: 'Q' as ErrorCorrectionLevel
  },
  dotsOptions: {
    //color: 'var(--accent-track)', // var(--accent-9)
    gradient: {
        colorStops: [
            { offset: 0.4, color: 'var(--accent-track)' },
            { offset: 1, color: 'var(--accent-11)' }
        ],
        type: "linear",
        rotation: 7 
    },
    type: "extra-rounded"
  },
  backgroundOptions: {
    color: 'transparent',
  },
  cornersDotOptions: {
    type: "extra-rounded",
    color: "var(--accent-12)"
  },
  cornersSquareOptions: {
    type: "extra-rounded",
    color: "var(--accent-12)"
  }
}

export default async function QRCode({url, width, height}: {url: string, width: number | undefined, height: number | undefined}) {
    options.width = width
    options.height = height
    options.data=url
    const qrCode = new QRCodeStyling(options);
    const buffer = await qrCode.getRawData("svg")
    const svg = buffer?.toString();

    return (
        <>
        {svg ? (<Box dangerouslySetInnerHTML={{__html: svg}}/>) : null}
        </>
    );
}
