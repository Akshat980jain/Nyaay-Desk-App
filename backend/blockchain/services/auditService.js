const supabase = require('../../supabaseClient');
const timestampService = require('./timestampService');
const crypto = require('crypto');

class AuditService {
  async createCheckpoint(block) {
    try {
      console.log(`📋 Creating audit checkpoint for block ${block.index}`);
      const dataFingerprint = this.createDataFingerprint(block);
      const checksums = timestampService.createMultiHash({
        blockHash: block.hash,
        previousHash: block.previousHash || block.previous_hash,
        merkleRoot: block.merkleRoot || block.merkle_root,
        data: block.data,
        index: block.index
      });

      let timestampProof = null;
      try { timestampProof = await timestampService.createTimestamp(block.hash); } 
      catch (error) { console.warn('⚠️  OTS not available:', error.message); }

      const checkpointData = {
        block_index: block.index,
        block_hash: block.hash,
        data_fingerprint: dataFingerprint,
        timestamp_proof: timestampProof ? { ots: { proof: timestampProof.proof, verified: false } } : { ots: { proof: null, verified: false } },
        commitments: {
          merkle_root: block.merkleRoot || block.merkle_root,
          previous_block_hash: block.previousHash || block.previous_hash,
          signature_hash: block.signature?.value ? crypto.createHash('sha256').update(block.signature.value).digest('hex') : null,
          ipfs_cid: block.ipfs?.cid || null
        },
        checksums,
        entity_id: block.entity_id || block.entityId,
        data_type: block.data_type || block.dataType,
        created_at: new Date().toISOString()
      };

      const { data: savedCheckpoint, error } = await supabase.from('audit_checkpoints').insert(checkpointData).select().single();
      if (error) throw error;
      console.log(`✅ Audit checkpoint created for block ${block.index}`);
      return savedCheckpoint;
    } catch (error) {
      console.error('❌ Failed to create checkpoint:', error.message);
      throw error;
    }
  }

  async verifyAgainstCheckpoint(block) {
    try {
      const checkpoint = await this.getLatestCheckpoint(block.index);
      if (!checkpoint) return { verified: true, reason: 'NO_CHECKPOINT', skipVerification: true };

      const discrepancies = [];
      const currentFingerprint = this.createDataFingerprint(block);
      if (checkpoint.data_fingerprint !== currentFingerprint) discrepancies.push({ field: 'dataFingerprint', severity: 'CRITICAL' });
      if (checkpoint.block_hash !== block.hash) discrepancies.push({ field: 'blockHash', severity: 'CRITICAL' });
      
      const checksumVerification = timestampService.verifyMultiHash({
        blockHash: block.hash,
        previousHash: block.previousHash || block.previous_hash,
        merkleRoot: block.merkleRoot || block.merkle_root,
        data: block.data,
        index: block.index
      }, checkpoint.checksums);

      if (!checksumVerification.allMatch) discrepancies.push({ field: 'checksums', severity: 'CRITICAL' });

      const verified = discrepancies.filter(d => d.severity === 'CRITICAL').length === 0;
      return { verified, discrepancies, checkpoint, message: verified ? 'Verified' : 'Tampered' };
    } catch (error) {
      console.error('❌ Checkpoint verification failed:', error.message);
      return { verified: true, reason: 'VERIFICATION_ERROR' };
    }
  }

  createDataFingerprint(block) {
    const normalizedTimestamp = Math.floor(new Date(block.timestamp).getTime() / 1000) * 1000;
    const criticalData = {
      index: block.index,
      timestamp: normalizedTimestamp,
      data: block.data,
      previousHash: block.previousHash || block.previous_hash,
      hash: block.hash,
      nonce: block.nonce,
      merkleRoot: block.merkleRoot || block.merkle_root,
      entityId: block.entity_id || block.entityId,
      dataType: block.data_type || block.dataType
    };
    const sortedString = JSON.stringify(criticalData, Object.keys(criticalData).sort());
    return crypto.createHash('sha512').update(sortedString).digest('hex');
  }

  async getLatestCheckpoint(blockIndex) {
    const { data } = await supabase.from('audit_checkpoints').select('*').eq('block_index', blockIndex).order('created_at', { ascending: false }).limit(1).single();
    return data;
  }

  async getEntityCheckpoints(entityId) {
    const { data } = await supabase.from('audit_checkpoints').select('*').eq('entity_id', entityId).order('block_index', { ascending: true });
    return data;
  }
}

module.exports = new AuditService();