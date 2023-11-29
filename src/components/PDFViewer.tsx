import React from 'react';
import { Helmet } from 'react-helmet';

type Props = {pdf_url: string}

const PDFViewer = ({pdf_url}: Props) => {
  return (
    <>
      {/* <Helmet> */}
      {/* <meta http-equiv="Content-Security-Policy" content="default-src *; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'"/> */}

      {/* </Helmet> */}
      {/* This iframe is still causing issues - might be a security thing with google */}
        <iframe src={`https://docs.google.com/gview?url=${pdf_url}&embedded=true`} className='w-full h-full'>
        </iframe>
    </>
  )
}

export default PDFViewer