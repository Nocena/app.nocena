// pages/api/filcdn/chunked-upload.ts - COMPLETE WITH ALL DEBUGGING
import { NextApiRequest, NextApiResponse } from 'next';
import { Synapse, CONTRACT_ADDRESSES, PandoraService } from '@filoz/synapse-sdk';
import { ethers } from 'ethers';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const config = {
  api: { bodyParser: false },
};

const PROOF_SET_CREATION_FEE = BigInt(0.1 * 10 ** 18);
const filcdnConfig = {
  storageCapacity: 10,
  persistencePeriod: 30,
  minDaysThreshold: 10,
  withCDN: true,
};

interface ChunkUploadState {
  sessionId: string;
  totalChunks: number;
  uploadedChunks: number;
  tempDir: string;
  fileName: string;
  totalSize: number;
  originalHash?: string;
  chunkHashes: string[];
}

const uploadSessions: Map<string, ChunkUploadState> = new Map();

// Performance tracking utility
class PerformanceTracker {
  private startTime: number;
  private lastCheckpoint: number;
  private logs: Array<{ step: string; timeMs: number; totalMs: number }> = [];

  constructor() {
    this.startTime = Date.now();
    this.lastCheckpoint = this.startTime;
  }

  checkpoint(stepName: string) {
    const now = Date.now();
    const stepTime = now - this.lastCheckpoint;
    const totalTime = now - this.startTime;

    this.logs.push({
      step: stepName,
      timeMs: stepTime,
      totalMs: totalTime,
    });

    console.log(`🔍 [${totalTime}ms] ${stepName}: +${stepTime}ms`);
    this.lastCheckpoint = now;
  }

  getLogs() {
    return this.logs;
  }

  getTotalTime() {
    return Date.now() - this.startTime;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const tracker = new PerformanceTracker();
  tracker.checkpoint('API handler started');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    tracker.checkpoint('Starting form parsing');

    const form = formidable({
      maxFileSize: 4 * 1024 * 1024, // 4MB chunks
      uploadDir: '/tmp',
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    tracker.checkpoint('Form parsing completed');

    const chunkFile = Array.isArray(files.chunk) ? files.chunk[0] : files.chunk;
    const sessionId = Array.isArray(fields.sessionId) ? fields.sessionId[0] : fields.sessionId;
    const chunkIndex = parseInt(Array.isArray(fields.chunkIndex) ? fields.chunkIndex[0] : fields.chunkIndex || '0');
    const totalChunks = parseInt(Array.isArray(fields.totalChunks) ? fields.totalChunks[0] : fields.totalChunks || '1');
    const fileName = Array.isArray(fields.fileName) ? fields.fileName[0] : fields.fileName;
    const totalSize = parseInt(Array.isArray(fields.totalSize) ? fields.totalSize[0] : fields.totalSize || '0');
    const originalHash = Array.isArray(fields.originalHash) ? fields.originalHash[0] : fields.originalHash;

    if (!chunkFile || !sessionId) {
      return res.status(400).json({ error: 'Missing chunk or session ID' });
    }

    tracker.checkpoint('Field extraction completed');
    console.log(`📦 Received chunk ${chunkIndex}/${totalChunks} for session ${sessionId}`);
    console.log(`📄 File: ${fileName}, Total size: ${totalSize} bytes`);

    let session = uploadSessions.get(sessionId);
    if (!session) {
      const tempDir = path.join('/tmp', sessionId);
      fs.mkdirSync(tempDir, { recursive: true });

      session = {
        sessionId,
        totalChunks,
        uploadedChunks: 0,
        tempDir,
        fileName: fileName || 'unknown',
        totalSize,
        originalHash,
        chunkHashes: new Array(totalChunks).fill(''),
      };
      uploadSessions.set(sessionId, session);
      tracker.checkpoint('New session created');
      console.log(`🆕 Created new session in ${tempDir}`);
    } else {
      tracker.checkpoint('Existing session found');
      console.log(`🔄 Using existing session in ${session.tempDir}`);
    }

    // ENHANCED CHUNK VALIDATION AND SAVING
    const chunkPath = path.join(session.tempDir, `chunk_${chunkIndex}`);

    // Check original chunk file stats
    const originalChunkStats = fs.statSync(chunkFile.filepath);
    console.log(`📊 Original chunk ${chunkIndex} stats: ${originalChunkStats.size} bytes`);

    // Validate chunk index
    if (chunkIndex >= totalChunks || chunkIndex < 0) {
      throw new Error(`Invalid chunk index ${chunkIndex} (should be 0-${totalChunks - 1})`);
    }

    // Check for duplicate chunks
    if (fs.existsSync(chunkPath)) {
      console.warn(`⚠️ Chunk ${chunkIndex} already exists, overwriting`);
      fs.unlinkSync(chunkPath);
    }

    // Read chunk data for validation
    const chunkData = fs.readFileSync(chunkFile.filepath);
    const chunkHash = crypto.createHash('md5').update(chunkData).digest('hex');
    console.log(`🔐 Chunk ${chunkIndex} hash: ${chunkHash} (${chunkData.length} bytes)`);

    // Save chunk with validation
    fs.writeFileSync(chunkPath, chunkData);
    fs.unlinkSync(chunkFile.filepath);

    // Verify chunk was saved correctly
    const savedChunkData = fs.readFileSync(chunkPath);
    const savedChunkHash = crypto.createHash('md5').update(savedChunkData).digest('hex');

    if (savedChunkHash !== chunkHash) {
      throw new Error(`Chunk ${chunkIndex} corruption detected! Original: ${chunkHash}, Saved: ${savedChunkHash}`);
    }

    if (savedChunkData.length !== chunkData.length) {
      throw new Error(
        `Chunk ${chunkIndex} size mismatch! Original: ${chunkData.length}, Saved: ${savedChunkData.length}`,
      );
    }

    // Store chunk hash for later verification
    session.chunkHashes[chunkIndex] = chunkHash;

    console.log(`✅ Chunk ${chunkIndex} saved and verified successfully`);
    tracker.checkpoint(`Chunk ${chunkIndex} saved and verified`);

    session.uploadedChunks++;

    // COMPLETION CHECK WITH FULL VALIDATION
    if (session.uploadedChunks === session.totalChunks) {
      tracker.checkpoint('All chunks received - starting validation');
      console.log(`🎯 All ${session.totalChunks} chunks received! Starting validation...`);

      // Verify all chunks exist and get total size
      let totalChunkSize = 0;
      const chunkSizes: number[] = [];

      for (let i = 0; i < session.totalChunks; i++) {
        const chunkPath = path.join(session.tempDir, `chunk_${i}`);

        if (!fs.existsSync(chunkPath)) {
          throw new Error(`❌ Missing chunk ${i} at ${chunkPath}`);
        }

        const chunkStats = fs.statSync(chunkPath);
        const chunkData = fs.readFileSync(chunkPath);
        const chunkHash = crypto.createHash('md5').update(chunkData).digest('hex');

        chunkSizes.push(chunkStats.size);
        totalChunkSize += chunkStats.size;

        console.log(`✅ Chunk ${i}: ${chunkStats.size} bytes, hash: ${chunkHash}`);

        // Verify stored hash matches
        if (session.chunkHashes[i] && session.chunkHashes[i] !== chunkHash) {
          console.error(`❌ Chunk ${i} hash mismatch! Expected: ${session.chunkHashes[i]}, Got: ${chunkHash}`);
        }
      }

      console.log(`📊 Chunk size breakdown: [${chunkSizes.join(', ')}]`);
      console.log(`📊 Total chunk size: ${totalChunkSize} bytes`);
      console.log(`📊 Expected total size: ${session.totalSize} bytes`);
      console.log(`📊 Size difference: ${totalChunkSize - session.totalSize} bytes`);

      // Size validation with tolerance
      const sizeDifference = Math.abs(totalChunkSize - session.totalSize);
      if (sizeDifference > 0) {
        console.warn(`⚠️ Size discrepancy detected: ${sizeDifference} bytes`);
        if (sizeDifference > 1024) {
          console.error(`❌ Large size discrepancy: ${sizeDifference} bytes - this may indicate corruption`);
        }
      }

      tracker.checkpoint('Chunk validation completed - starting reassembly');

      const result = await reassembleAndUploadToFilecoin(session, tracker);

      // Keep temp directory for debugging (comment out the cleanup)
      console.log(`🔍 DEBUGGING: Keeping temp directory: ${session.tempDir}`);
      console.log(`🔍 DEBUGGING: You can inspect chunks and reassembled file manually`);
      // fs.rmSync(session.tempDir, { recursive: true, force: true });

      uploadSessions.delete(sessionId);
      tracker.checkpoint('Upload process completed');

      const totalTime = tracker.getTotalTime();
      console.log(`🏁 TOTAL UPLOAD TIME: ${totalTime}ms`);
      console.log('📊 Performance breakdown:', tracker.getLogs());

      return res.status(200).json({
        success: true,
        complete: true,
        data: result,
        performanceLogs: tracker.getLogs(),
        totalTimeMs: totalTime,
        debugInfo: {
          tempDir: session.tempDir,
          totalChunkSize,
          expectedSize: session.totalSize,
          sizeDifference: sizeDifference,
          chunkSizes,
          chunkHashes: session.chunkHashes,
        },
      });
    } else {
      tracker.checkpoint(`Chunk ${chunkIndex} processed - waiting for more chunks`);
      console.log(`⏳ Waiting for more chunks: ${session.uploadedChunks}/${session.totalChunks} received`);

      return res.status(200).json({
        success: true,
        complete: false,
        progress: (session.uploadedChunks / session.totalChunks) * 100,
        uploadedChunks: session.uploadedChunks,
        totalChunks: session.totalChunks,
        chunkSize: savedChunkData.length,
        chunkHash: chunkHash,
      });
    }
  } catch (error) {
    console.error('❌ Chunk upload failed:', error);
    tracker.checkpoint('ERROR occurred');

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
      performanceLogs: tracker.getLogs(),
    });
  }
}

async function reassembleAndUploadToFilecoin(session: ChunkUploadState, tracker: PerformanceTracker) {
  console.log('🔧 Starting file reassembly with comprehensive validation...');
  tracker.checkpoint('File reassembly started');

  const finalFilePath = path.join(session.tempDir, 'complete_file');
  const debugFilePath = path.join(session.tempDir, `debug_${session.fileName}`);

  console.log(`📁 Reassembling to: ${finalFilePath}`);
  console.log(`🔍 Debug copy will be saved to: ${debugFilePath}`);

  // Method 1: Stream-based reassembly (your original method)
  console.log('🔄 Method 1: Stream-based reassembly...');
  const writeStream = fs.createWriteStream(finalFilePath);
  let streamBytesWritten = 0;

  for (let i = 0; i < session.totalChunks; i++) {
    const chunkPath = path.join(session.tempDir, `chunk_${i}`);

    if (!fs.existsSync(chunkPath)) {
      throw new Error(`❌ Missing chunk ${i} during reassembly`);
    }

    const chunkData = fs.readFileSync(chunkPath);
    console.log(
      `📦 Writing chunk ${i}: ${chunkData.length} bytes (cumulative: ${streamBytesWritten + chunkData.length})`,
    );

    writeStream.write(chunkData);
    streamBytesWritten += chunkData.length;
  }

  writeStream.end();

  // Wait for stream completion
  await new Promise<void>((resolve, reject) => {
    writeStream.on('finish', () => {
      console.log(`✅ Stream completed, ${streamBytesWritten} bytes written`);
      resolve();
    });
    writeStream.on('error', reject);
  });

  tracker.checkpoint('Stream-based reassembly completed');

  // Method 2: Buffer-based reassembly (for comparison)
  console.log('🔄 Method 2: Buffer-based reassembly for comparison...');
  const chunks: Buffer[] = [];
  let bufferTotalSize = 0;

  for (let i = 0; i < session.totalChunks; i++) {
    const chunkPath = path.join(session.tempDir, `chunk_${i}`);
    const chunkData = fs.readFileSync(chunkPath);
    chunks.push(chunkData);
    bufferTotalSize += chunkData.length;
    console.log(`📦 Buffer chunk ${i}: ${chunkData.length} bytes`);
  }

  const concatenatedBuffer = Buffer.concat(chunks);
  fs.writeFileSync(debugFilePath, concatenatedBuffer);

  console.log(`📊 Buffer method total: ${bufferTotalSize} bytes`);
  console.log(`📊 Concatenated buffer size: ${concatenatedBuffer.length} bytes`);
  tracker.checkpoint('Buffer-based reassembly completed');

  // File validation
  const streamFileStats = fs.statSync(finalFilePath);
  const bufferFileStats = fs.statSync(debugFilePath);

  console.log(`📊 Stream file size: ${streamFileStats.size} bytes`);
  console.log(`📊 Buffer file size: ${bufferFileStats.size} bytes`);
  console.log(`📊 Expected size: ${session.totalSize} bytes`);

  // Compare the two methods
  const streamFileData = fs.readFileSync(finalFilePath);
  const bufferFileData = fs.readFileSync(debugFilePath);

  const streamHash = crypto.createHash('md5').update(streamFileData).digest('hex');
  const bufferHash = crypto.createHash('md5').update(bufferFileData).digest('hex');

  console.log(`🔐 Stream file hash: ${streamHash}`);
  console.log(`🔐 Buffer file hash: ${bufferHash}`);

  if (streamHash !== bufferHash) {
    console.error(`❌ CRITICAL: Stream and buffer methods produced different results!`);
    console.error(`Stream: ${streamFileData.length} bytes, hash: ${streamHash}`);
    console.error(`Buffer: ${bufferFileData.length} bytes, hash: ${bufferHash}`);
  } else {
    console.log(`✅ Both reassembly methods produced identical results`);
  }

  // Use the buffer method result (more reliable)
  const completeFileBuffer = bufferFileData;

  // Integrity checks
  if (completeFileBuffer.length !== session.totalSize) {
    console.warn(`⚠️ Size mismatch! Expected: ${session.totalSize}, Got: ${completeFileBuffer.length}`);
  }

  // File type validation
  if (session.fileName.toLowerCase().includes('.png')) {
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    const fileHeader = Array.from(completeFileBuffer.subarray(0, 8));

    console.log(`🖼️ PNG signature check:`);
    console.log(`Expected: ${pngSignature.map((b) => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);
    console.log(`Got:      ${fileHeader.map((b) => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);

    const isValidPNG = pngSignature.every((byte, index) => fileHeader[index] === byte);
    if (isValidPNG) {
      console.log(`✅ Valid PNG signature detected`);
    } else {
      console.error(`❌ Invalid PNG signature - file is corrupted!`);
    }
  }

  // Create final Uint8Array
  const uint8ArrayBytes = new Uint8Array(completeFileBuffer);
  console.log(`📁 Final file prepared: ${uint8ArrayBytes.length} bytes`);
  tracker.checkpoint('File validation and conversion completed');

  // Environment validation
  if (!process.env.FILECOIN_PRIVATE_KEY) {
    throw new Error('FILECOIN_PRIVATE_KEY environment variable not set');
  }
  if (!process.env.FILECOIN_RPC_URL) {
    throw new Error('FILECOIN_RPC_URL environment variable not set');
  }
  tracker.checkpoint('Environment variables validated');

  console.log('🌐 Creating provider and signer...');
  const provider = new ethers.JsonRpcProvider(process.env.FILECOIN_RPC_URL);
  tracker.checkpoint('JsonRpcProvider created');

  const signer = new ethers.Wallet(process.env.FILECOIN_PRIVATE_KEY, provider);
  tracker.checkpoint('Wallet signer created');

  console.log(`💰 Wallet address: ${signer.address}`);

  if (!signer.provider) {
    throw new Error('Provider not found on signer');
  }
  tracker.checkpoint('Signer validation completed');

  console.log('⚡ Creating Synapse instance...');
  let synapse;
  try {
    const synapseStartTime = Date.now();
    synapse = await Synapse.create({
      signer,
      disableNonceManager: false,
    });
    const synapseTime = Date.now() - synapseStartTime;
    console.log(`✅ Synapse instance created successfully in ${synapseTime}ms`);
    tracker.checkpoint('Synapse instance created');
  } catch (synapseError) {
    console.error('❌ Failed to create Synapse instance:', synapseError);
    tracker.checkpoint('Synapse creation FAILED');
    throw new Error(
      `Failed to create Synapse instance: ${synapseError instanceof Error ? synapseError.message : 'Unknown error'}`,
    );
  }

  console.log('🔍 Getting proof set...');
  try {
    const proofSetStartTime = Date.now();
    const { providerId } = await getProofsetServerSide(signer, 'calibration', signer.address, tracker);
    const proofSetTime = Date.now() - proofSetStartTime;
    console.log(`📋 Provider ID: ${providerId} (retrieved in ${proofSetTime}ms)`);
    tracker.checkpoint('Proof set retrieved');

    if (!providerId) {
      throw new Error('No proof set found. Please set up storage through FilCDN app first.');
    }

    console.log('🔍 Running preflight check...');
    const preflightStartTime = Date.now();
    await preflightCheckServerSide(session.totalSize, synapse, 'calibration', !providerId, tracker);
    const preflightTime = Date.now() - preflightStartTime;
    console.log(`✅ Preflight check completed in ${preflightTime}ms`);
    tracker.checkpoint('Preflight check completed');

    console.log('🏗️ Creating storage service...');
    const storageServiceStartTime = Date.now();
    const storageService = await synapse.createStorage({
      providerId,
      withCDN: filcdnConfig.withCDN,
    });
    const storageServiceTime = Date.now() - storageServiceStartTime;
    console.log(`🏭 Storage service created in ${storageServiceTime}ms`);
    tracker.checkpoint('Storage service created');

    console.log('🚀 Uploading to Filecoin...');
    console.log(`📊 Upload details:`);
    console.log(`  - File: ${session.fileName}`);
    console.log(`  - Size: ${uint8ArrayBytes.length} bytes`);
    console.log(`  - Hash: ${crypto.createHash('md5').update(uint8ArrayBytes).digest('hex')}`);

    const uploadStartTime = Date.now();
    const { commp } = await storageService.upload(uint8ArrayBytes);
    const uploadTime = Date.now() - uploadStartTime;
    console.log(`🎉 Upload successful! COMMP: ${commp} (uploaded in ${uploadTime}ms)`);
    tracker.checkpoint('Filecoin upload completed');

    return {
      fileName: session.fileName,
      fileSize: session.totalSize,
      commp: commp.toString(),
      debugInfo: {
        streamFileSize: streamFileStats.size,
        bufferFileSize: bufferFileStats.size,
        streamHash,
        bufferHash,
        finalHash: crypto.createHash('md5').update(uint8ArrayBytes).digest('hex'),
        tempDir: session.tempDir,
        debugFilePath,
      },
    };
  } catch (error) {
    console.error('❌ Error during proof set/upload process:', error);
    tracker.checkpoint('Upload process FAILED');
    throw error;
  }
}

async function getProofsetServerSide(
  signer: ethers.Wallet,
  network: 'mainnet' | 'calibration',
  address: string,
  tracker: PerformanceTracker,
) {
  if (!signer.provider) {
    throw new Error('Provider not found on signer');
  }

  tracker.checkpoint('Creating PandoraService');
  const pandoraService = new PandoraService(signer.provider, CONTRACT_ADDRESSES.PANDORA_SERVICE[network]);
  tracker.checkpoint('PandoraService created');

  console.log('📡 Fetching client proof sets...');
  const proofSetsStartTime = Date.now();
  const AllproofSets = await pandoraService.getClientProofSetsWithDetails(address);
  const proofSetsTime = Date.now() - proofSetsStartTime;
  console.log(`📊 Retrieved ${AllproofSets.length} proof sets in ${proofSetsTime}ms`);
  tracker.checkpoint('Client proof sets fetched');

  const proofSetsWithCDN = AllproofSets.filter((proofSet) => proofSet.withCDN);
  const proofSetsWithoutCDN = AllproofSets.filter((proofSet) => !proofSet.withCDN);
  const proofSets = filcdnConfig.withCDN ? proofSetsWithCDN : proofSetsWithoutCDN;
  tracker.checkpoint('Proof sets filtered');

  let providerId;
  let bestProofset;

  try {
    bestProofset = proofSets.reduce((max, proofSet) => {
      return proofSet.currentRootCount > max.currentRootCount ? proofSet : max;
    }, proofSets[0]);
    tracker.checkpoint('Best proof set selected');

    if (bestProofset) {
      const providerIdStartTime = Date.now();
      providerId = await pandoraService.getProviderIdByAddress(bestProofset.payee);
      const providerIdTime = Date.now() - providerIdStartTime;
      console.log(`🆔 Provider ID retrieved in ${providerIdTime}ms`);
      tracker.checkpoint('Provider ID retrieved');
    }
  } catch (error) {
    console.error('❌ Error getting providerId', error);
    tracker.checkpoint('Provider ID retrieval FAILED');
  }

  return { providerId, proofset: bestProofset };
}

async function preflightCheckServerSide(
  fileSize: number,
  synapse: Synapse,
  network: 'mainnet' | 'calibration',
  withProofset: boolean,
  tracker: PerformanceTracker,
) {
  const signer = synapse.getSigner();
  if (!signer) throw new Error('Signer not found');
  if (!signer.provider) throw new Error('Provider not found');

  tracker.checkpoint('Preflight setup completed');

  const pandoraService = new PandoraService(signer.provider, CONTRACT_ADDRESSES.PANDORA_SERVICE[network]);
  tracker.checkpoint('PandoraService for preflight created');

  console.log('💰 Checking allowance for storage...');
  const allowanceStartTime = Date.now();
  const preflight = await pandoraService.checkAllowanceForStorage(fileSize, filcdnConfig.withCDN, synapse.payments);
  const allowanceTime = Date.now() - allowanceStartTime;
  console.log(`💰 Allowance check completed in ${allowanceTime}ms - Sufficient: ${preflight.sufficient}`);
  tracker.checkpoint('Storage allowance checked');

  if (!preflight.sufficient) {
    console.log('💸 Insufficient allowance - making deposit and approval...');

    const proofSetCreationFee = withProofset ? PROOF_SET_CREATION_FEE : BigInt(0);
    const allowanceNeeded = preflight.lockupAllowanceNeeded + proofSetCreationFee;
    tracker.checkpoint('Allowance calculation completed');

    const depositStartTime = Date.now();
    await synapse.payments.deposit(allowanceNeeded);
    const depositTime = Date.now() - depositStartTime;
    console.log(`💰 Deposit completed in ${depositTime}ms`);
    tracker.checkpoint('Payment deposit completed');

    const approvalStartTime = Date.now();
    const pandoraAddress = CONTRACT_ADDRESSES.PANDORA_SERVICE[network];
    await synapse.payments.approveService(pandoraAddress, preflight.rateAllowanceNeeded, allowanceNeeded);
    const approvalTime = Date.now() - approvalStartTime;
    console.log(`✅ Service approval completed in ${approvalTime}ms`);
    tracker.checkpoint('Service approval completed');
  } else {
    console.log('✅ Sufficient allowance already exists');
    tracker.checkpoint('Sufficient allowance confirmed');
  }
}
