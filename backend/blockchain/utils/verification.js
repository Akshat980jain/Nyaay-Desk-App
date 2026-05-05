const supabase = require('../../supabaseClient');
const { cryptoService } = require('./crypto');
const ipfsService = require('../services/ipfsService');
const auditService = require('../services/auditService');

const verifyBlock = (block, previousBlock, secret, difficulty) => {
  if (block.index !== previousBlock.index + 1) {
    return { valid: false, error: 'Invalid block index', layer: 'HASH_CHAIN', severity: 'CRITICAL' };
  }

  const pHash = previousBlock.hash || previousBlock.stored_hash;
  if (block.previousHash !== pHash && block.previous_hash !== pHash) {
    return { valid: false, error: 'Invalid previous hash - chain broken', layer: 'HASH_CHAIN', severity: 'CRITICAL' };
  }

  const calculatedHash = block.merkleRoot 
    ? cryptoService.calculateHashWithMerkle(block.index, block.previousHash || block.previous_hash, block.timestamp, block.data, block.nonce, secret, block.merkleRoot)
    : cryptoService.calculateHash(block.index, block.previousHash || block.previous_hash, block.timestamp, block.data, block.nonce, secret);

  if (block.hash !== calculatedHash) {
    return { valid: false, error: 'Block hash mismatch - data tampered', layer: 'HASH_CHAIN', severity: 'CRITICAL', details: { stored: block.hash, calculated: calculatedHash } };
  }

  const requiredPrefix = '0'.repeat(difficulty);
  if (!block.hash.startsWith(requiredPrefix)) {
    return { valid: false, error: 'Hash does not meet difficulty requirement', layer: 'HASH_CHAIN', severity: 'HIGH' };
  }

  return { valid: true, layer: 'HASH_CHAIN' };
};

const verifyMerkleRoot = (block) => {
  if (!block.merkleRoot && !block.merkle_root) {
    return { valid: false, error: 'Block missing merkle root', layer: 'MERKLE_TREE', severity: 'MEDIUM', note: 'Old block format' };
  }
  try {
    const calculatedMerkleRoot = cryptoService.createMerkleRoot(block.data);
    if ((block.merkleRoot || block.merkle_root) !== calculatedMerkleRoot) {
      return { valid: false, error: 'Merkle root mismatch', layer: 'MERKLE_TREE', severity: 'CRITICAL' };
    }
    return { valid: true, layer: 'MERKLE_TREE' };
  } catch (error) {
    return { valid: false, error: `Merkle verification failed: ${error.message}`, layer: 'MERKLE_TREE', severity: 'HIGH' };
  }
};

const verifyDigitalSignature = (block) => {
  if (!block.signature || !block.signature.value) {
    return { valid: false, error: 'Block not signed', layer: 'DIGITAL_SIGNATURE', severity: 'MEDIUM' };
  }
  try {
    const signatureCheck = cryptoService.verifySignature({
        ...block,
        previousHash: block.previousHash || block.previous_hash,
        merkleRoot: block.merkleRoot || block.merkle_root,
        timestamp: new Date(block.timestamp)
    }, block.signature.value);
    if (!signatureCheck.valid) {
      return { valid: false, error: 'Digital signature invalid', layer: 'DIGITAL_SIGNATURE', severity: 'CRITICAL', details: signatureCheck };
    }
    return { valid: true, layer: 'DIGITAL_SIGNATURE' };
  } catch (error) {
    return { valid: false, error: `Signature verification failed: ${error.message}`, layer: 'DIGITAL_SIGNATURE', severity: 'HIGH' };
  }
};

const verifyIPFSAnchor = async (block) => {
  if (!block.ipfs || !block.ipfs.cid) {
    return { valid: false, error: 'Block not anchored to IPFS', layer: 'IPFS_ANCHOR', severity: 'MEDIUM' };
  }
  try {
    const ipfsVerification = await ipfsService.verifyBlockAgainstIPFS({ ...block, previousHash: block.previous_hash });
    if (!ipfsVerification.verified) {
      return { valid: false, error: ipfsVerification.error || 'IPFS anchor mismatch', layer: 'IPFS_ANCHOR', severity: 'CRITICAL' };
    }
    return { valid: true, layer: 'IPFS_ANCHOR', ipfsCid: block.ipfs.cid, ipfsUrl: ipfsVerification.ipfsUrl };
  } catch (error) {
    return { valid: false, error: `IPFS verification failed: ${error.message}`, layer: 'IPFS_ANCHOR', severity: 'HIGH' };
  }
};

const verifyAuditCheckpoint = async (block) => {
  try {
    const checkpointVerification = await auditService.verifyAgainstCheckpoint({ ...block, previousHash: block.previous_hash });
    if (!checkpointVerification.checkpoint) return { valid: false, error: 'No audit checkpoint found', layer: 'AUDIT_CHECKPOINT', severity: 'MEDIUM' };
    if (!checkpointVerification.verified) return { valid: false, error: '🚨 TAMPERING DETECTED', layer: 'AUDIT_CHECKPOINT', severity: 'CRITICAL', details: checkpointVerification.discrepancies };
    return { valid: true, layer: 'AUDIT_CHECKPOINT' };
  } catch (error) {
    return { valid: false, error: `Audit checkpoint failed: ${error.message}`, layer: 'AUDIT_CHECKPOINT', severity: 'HIGH' };
  }
};

const verifyBlockComplete = async (block, previousBlock, secret, difficulty) => {
  const results = { blockIndex: block.index, blockHash: block.hash, entityId: block.entity_id || block.entityId, overall: true, layers: {} };
  
  const hashChainResult = verifyBlock(block, previousBlock, secret, difficulty);
  results.layers.hashChain = hashChainResult;
  if (!hashChainResult.valid) results.overall = false;

  const merkleResult = verifyMerkleRoot(block);
  results.layers.merkleTree = merkleResult;
  if (!merkleResult.valid && merkleResult.severity === 'CRITICAL') results.overall = false;

  const signatureResult = verifyDigitalSignature(block);
  results.layers.digitalSignature = signatureResult;
  if (!signatureResult.valid && signatureResult.severity === 'CRITICAL') results.overall = false;

  const [ipfsResult, auditResult] = await Promise.all([
    verifyIPFSAnchor(block),
    verifyAuditCheckpoint(block)
  ]);
  results.layers.ipfsAnchor = ipfsResult;
  if (!ipfsResult.valid && ipfsResult.severity === 'CRITICAL') results.overall = false;

  results.layers.auditCheckpoint = auditResult;
  if (!auditResult.valid && auditResult.severity === 'CRITICAL') results.overall = false;

  results.failedLayers = Object.values(results.layers).filter(l => !l.valid).length;
  results.criticalFailures = Object.values(results.layers).filter(l => !l.valid && l.severity === 'CRITICAL').length;
  return results;
};

const verifyChain = async (secret, difficulty) => {
  const { data: blocks } = await supabase.from('blockchain_blocks').select('*').order('index', { ascending: true });
  if (!blocks || blocks.length === 0) return { valid: false, error: 'No blocks found', severity: 'CRITICAL' };

  const results = { valid: true, totalBlocks: blocks.length, verifiedBlocks: 0, failedBlocks: 0, blockResults: [], summary: { hashChainFailures: 0, merkleTreeFailures: 0, signatureFailures: 0, ipfsAnchorFailures: 0, auditCheckpointFailures: 0 } };

  for (let i = 1; i < blocks.length; i++) {
    const blockResult = await verifyBlockComplete(blocks[i], blocks[i - 1], secret, difficulty);
    results.blockResults.push(blockResult);
    if (blockResult.overall) results.verifiedBlocks++;
    else {
      results.failedBlocks++;
      results.valid = false;
      if (!blockResult.layers.hashChain?.valid) results.summary.hashChainFailures++;
      if (!blockResult.layers.merkleTree?.valid && blockResult.layers.merkleTree?.severity === 'CRITICAL') results.summary.merkleTreeFailures++;
      if (!blockResult.layers.digitalSignature?.valid && blockResult.layers.digitalSignature?.severity === 'CRITICAL') results.summary.signatureFailures++;
      if (!blockResult.layers.ipfsAnchor?.valid && blockResult.layers.ipfsAnchor?.severity === 'CRITICAL') results.summary.ipfsAnchorFailures++;
      if (!blockResult.layers.auditCheckpoint?.valid && blockResult.layers.auditCheckpoint?.severity === 'CRITICAL') results.summary.auditCheckpointFailures++;
    }
  }
  results.integrityScore = results.totalBlocks > 1 ? ((results.verifiedBlocks / (results.totalBlocks - 1)) * 100).toFixed(2) : 100;
  return results;
};

const verifyEntityHistory = async (entityId) => {
  const { data: blocks } = await supabase.from('blockchain_blocks').select('*').eq('entity_id', entityId).order('index', { ascending: true });
  if (!blocks || blocks.length === 0) return { valid: false, error: 'No blocks found', entityId };

  const results = { valid: true, entityId, totalBlocks: blocks.length, history: [], verificationSummary: { allLayersValid: 0, partiallyValid: 0, invalid: 0 } };
  const { data: allBlocks } = await supabase.from('blockchain_blocks').select('*').order('index', { ascending: true });

  for (const block of blocks) {
    const previousBlock = allBlocks.find(b => b.index === block.index - 1);
    const blockVerification = previousBlock ? await verifyBlockComplete(block, previousBlock, process.env.BLOCKCHAIN_SECRET, parseInt(process.env.BLOCKCHAIN_DIFFICULTY)) : { blockIndex: block.index, overall: true, layers: { hashChain: { valid: true, note: 'Genesis block' } } };

    results.history.push({ ...block, verification: blockVerification });
    if (blockVerification.overall && (blockVerification.failedLayers || 0) === 0) results.verificationSummary.allLayersValid++;
    else if (blockVerification.overall) results.verificationSummary.partiallyValid++;
    else { results.verificationSummary.invalid++; results.valid = false; }
  }
  return results;
};

const detectTamperingPatterns = (verificationResults) => {
  const patterns = { detected: [], riskLevel: 'LOW' };
  if (!verificationResults.layers) return patterns;
  const { hashChain, merkleTree, digitalSignature, ipfsAnchor, auditCheckpoint } = verificationResults.layers;

  if (!auditCheckpoint?.valid) {
    patterns.detected.push({ type: 'CHECKPOINT_VIOLATION', description: '🚨 CRITICAL: Checkpoint violated', riskLevel: 'CRITICAL' });
    patterns.riskLevel = 'CRITICAL';
  }
  if (hashChain?.valid && !digitalSignature?.valid && !ipfsAnchor?.valid) {
    patterns.detected.push({ type: 'HASH_RECALCULATION_ATTACK', description: 'Hash recalculated but signatures invalid', riskLevel: 'CRITICAL' });
    patterns.riskLevel = 'CRITICAL';
  }
  if (hashChain?.valid && !merkleTree?.valid) {
    patterns.detected.push({ type: 'DATA_MANIPULATION', description: 'Transaction data modified', riskLevel: 'HIGH' });
    if (patterns.riskLevel !== 'CRITICAL') patterns.riskLevel = 'HIGH';
  }
  return patterns;
};

module.exports = {
  verifyBlock,
  verifyMerkleRoot,
  verifyDigitalSignature,
  verifyIPFSAnchor,
  verifyAuditCheckpoint,
  verifyBlockComplete,
  verifyChain,
  verifyEntityHistory,
  detectTamperingPatterns
};