import { statusTypes } from '@neoncoder/typed-service-response';
import axios from 'axios';
import http from 'http';
// import net from 'net';
import fs from 'fs';
import { Request, Response } from 'express';
import { extractAttrFromHTML } from '../utils/helpers/serializers';
import { TCPClientFactory } from '../lib/tcpClient';

export const defaultHanlder = async (req: Request, res: Response) => {
  const sr = statusTypes.get('OK')!({ message: 'Default controller' });
  return res.status(sr.statusCode).send(sr);
};

export const notFoundHandler = async (req: Request, res: Response) => {
  const sr = statusTypes.get('NotFound')!({});
  return res.status(sr.statusCode).send(sr);
};

export const parseTestHandler = async (_: Request, res: Response) => {
  // TODO: store & retrieve device data (IP location etc)
  // TODO: store file details on download
  // TODO: process files on download (process queue)
  const { data: html } = await axios.get('http://192.168.1.71/internal/EMF');

  const hrefs: string[] = extractAttrFromHTML({ html });

  const filePaths = hrefs.filter((_, i) => i > 0).map((y) => `http://192.168.1.71/internal/EMF/${y}`);

  const results = (await Promise.all(filePaths.map(async (x) => await axios.get(x)))).map(({ data }) =>
    extractAttrFromHTML({ html: data }),
  );

  const fileNames = results.map((x, i) => `${filePaths[i]}${x[1]}`);

  // const { data: htmlInternal } = await axios.get(filePaths[0]);
  fileNames.forEach(async (fn) => {
    const temp = fn.split('/');
    const destination = temp[temp.length - 1];
    const file = fs.createWriteStream(destination);
    http
      .get(fn, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          console.log('File downloaded successfully');
        });
      })
      .on('error', (err) => {
        fs.unlink(destination, () => {
          console.error('Error downloading file:', err);
        });
      });
  });
  console.log(hrefs);
  const sr = statusTypes.get('OK')!({ data: { fileNames } });
  return res.status(sr.statusCode).send(sr);
};

export const tcpConnectionTestHandler = async (req: Request, res: Response) => {
  const { s } = req.query;
  console.log({ s });
  const tcpClient = TCPClientFactory.createTCPClient({});
  tcpClient.on('data', (data) => {
    console.log('Received: ' + data);
    tcpClient.destroy(); // kill client after server's response
  });
  // tcpClient.write('*IDN?\n');
  tcpClient.write(s ? `${String(s).toUpperCase()}\n` : 'No message sent', (err) => {
    console.log({ err });
  });
  // tcpClient.write('NewMessage');
  // tcpClient.write('AnotherMessage');
  // tcpClient.write('Final Message');
  tcpClient.end(() => {
    console.log('Ending Message');
  });
  const sr = statusTypes.get('OK')!<'client'>({});
  res.status(sr.statusCode).send(sr);
  // await tcpClient.destroy();
};
