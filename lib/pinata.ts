// File for handling IPFS operations with Pinata
import axios from 'axios';
import FormData from 'form-data';
import { logger } from './logger';

// Use JWT token for authentication instead of API key/secret
const JWT = process.env.NEXT_PUBLIC_PINATA_JWT || process.env.VITE_PUBILC_JWT || '';

// Alternative IPFS gateways to avoid browser blocking issues
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://ipfs.fleek.co/ipfs/'
];

// Select the first gateway by default, can be changed if one gateway is blocked
const DEFAULT_GATEWAY = IPFS_GATEWAYS[0];

export interface IPFSFile {
  cid: string;
  name: string;
  size: number;
  url: string;
}

/**
 * Uploads a file to IPFS via Pinata
 */
export async function uploadToPinata(file: File): Promise<IPFSFile> {
  logger.info("PinataService", `Uploading file to IPFS: ${file.name}`);
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const metadata = JSON.stringify({
      name: file.name,
    });
    formData.append('pinataMetadata', metadata);
    
    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', options);
    
    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
          'Authorization': `Bearer ${JWT}`
        }
      }
    );
    
    logger.info("PinataService", "File successfully uploaded to IPFS", {
      IpfsHash: res.data.IpfsHash,
      fileName: file.name
    });
    
    return {
      cid: res.data.IpfsHash,
      name: file.name,
      size: file.size,
      url: `${DEFAULT_GATEWAY}${res.data.IpfsHash}`
    };
  } catch (error) {
    logger.error("PinataService", "Error uploading to IPFS", {
      error: error instanceof Error ? error.message : String(error),
      fileName: file.name
    });
    throw new Error(`Failed to upload file to IPFS: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Gets a file from IPFS via public gateway
 */
export function getIPFSUrl(cid: string): string {
  return `${DEFAULT_GATEWAY}${cid}`;
}

/**
 * Tries different IPFS gateways if the default one is blocked
 */
export function getAlternativeIPFSUrl(cid: string, index: number = 0): string {
  const gatewayIndex = index % IPFS_GATEWAYS.length;
  return `${IPFS_GATEWAYS[gatewayIndex]}${cid}`;
}